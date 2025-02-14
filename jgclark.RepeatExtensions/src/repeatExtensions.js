// @flow
//-----------------------------------------------------------------------
// Repeat Extensions plugin for NotePlan
// Jonathan Clark
// last updated 14.3.2023 for v0.5.2
//-----------------------------------------------------------------------

import pluginJson from "../plugin.json"
import {
  calcOffsetDate,
  calcOffsetDateStr,
  getISOWeekString,
  isDailyNote,
  isWeeklyNote,
  RE_DATE, // find dates of form YYYY-MM-DD
  RE_DATE_INTERVAL,
  RE_DATE_TIME,
  RE_DONE_DATE_TIME,
  RE_DONE_DATE_TIME_CAPTURES,
  RE_SCHEDULED_DAILY_NOTE_LINK,
  RE_SCHEDULED_WEEK_NOTE_LINK,
  RE_TIME, // find '12:23' with optional '[ ][AM|PM|am|pm]'
  unhyphenateString,
} from '@helpers/dateTime'
import {
  getNPWeekData,
  type NotePlanWeekInfo
} from '@helpers/NPdateTime'
import { logDebug, logInfo, logWarn, logError } from "@helpers/dev"
import { logAllEnvironmentSettings } from "@helpers/NPdev"
import { displayTitle, rangeToString } from '@helpers/general'
import { findEndOfActivePartOfNote } from '@helpers/paragraph'
import { selectedLinesIndex } from '@helpers/NPparagraph'
import { showMessage } from '@helpers/userInput'

//------------------------------------------------------------------
// Regexes

const RE_EXTENDED_REPEAT = `@repeat\\(${RE_DATE_INTERVAL}\\)` // find @repeat()
const RE_EXTENDED_REPEAT_CAPTURE = `@repeat\\((.*?)\\)` // find @repeat() and return part inside brackets

//------------------------------------------------------------------
/**
 * Respond to onEditorWillSave trigger for the currently open note
 */
export async function onEditorWillSave(): Promise<void> {
  try {
    if (Editor.content && Editor.note) {
      const latestContent = Editor.content ?? ''
      const noteReadOnly: CoreNoteFields = Editor.note
      const previousContent = noteReadOnly.versions[0].content
      const timeSinceLastEdit: number = Date.now() - noteReadOnly.versions[0].date

      logDebug(pluginJson, `onEditorWillSave triggered for '${noteReadOnly.filename}' with ${noteReadOnly.versions.length} versions; last triggered ${String(timeSinceLastEdit)}ms ago`)
      // logDebug(pluginJson, `- previous version: ${String(noteReadOnly.versions[0].date)} [${previousContent}]`)
      // logDebug(pluginJson, `- new version: ${String(Date.now())} [${latestContent}]`)

      // first check to see if this has been called in the last 2000ms: if so don't proceed, as this could be a double call.
      if (timeSinceLastEdit <= 2000) {
        logDebug(pluginJson, `onEditorWillSave fired, but ignored, as it was called only ${String(timeSinceLastEdit)}ms after the last one`)
        return
      }

      // Get changed ranges
      const ranges = NotePlan.stringDiff(previousContent, latestContent)
      if (!ranges || ranges.length === 0) {
        logDebug(`No ranges returned, so stopping.`)
        return
      }
      const earliestStart = ranges[0].start
      let latestEnd = ranges[ranges.length - 1].end
      const overallRange: TRange = Range.create(earliestStart, latestEnd)
      logDebug('repeatExtensions/onEditorWillSave', `- overall changed content from ${rangeToString(overallRange)}`)
      // Get changed lineIndexes

      // earlier method for changedExtent based on character region, which didn't seem to always include all the changed parts.
      // const changedExtent = latestContent?.slice(earliestStart, latestEnd)
      // Editor.highlightByIndex(earliestStart, latestEnd - earliestStart)
      // logDebug('repeatExtensions/onEditorWillSave', `Changed content extent: <${changedExtent}>`)

      // Newer method uses changed paragraphs: this will include more than necessary, but that's more useful in this case
      let changedExtent = ''
      const [startParaIndex, endParaIndex] = selectedLinesIndex(overallRange, Editor.paragraphs)
      logDebug('repeatExtensions/onEditorWillSave', `- changed lines ${startParaIndex}-${endParaIndex}`)
      // Editor.highlightByIndex(earliestStart, latestEnd - earliestStart)
      for (let i = startParaIndex; i <= endParaIndex; i++) {
        changedExtent += Editor.paragraphs[i].content
      }
      logDebug('repeatExtensions/onEditorWillSave', `Changed content extent: <${changedExtent}>`)

      // If the changed text includes @done(...) then we may have something to update, so run repeats()
      if (changedExtent.match(RE_DONE_DATE_TIME) && changedExtent.match(RE_EXTENDED_REPEAT)) {
        // Call main repeat() function, but don't show if there are no repeats found
        await repeats(false) // i.e. run silently
      }
    } else {
      throw new Error("Cannot get Editor details. Is there a note open in the Editor?")
    }
  } catch (error) {
    logError(pluginJson, error.message)
  }
}

