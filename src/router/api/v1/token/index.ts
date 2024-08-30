import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, RankRow } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'
import type { Address } from '#/types/index'
import { formatSVG } from './tokenImage'

export function token(services: Services): Hono<{ Bindings: Environment }> {
  const token = new Hono<{ Bindings: Environment }>()

  token.get('/:token_id', async context => {
    const { token_id } = context.req.param()

    const ensService = services.ens(env(context))
    const efp: IEFPIndexerService = services.efp(env(context))
    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(listUser.toLowerCase())
    const primaryList = await efp.getUserPrimaryList(address)
    const isPrimary = primaryList?.toString() === token_id

    const data = {
      ens: { address, ...ens },
      ranks: await efp.getUserRanks(address),
      followers_count: await efp.getUserFollowersCountByList(token_id),
      following_count: await efp.getUserFollowingCountByList(token_id),
      is_primary: isPrimary
    }

    const svg = formatSVG(token_id, data)
    context.header('Content-Type', 'image/svg+xml;charset=utf-8')
    return context.body(svg)
  })
  return token
}
