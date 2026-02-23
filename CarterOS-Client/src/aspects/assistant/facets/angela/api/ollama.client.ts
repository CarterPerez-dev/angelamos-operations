/**
 * Angela AI Assistant - Ollama LLM Client
 */

import { getAngelaConfig, ANGELA_SYSTEM_PROMPT } from '../config'
import type { OllamaMessage, OllamaStreamChunk } from '../types'

export async function* streamChat(
  messages: OllamaMessage[],
  signal?: AbortSignal
): AsyncGenerator<string, string, unknown> {
  const config = getAngelaConfig()

  const systemMessage: OllamaMessage = {
    role: 'system',
    content: ANGELA_SYSTEM_PROMPT,
  }

  const response = await fetch(`${config.ollama.endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.model,
      messages: [systemMessage, ...messages],
      stream: true,
      options: {
        temperature: config.ollama.temperature,
        num_predict: config.ollama.maxTokens,
      },
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let fullResponse = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      try {
        const data: OllamaStreamChunk = JSON.parse(line)
        if (data.message?.content) {
          fullResponse += data.message.content
          yield data.message.content
        }
      } catch {
        continue
      }
    }
  }

  return fullResponse
}

export async function chat(messages: OllamaMessage[]): Promise<string> {
  let result = ''
  for await (const chunk of streamChat(messages)) {
    result += chunk
  }
  return result
}

export async function checkOllamaHealth(): Promise<boolean> {
  const config = getAngelaConfig()
  try {
    const response = await fetch(`${config.ollama.endpoint}/api/tags`, {
      method: 'GET',
    })
    return response.ok
  } catch {
    return false
  }
}
