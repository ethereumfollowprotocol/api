export const runtime =
  globalThis['navigator']?.['userAgent'] === 'Cloudflare-Workers'
    ? 'workerd'
    : globalThis['process']?.['release']?.['name'] === 'node'
    ? 'node'
    : !!globalThis['Bun'] || !!globalThis['process']?.['versions']?.['bun']
    ? 'bun'
    : 'unknown'

export function raise(error: unknown): never {
  throw typeof error === 'string' ? new Error(error) : error
}

export function parseBaseURL(_url: URL | string) {
  const url = typeof _url === 'string' ? new URL(_url) : _url
  return `${url.protocol}//${url.host}`
}
