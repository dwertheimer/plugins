# What's changed in 🔬 Reviews plugin?
See [website README for more details](https://github.com/NotePlan/plugins/tree/main/jgclark.Reviews), and how to configure.

<!--
- ??? Fixed the race condition on (un)pausing a project
- ??? ability to pause/unpause a project, by calling new **/pause project toggle** command or adding/removing `#paused` to a project's metadata. When paused this stops the note from being included in reviews, but keeps it visible in the project lists.
-->
## [0.9.4] - 2023-03-04
### Fixed
- 'start reviews' button not working
- % completion stat for tasks with scheduled dates
- now should only open a new window for 'Markdown' style results when the results aren't already open (requiers NP v3.8.1 to operate)

## [0.9.3] - 2023-03-28
### Fixed
- issue with multi-column displays with little data
- removed a dependency on NP 3.8.1

## [0.9.2] - 2023-02-28
### Changed
- improved display of 0% progress circles (in 'rich' display)
- in Project Lists, dates and intervals should now be display in the locale language
- trying full-width result tables (in 'rich' display)
- explanatory tool tips are now shown for the buttons at the top of the 'rich' display window
- quicker window refresh after clicking 'Mark as Reviewed'
### Added
- new setting 'Hide top level folder?' that will suppress higher-level folder names in project list headings if wished.
### Fixed
- date arithmetic for times to next review should now work regardless of time zone

## [0.9.1] - 2023-02-24
### Fixed
- wasn't showing projects due for review today in 'Start Reviews'

## [0.9.0] - 2023-02-23
### Added
- to speed up reviewing projects when you have the 'Rich' Project List view open, there's now a row of buttons above the table that trigger the following commands: **/finish project review**, **/next project review**, **/complete project**, **/cancel project**, **/pause project toggle**. They work on whatever is the project note that's in NotePlan's main editor window (suggested by @John1).
- the Project list view(s) now automatically update after finishing a review, or completing or cancelling a project.
- can now show more than one review #type in the HTML view.

### Changed
- now picks up `reviewed()` and the other pieces of metadata from anywhere in the note, not just the "metadata line" right after tht title.
- now writes to the yearly note on project completion or cancellation (if wanted), rather than a note in the Summaries folder.
- now uses plugin "Shared Resources" to deliver font resources for "Rich" style
- can now write both 'Markdown' and 'Rich' style outputs each time.
- tasks scheduled to the future are now not counted in the % completion figures
- clarified the special #hashtags to use on project metadata lines: now just `#paused`; `#archive` is retired.
- only writes HTML file copy if using DEBUG mode.

### Fixed
- improved notes in lists when projects are completed or cancelled (avoids 'NaN' message @edgaulthier found)
- fixed count of notes to review
- fixed some sorting issues in 'review date' output

<!--
## [0.9.0-beta7] - 2023-02-12
### Changed
- tidied up the "Rich" (HTML) display type, which now includes possibility of multiple columns of output if your window is wide enough.
- now picks up `reviewed()` and the other pieces of metadata from anywhere in the note, not just the "metadata line" right after tht title.
- removed the "Toggle Pause" button for now, as there are issues with it. The "/pause project toggle" still works.
- now writes to the yearly note on project completion or cancellation (if wanted), rather than a note in the Summaries folder.
- disabled some older test commands

### Fixed
- fixed some sorting issues in 'review date' output

## [0.9.0-beta6] - 2022-11-04
### Added
- To speed up reviewing projects when you have the 'Rich' Project List view open, there's now a row of buttons above the table that trigger the following commands: **/finish project review**, **/next project review**, **/complete project**, **/cancel project**, **/pause project toggle**. They work on whatever is the project note that's in NotePlan's main editor window (suggested by @John1).
- Ability to pause/unpause a project, by calling new **/pause project toggle** command or adding/removing `#paused` to a project's metadata. When paused this stops the note from being included in reviews, but keeps it visible in the project lists.
- The Project list view(s) now automatically update after finishing a review, or completing or cancelling a project.
- Can now show more than one review #type in the HTML view.

### Changed
- Can now write both 'Markdown' and 'Rich' style outputs each time.
- Can now save 'Markdown' view as well as showing the 'Rich' style for "/project lists"
- Tasks scheduled to the future are now not counted in the % completion figures
- Clarified the special #hashtags to use on project metadata lines: now just `#paused`; `#archive` is retired.
- Only write HTML file copy if using DEBUG mode.

### Fixed
- Improved notes in lists when projects are completed or cancelled (avoids 'NaN' message @edgaulthier found)
- Fixed count of notes to review
-->

## [0.8.0] - 2022-10-10
This is a major new version of the **/project lists** command:
### Added
- option for '**Rich**' style output which shows a list in a new window complete with coloured progress rings and tables (requires NotePlan 3.7)
- now opens the new review list note (if previous '**NotePlan**' style used)
- project progress is now shown either as your most recent `Progress:` field, or as the stats it can calculate (e.g. `75% done (of 32 tasks)`)
- new 'Refresh' button to update the review list (in either style) (suggested by @George65)
- new option 'Display dates?' that can suppress printing project dates if you want (for @LaurenaRehbein)
- new option 'Display progress?' that can suppress printing project progress if you want (for @LaurenaRehbein)
- now can be triggered by an x-callback call (see README for details)
### Changes
- now removes folders with no active projects from the output lists
- now hides the progress spinner when running background updates

## [0.7.1] - 2022-08-03
### Fixed
- fixed crashes, and updated logging

## [0.7.0] - 2022-07-14
### Added
- Now automatically update hidden list of reviews where necessary, avoiding some warning messages.

## [0.6.5] - 2022-06-13
### Added
- % completion to project summary lines (with the /project lists command) (for @DocJulien)
- includes a count of 'future tasks' in project summary lines

## [0.6.4] - 2022-05-13
### Added
- new setting 'Confirm next review' to allow turning off the confirmation dialog before the next review starts from the '/next project review' command (default is now false)

## [0.6.3] - 2022-05-01
### Fixed
- configuration problem, potentially leading to NP crash (reported by @Harv)

## [0.6.2] - 2022-04-25
### Added
- added 6 new settings, to allow you to change the various special project strings from '@start', '@completed', '@cancelled', '@due', '@review' and '@reviewed' to ones of your own choosing.
### Changed
- change to newer logging system
- remove ability to use older _configuration note; now all settings come through the Plugin preference pane's Settings screen.

## [0.6.1] - 2022-02-04
### Changed
- now using new Configuration UI system instead of _configuration.

## [0.6.0] - 2022-01-27
### Added
- new  `/cancel project` command that works analagously to the `/complete project` command
- added new 'finishedListHeading' string setting for these two commands. See README for details.
### Changed
- improved output of `/complete project` and `/cancel project` commands
- re-factored code to make more re-usable

## [0.5.2] - 2022-01-21
### Added
- progress indicator when running longer commands
- `/complete project` now also adds note to a yearly note in Summaries folder (if the folder exists), and offers to move the note to the NotePlan Archive.

## [0.5.1] - 2022-01-03
### Changed
- removed `addProject` command. I've realised the equivalent is now available already by setting up the `/qtn` command in Templates plugin. See my [README](README.md) for details.

## [0.5.0] - 2021-12-28
### Changed
- the `foldersToExclude` setting now means `/startReviews` and `projectLists` commands ignore any sub-folders of the specified ones as well
- tweaked the output to show overdue reviews in **bold**
- improved code documentation

### Fixed
- will no longer ignore notes in the root folder (thanks to @Matthias for the report)

## [0.4.4..0.4.5] - 2021-12-09
### Fixed
- /projectList could fail on invalid `@due()` dates; made the metadata line reader more resilient

## [0.4.1..0.4.3] - 2021-10-24
### Fixed
- updated some warning messages
- found that NP strips out hash symbols from note titles; this led to duplicate Review notes (later reported as #138 by @codedungeon)
- typo in default configuration that gets copied to _configuration

## [0.4.0] - 2021-09-10
### Added
- new command `/addProject` that adds a new note using your template 'New Project Template' (if defined)

### Changed
- under-the-hood change: the `/startReviews` and `nextReview` commands now use the (invisible) preferences system available from v3.1.0, rather than the (visible) `_reviews` note. _This requires NotePlan v3.1.0 (build 654) or greater._

## [0.3.0] - 2021-08-21
### Added
- new support for projects labelled `#cancelled` or `#someday` -- these are marked differently in the output lists
- new setting `displayArchivedProjects` which for the command `/projectLists` controls whether to display project notes marked `#archive`
### Changed
- update: changes the `noteTypeTags` setting to be an array of strings not a comma-separated string. E.g. `noteTypeTags: ["#area", "#project"]`

## [0.2.1..0.2.3] - 2021-08-01
### Added
- new command `/completeProject` that adds a `@completed(today)` date,
- new setting `foldersToIgnore` that allows an array of folder names to ignore in the commands

### Fixed
- contents of sub-folders were being duplicated in the lists
