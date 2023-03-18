// @flow

import pluginJson from '../../plugin.json'
import type { ChatResponse, ChatRequest } from './AIFlowTypes'
import { showMessage } from '@helpers/userInput'
import { logDebug, logError, clo, JSP } from '@helpers/dev'

/*
 * CONSTANTS
 */

const baseURL = 'https://api.openai.com/v1'
// const modelsComponent = 'models'
// const completionsComponent = 'completions'
// const availableModels = ['text-davinci-003', 'text-curie-001', 'text-babbage-001', 'text-ada-001', 'gpt-3.5-turbo']

export const CHAT_COMPONENT = 'chat/completions'

function getErrorStringToDisplay(resultJSON: any): string {
  const open = `OpenAI sent back an error message:\n"${resultJSON?.error?.message || ''}"`
  let middle = ''
  switch (resultJSON?.error?.code) {
    case 'insufficient_quota':
      middle = `\n\nDo you have a current credit card on your OpenAI account? If not, you will need to add one. Using OpenAI (chatGPT/DALL-E etc.) is quite inexpensive, but you do need a credit card on file.`
      break
    case 'too_many_requests':
      middle = `\n\nYou have may have made too many API calls in a short period of time or their servers are overloaded.`
      break
    case 'invalid_api_key':
      middle = `\n\nYou need to put a valid OpenAI API key in the plugin preferences for these commands to work properly. Please check your API key on OpenAI's website or create a new one.`
  }
  const close = `\n\nPlease correct the error and try again.`
  return `${open}${middle}${close}`
}

/**
 * Make a request to the GPT API
 * @param {string} component - the last part of the URL (after the base URL), e.g. "models" or "images/generations"
 * @param {string} requestType - GET, POST, PUT, etc.
 * @param {string} data - body of a POST/PUT request - can be an object (it will get stringified)
 * @returns {any|null} JSON results or null
 */
export async function makeRequest(component: string, requestType: string = 'GET', data: any = null): any | null {
  const url = `${baseURL}/${component}`
  logDebug(pluginJson, `makeRequest: about to fetch ${url}`)
  // clo(data, `makeRequest() about to send to: "${url}" data=`)
  const result = await fetch(url, getRequestObj(requestType, data))
  if (result) {
    clo(result, `makeRequest() result of fetch to: "${url}" response is type: ${typeof result} and value:`)
    const resultJSON = JSON.parse(result)
    if (!resultJSON || resultJSON?.error) {
      const msg = resultJSON ? getErrorStringToDisplay(resultJSON) : `No response from OpenAI. Check log.`
      await showMessage(msg)
      clo(resultJSON?.error || {}, `askNewQuestion: Error:`)
      return null
    }
    return resultJSON
  } else {
    // must have failed, let's find out why
    fetch(url, getRequestObj(requestType, data))
      .then((result) => {
        logError(pluginJson, `makeRequest failed the first time but the second response was: ${JSP(result)}`)
      })
      .catch((error) => {
        logError(pluginJson, `makeRequest failed and response was: ${JSP(error)}`)
        showMessage(`Fetch failed: ${JSP(error)}`)
      })
  }
  return null
}

/**
 * Make a request to the GPT API
 * @param {string} method - GET, POST, PUT, etc.
 * @param {any} body - JSON or null
 * @returns {any|null} JSON results or null
 */
export const getRequestObj = (method: string = 'GET', body: any = null): any => {
  const { apiKey } = DataStore.settings
  if (apiKey.length) {
    const obj = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }
    if (body && method !== 'GET') {
      // $FlowFixMe
      obj.body = JSON.stringify(body)
    }
    clo(obj, 'getRequestObj request object is:')
    return obj
  } else {
    showMessage('Please set your API key in the plugin settings')
    logError(pluginJson, 'No API Key found')
  }
}

/****************************************************************************************************************************
 *                             DEBUGGING
 ****************************************************************************************************************************/

/**
 * If the user has enabled saving responses, save the response to the DataStore
 * @param {string} folderName
 * @param {string} question - a short version of the request for use as filename
 * @param {ChatRequest} request
 * @param {ChatResponse} chatResponse
 */
export function saveDebugResponse(folderName: string, question: string, request: ChatRequest, chatResponse: ChatResponse | null) {
  if (chatResponse) {
    const { saveResponses } = DataStore.settings
    if (saveResponses) {
      DataStore.saveJSON(chatResponse, `${folderName}/${question}.${String(request.messages.length / 2)}.json`)
      clo(chatResponse, `chatResponse/${question}.${String(request.messages.length / 2)}.json`)
    }
  }
}
