import type { Hono } from 'hono'
import type { Services } from '#/service'
import type { Environment } from '#/types'
import { formatSVG } from './tokenImage'

export function image(token: Hono<{ Bindings: Environment }>): Hono<{ Bindings: Environment }> {
  token.get('/image/:token_id', context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id))) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    const svg = formatSVG(token_id)
    context.header('Content-Type', 'image/svg+xml;charset=utf-8')
    return context.body(svg)
  })
  return token
}
