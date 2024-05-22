import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { validator } from 'hono/validator'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'

export function relationships(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get(
    '/:addressOrENS/relationships',
    validator('query', value => {
      const { tag, direction } = <Record<'tag' | 'direction', string | undefined>>value

      // Check if both tag and direction are present
      if (!(tag && direction)) {
        throw new Error('Both "tag" and "direction" query parameters are required')
      }

      // Validate and map shorthand values for 'direction'
      const validDirections = ['incoming', 'outgoing', 'in', 'out']
      if (!validDirections.includes(direction)) {
        throw new Error('The "direction" parameter must be "incoming", "outgoing", "in", or "out"')
      }

      // Map shorthand values to full forms
      if (direction === 'in') value['direction'] = 'incoming'
      if (direction === 'out') value['direction'] = 'outgoing'

      return value
    }),
    async context => {
      const addressOrENS = context.req.param().addressOrENS
      let { tag, direction } = context.req.query()

      if (direction === 'in') direction = 'incoming'
      if (direction === 'out') direction = 'outgoing'

      const address: Address = await services.ens().getAddress(addressOrENS)

      const efp: IEFPIndexerService = services.efp(env(context))
      let relationships: any[] = []
      // an english description of the relationship
      let description = ''
      if (direction === 'incoming') {
        relationships = await efp.getIncomingRelationships(address, tag as string)
        description = `EFP Lists which include the address "${address}" with tag "${tag}"`
      } else if (direction === 'outgoing') {
        relationships = (await efp.getOutgoingRelationships(address, tag as string)).map(r => {
          return {
            version: r.version,
            recordType: r.recordType === 1 ? 'address' : `${r.recordType}`,
            data: `0x${r.data.toString('hex')}`,
            tags: r.tags
          }
        })
        description = `EFP List Records tagged "${tag}" by "${address}" on primary list`
      }

      // Placeholder response until further implementation
      return context.json({ description, direction, tag, relationships }, 200)
    }
  )
}
