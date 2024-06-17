import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, StateResponse } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function buttonState(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/:addressOrENS/buttonState', async context => {
    const { token_id, addressOrENS } = context.req.param()
    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
        return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const state: StateResponse = await efp.getListFollowingState(token_id, address)

    return context.json({ token_id, address, state }, 200)
  })
}
