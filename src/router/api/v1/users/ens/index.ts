import type { Hono } from 'hono'

import type { Services } from '#/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'

export function ens(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/ens', async context => {
    const { addressOrENS } = context.req.param()

    const ensProfile: ENSProfile = await services.ens().getENSProfile(addressOrENS)
    return context.json({ ens: ensProfile }, 200)
  })

  users.get('/:addressOrENS/ens/avatar', async context => {
    const { addressOrENS } = context.req.param()

    const imageUrl = await services.ens().getENSAvatar(addressOrENS)
    return context.redirect(imageUrl, 302)
  })

  users.post('/ens/avatar/batch', async context => {
    const ids = await context.req.json<string[]>()
    if (!Array.isArray(ids)) {
      return context.json({ message: 'Expected an array of ens names or addresses' }, 400)
    }

    const idsWithImages = await services.ens().batchGetENSAvatars(ids)
    return context.json(idsWithImages, 200)
  })
}