/**
 * Process any completed (or cancelled) tasks with my extended @repeat(..) tags,
 * and also remove the HH:MM portion of any @done(...) tasks.
 * When interval is of the form '+2w' it will duplicate the task for 2 weeks after the date is was completed.
 * When interval is of the form '2w' it will duplicate the task for 2 weeks after the date the task was last due. If this can't be determined, then default to the first option.
 * Valid intervals are [0-9][bdwmqy].
 * To work it relies on finding @done(YYYY-MM-DD HH:MM) tags that haven't yet been shortened to @done(YYYY-MM-DD).
 * It includes cancelled tasks as well; to remove a repeat entirely, remove the @repeat tag from the task in NotePlan.
 * Note: The new repeat date is by default scheduled to a day (>YYYY-MM-DD).
 * But if the scheduled date is a week date (YYYY-Wnn), or the repeat is in a weekly note, then the new repeat date will be a scheduled week link (>YYYY-Wnn).
 * Note: Runs on the currently open note (using Editor.* funcs)
 * Note: Could add a 'Newer' mode of operation according to #351.
 * TEST: fails to appendTodo to note with same stem?
 * @author @jgclark
 * @param {CoreNoteFields} noteIn?
 */
export async function repeats(showMessages: boolean = true): Promise<void> {
  try {
    // Get passed note details, or fall back to Editor
    // Note: v0.5.2 changed this to run from 'Editor.note' only
    // let note: CoreNoteFields
    // let showMessages: boolean
    // if (noteIn) {
    //   note = noteIn
      // let showMessages = false
    // } else {
      if (!Editor.note) {
        throw new Error(`repeats: Couldn't get Editor.note to process`)
      }
    //   note = Editor.note
    //   showMessages = true
    // }
    const { paragraphs, title, type, filename, note } = Editor
    if (note === null || paragraphs === null) {
      // No note open, or no paragraphs (perhaps empty note), so don't do anything.
      logError(pluginJson, 'No note open, or empty note.')
      return
    }
    let lineCount = paragraphs.length

    // check if the last paragraph is undefined, and if so delete it from our copy
    if (paragraphs[lineCount] === null) {
      lineCount--
    }

    // work out where ## Done or ## Cancelled sections start, if present
    const endOfActive = findEndOfActivePartOfNote(note)

    logDebug(pluginJson, `Starting for '${filename}' for ${endOfActive} active lines, showMessages: ${String(showMessages)}`)
    logAllEnvironmentSettings()

    let repeatCount = 0
    let line = ''
    let updatedLine = ''
    let completedDate = ''
    let completedTime = ''
    let reReturnArray: Array<string> = []

    // Go through each line in the active part of the file
    for (let n = 0; n <= endOfActive; n++) {
      const p = paragraphs[n]
      line = p.content
      updatedLine = ''
      completedDate = ''

      // find lines with datetime to shorten, and capture date part of it
      // i.e. @done(YYYY-MM-DD HH:MM[AM|PM])
      // logDebug('repeats', `  [${n}] ${line}`)
      if (p.content.match(RE_DONE_DATE_TIME)) {
        // get completed date and time
        reReturnArray = line.match(RE_DONE_DATE_TIME_CAPTURES) ?? []
        completedDate = reReturnArray[1]
        completedTime = reReturnArray[2]
        logDebug('repeats', `- Found completed repeat ${completedDate} ${completedTime} in line ${n}`)

        // remove time string from completed date-time
        updatedLine = line.replace(completedTime, '') // couldn't get a regex to work here
        p.content = updatedLine
        // Send the update to the Editor
        Editor.updateParagraph(p)
        logDebug('repeats', `- updated Para ${p.lineIndex} -> <${updatedLine}>`)

        // Test if this is one of my special extended repeats
        if (updatedLine.match(RE_EXTENDED_REPEAT)) {
          repeatCount++
          let newRepeatDateStr = ''
          let newRepeatDate: Date
          let outputLine = ''

          // get repeat to apply
          reReturnArray = updatedLine.match(RE_EXTENDED_REPEAT_CAPTURE) ?? []
          let dateIntervalString: string = (reReturnArray.length > 0) ? reReturnArray[1] : ''
          logDebug('repeats', `- Found EXTENDED @repeat syntax: '${dateIntervalString}'`)

          // decide style of new date: daily or weekly link
          let timeframe = 'day'
          if (updatedLine.match(RE_SCHEDULED_WEEK_NOTE_LINK) || isWeeklyNote(note)) {
            timeframe = 'week'
          }
          // TODO: use this in >day case in weekly note
          logDebug('repeats', `- timeframe: ${timeframe} from ${String(updatedLine.match(RE_SCHEDULED_WEEK_NOTE_LINK))} / ${String(isWeeklyNote(note))}`)

          if (dateIntervalString[0].startsWith('+')) {
            // New repeat date = completed date (of form YYYY-MM-DD) + interval
            dateIntervalString = dateIntervalString.substring(
              1,
              dateIntervalString.length,
            )
            newRepeatDateStr = calcOffsetDateStr(completedDate, dateIntervalString)
            newRepeatDate = calcOffsetDate(completedDate, dateIntervalString) ?? new Date()
            logDebug('repeats', `- Adding from completed date -> ${newRepeatDateStr}, ${String(newRepeatDate)}`)
            // Remove any >date
            // Note: ' >'+RE_DUE_DATE, but can't get regex to work with variables like this
            updatedLine = updatedLine.replace(/\s+>\d{4}-[01]\d{1}-\d{2}/, '')
            // TODO: or week version?
            logDebug('repeats', `- updatedLine: ${updatedLine}`)

          } else {
            // New repeat date = due date + interval
            // look for the due date (>YYYY-MM-DD)
            let dueDate = ''
            const dueDateArray = RE_SCHEDULED_DAILY_NOTE_LINK.test(updatedLine)
              ? updatedLine.match(RE_SCHEDULED_DAILY_NOTE_LINK)
              : RE_SCHEDULED_WEEK_NOTE_LINK.test(updatedLine)
                ? updatedLine.match(RE_SCHEDULED_WEEK_NOTE_LINK)
                : []
            logDebug('repeats', `- dueDateArray: ${String(dueDateArray)}`)
            if (dueDateArray && dueDateArray[0] != null) {
              dueDate = dueDateArray[0].split('>')[1]
              // logDebug('repeats', `  due date match => ${dueDate}`)
              // need to remove the old due date
              updatedLine = updatedLine.replace(` >${dueDate}`, '')
            } else {
              // but if there is no due date then treat that as today
              dueDate = completedDate
              logDebug('repeats', `- no match => use completed date ${dueDate}`)
            }
            newRepeatDateStr = calcOffsetDateStr(dueDate, dateIntervalString)
            newRepeatDate = calcOffsetDate(dueDate, dateIntervalString) ?? new Date()
            logDebug('repeats', `- adding from due date -> ${newRepeatDateStr}, ${String(newRepeatDate)}`)
          }

          outputLine = updatedLine.replace(/@done\(.*\)/, '').trim()

          // Create and add the new repeat line
          if (type === 'Notes') {
            // ...either in same project note, including new scheduled date
            outputLine += ` >` + newRepeatDateStr
            logDebug(pluginJson, `- outputLine: <${outputLine}>`)
            await Editor.insertParagraphBeforeParagraph(outputLine, p, 'open')
            logDebug(pluginJson, `- Inserted new para after line ${p.lineIndex}`)
          }
          else {
            // ... or in the future Calendar note
            // let futureNote
            // let newRepeatDateStr = ''
            // if (isDailyNote(note)) {
            //   // Get YYYY-MM-DD style date
            //   newRepeatDateStr = unhyphenateString(newRepeatDateStr)
            // }
            // else if (isWeeklyNote(note)) {
            //   // Get YYYY-Wnn style date
            //   // older version, but doesn't align with NP user week-start setting
            //   // newRepeatDateStr = getISOWeekString(newRepeatDateStr)
            //   // newer version, using helper that takes week-start into account
            //   // $FlowFixMe[incompatible-type]
            //   const weekInfo: NotePlanWeekInfo = getNPWeekData(newRepeatDateStr)
            //   newRepeatDateStr = weekInfo.weekString
            // }
            logInfo(pluginJson, `- repeat -> ${newRepeatDateStr}`)

            // Grr: can't use this next one, as it doesn't support undefined notes
            // let futureNote = await DataStore.calendarNoteByDateString(newRepeatDateStr)
            let futureNote = await DataStore.calendarNoteByDate(newRepeatDate, timeframe)
            if (futureNote != null) {
              // Add todo to future note
              logDebug(pluginJson, futureNote.filename)
              await futureNote.appendTodo(outputLine)
              logDebug(pluginJson, `- Appended new repeat in calendar note ${displayTitle(futureNote)}`)
            } else {
              // After a fix to future calendar note creation in r635, we shouldn't get here.
              // But just in case, we'll insert new repeat into the open note
              outputLine += ` >${newRepeatDateStr}`
              logDebug('repeats', `- outputLine: ${outputLine}`)
              await Editor.insertParagraphBeforeParagraph(outputLine, p, 'open')
              logDebug('repeats', `- Couldn't get futureNote, so instead inserted new para after line ${p.lineIndex} in original note`)
            }
          }
        }
      }
    }
    if (repeatCount === 0) {
      logWarn('repeats', 'No suitable completed repeats found')
      if (showMessages) {
        await showMessage('No suitable completed repeats found', 'OK', 'Repeat Extensions')
      }
    }
  } catch (error) {
    logError(`${pluginJson}/repeats`, error.message)
  }
}
