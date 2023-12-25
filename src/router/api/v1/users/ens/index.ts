import type { Hono } from 'hono'
import type { Services } from '#/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'

export function ens(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:ensOrAddress/ens', async context => {
    const { ensOrAddress } = context.req.param()
    console.log(JSON.stringify(ensOrAddress, undefined, 2))

    const ensProfile: ENSProfile = await services.ens().getENSProfile(ensOrAddress)
    return context.json({ ens: ensProfile }, 200)
  })
}
