import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, RankRow } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'
import type { Address } from '#/types/index'

export function metadata(token: Hono<{ Bindings: Environment }>, _services: Services): Hono<{ Bindings: Environment }> {
  token.get('/metadata/:token_id', context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id))) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    // const ensService = services.ens(env(context))
    // const efp: IEFPIndexerService = services.efp(env(context))
    // const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    // if (!listUser) {
    //   return context.json({ response: 'Not Found' }, 404)
    // }
    // const { address, ...ens }: ENSProfile = await ensService.getENSProfile(listUser.toLowerCase())
    // const primaryList = await efp.getUserPrimaryList(address)
    // const isPrimary = primaryList?.toString() === token_id

    // const ranksAndCounts = await efp.getUserRanksCounts(address)
    // const data = {
    //   ens: { address, ...ens },
    //   //   ranks: {
    //   //     mutuals_rank: ranksAndCounts.mutuals_rank,
    //   //     followers_rank: ranksAndCounts.followers_rank,
    //   //     following_rank: ranksAndCounts.following_rank,
    //   //     top8_rank: ranksAndCounts.top8_rank,
    //   //     blocks_rank: ranksAndCounts.blocks_rank
    //   //   },
    //   //   followers_count: ranksAndCounts.followers,
    //   //   following_count: ranksAndCounts.following,
    //   is_primary: isPrimary
    // }
    const url = context.req.url
    const rootUrl = url.split('/token/metadata')[0]
    const metadata = {
      name: `EFP List #${token_id}`,
      description: 'Ethereum Follow Protocol (EFP) is an onchain social graph protocol for Ethereum accounts.',
      image: `${rootUrl}/token/image/${token_id}`,
      external_url: `https://testing.ethfollow.xyz/${token_id}`,
      attributes: [
        // {
        //   trait_type: 'User',
        //   value: data.ens.name
        // },
        // {
        //   trait_type: 'Primary List',
        //   value: data.is_primary
        // }
        // {
        //   trait_type: 'Followers',
        //   value: data.followers_count
        // },
        // {
        //   trait_type: 'Following',
        //   value: data.following_count
        // },
        // {
        //   trait_type: 'Mutuals Rank',
        //   value: data.ranks.mutuals_rank
        // },
        // {
        //   trait_type: 'Followers Rank',
        //   value: data.ranks.followers_rank
        // },
        // {
        //   trait_type: 'Following Rank',
        //   value: data.ranks.following_rank
        // },
        // {
        //   trait_type: 'Blocked Rank',
        //   value: data.ranks.blocks_rank ?? '0'
        // }
      ]
    }

    return context.json(metadata, 200)
  })
  return token
}
