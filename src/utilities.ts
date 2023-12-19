import { apiLogger } from '#/logger.ts'

export async function fetcher<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options?.headers }
  })
  if (!response.ok) {
    apiLogger.error(`Failed to fetch ${url}: ${response.statusText} - ${await response.text()}`)
    raise(await response.text())
  }
  const data = (await response.json()) as T
  return data
}

export function raise(error: unknown): never {
  throw typeof error === 'string' ? new Error(error) : error
}
