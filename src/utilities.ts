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

export function urlSearchParams(
  params: Record<string, string | number | boolean | undefined | null>
) {
  return new URLSearchParams(
    JSON.parse(
      JSON.stringify({
        ...params
      })
    ) as Record<string, string>
  )
}

export function raise(error: unknown): never {
  throw typeof error === 'string' ? new Error(error) : error
}

export function parseBaseURL(_url: URL | string) {
  const url = typeof _url === 'string' ? new URL(_url) : _url
  return `${url.protocol}//${url.host}`
}

export const runtime =
  globalThis['navigator']?.['userAgent'] === 'Cloudflare-Workers'
    ? 'workerd'
    : globalThis['process']?.['release']?.['name'] === 'node'
    ? 'node'
    : !!globalThis['Bun'] || !!globalThis['process']?.['versions']?.['bun']
    ? 'bun'
    : 'unknown'
