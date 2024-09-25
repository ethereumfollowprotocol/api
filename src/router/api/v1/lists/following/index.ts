import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowingResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { textOrEmojiPattern } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

/**
 * Enhanced to add ENS support
 */
export function following(lists: Hono<{ Bindings: Environment }>, services: Services) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  lists.get('/:token_id/following', includeValidator, async context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id))) {
      return context.json({ response: 'Invalid list id' }, 400)
    }

    let { offset, limit } = context.req.valid('query')
    if (!limit || Number.isNaN(limit)) limit = '10'
    if (!offset || Number.isNaN(offset)) offset = '0'

    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)

    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }

    const tagsQuery = context.req.query('tags')
    let tagsToSearch: string[] = []
    if (tagsQuery) {
      const tagsArray = tagsQuery.split(',')
      tagsToSearch = tagsArray.filter((tag: any) => tag.match(textOrEmojiPattern))
    }

    let direction = 'latest'
    if (context.req.query('sort')?.toLowerCase() === 'followers') {
      direction = 'followers'
    } else if (context.req.query('sort')?.toLowerCase() === 'earliest') {
      direction = 'earliest'
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: FollowingResponse[] = await efp.getUserFollowingByListTagSort(
      token_id,
      limit as string,
      offset as string,
      tagsToSearch,
      direction
    )

    let response: ENSFollowingResponse[]

    // Check if 'ens' information should be included
    if (context.req.query('include')?.includes('ens')) {
      const ensService = services.ens(env(context))
      // Filter for address records
      const addressRecords = followingListRecords.filter(record => record.recordType === 1)

      // Fetch ENS profiles in batch
      const addresses: Address[] = addressRecords.map(record => hexlify(record.data))
      const ensProfiles: ENSProfile[] = []
      for (const address of addresses) {
        const profile = await ensService.getENSProfile(address)
        ensProfiles.push(profile)
      }
      // Collect ENS profiles into a lookup map by address
      const ensMap: Map<Address, ENSProfileResponse> = new Map(
        addresses.map((address, index) => {
          if (!ensProfiles[index]?.name) {
            return [address, { name: '', address: address, avatar: null } as unknown as ENSProfileResponse]
          }
          return [address, ensProfiles[index] as ENSProfileResponse]
        })
      )

      // Aggregate ENS profiles back into the full list
      response = followingListRecords.map(record => {
        return record.recordType !== 1
          ? prettifyListRecord(record)
          : { ...prettifyListRecord(record), ens: ensMap.get(hexlify(record.data)) as ENSProfileResponse }
      })
    } else {
      // If ENS is not included, just map the following list records to the pretty format
      response = followingListRecords.map(prettifyListRecord)
    }

    return context.json({ following: response }, 200)
  })
}
