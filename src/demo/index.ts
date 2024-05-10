import { Hono } from 'hono'
import type { Environment } from '#/types'

const DEMO_NAME = 'dr3a.eth'
const DEMO_ADDRESS = '0xeb6b293E9bB1d71240953c8306aD2c8aC523516a'

export const demoRouter = new Hono<{ Bindings: Environment }>().basePath('/v1')

demoRouter.get('/following/:addressOrENS', async context => {
  const id = context.req.param('addressOrENS')
  if (id !== DEMO_NAME && id !== DEMO_ADDRESS) return context.json({ data: [] }, 200)

  const demoKv = context.env.EFP_DEMO_KV
  const data = await demoKv.get('following', 'json')
  return context.json({ data }, 200)
})

demoRouter.get('/followers/:addressOrENS', async context => {
  const id = context.req.param('addressOrENS')
  if (id !== DEMO_NAME && id !== DEMO_ADDRESS) return context.json({ data: [] }, 200)

  const demoKv = context.env.EFP_DEMO_KV
  const data = await demoKv.get('followers', 'json')
  return context.json({ data }, 200)
})

demoRouter.get('/stats/:addressOrENS', async context => {
  const id = context.req.param('addressOrENS')
  if (id !== DEMO_NAME && id !== DEMO_ADDRESS) {
    return context.json({ data: { followersCount: 0, followingCount: 0 } }, 200)
  }

  const demoKv = context.env.EFP_DEMO_KV
  const data = await demoKv.get('stats', 'json')
  return context.json({ data }, 200)
})
