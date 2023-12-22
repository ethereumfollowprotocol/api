import { Hono } from 'hono'

const DEMO_NAME = 'dr3a.eth'
const DEMO_ADDRESS = '0xeb6b293E9bB1d71240953c8306aD2c8aC523516a'

export const demoRouter = new Hono().basePath('/v1')

demoRouter.get('/following/:ensOrAddress', async context => {
  const id = context.req.param('ensOrAddress')
  if (id !== DEMO_NAME && id !== DEMO_ADDRESS) return context.json({ data: [] }, 200)

  const { default: demoData } = await import('#/demo/data.json')
  return context.json({ data: demoData.following }, 200)
})

demoRouter.get('/followers/:ensOrAddress', async context => {
  const id = context.req.param('ensOrAddress')
  if (id !== DEMO_NAME && id !== DEMO_ADDRESS) return context.json({ data: [] }, 200)

  const { default: demoData } = await import('#/demo/data.json')
  return context.json({ data: demoData.followers }, 200)
})

demoRouter.get('/stats/:ensOrAddress', async context => {
  const id = context.req.param('ensOrAddress')
  if (id !== DEMO_NAME && id !== DEMO_ADDRESS) {
    return context.json({ data: { followersCount: 0, followingCount: 0 } }, 200)
  }

  const { default: demoData } = await import('#/demo/data.json')
  return context.json({ data: demoData.stats }, 200)
})
