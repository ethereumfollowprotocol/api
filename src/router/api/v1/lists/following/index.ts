import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowingResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { isAddress } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}
const onlyLettersPattern = /^[A-Za-z]+$/

/**
 * Enhanced to add ENS support
 */
export function following(lists: Hono<{ Bindings: Environment }>, services: Services) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  lists.get('/:token_id/following', includeValidator, async context => {
    const { token_id } = context.req.param()

    let limit = context.req.query('limit')
    let offset = context.req.query('tags')

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
      tagsToSearch = tagsArray.filter((tag: any) => tag.match(onlyLettersPattern))
    }

    const direction = context.req.query('sort') === 'latest' ? 'DESC' : 'ASC'

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: FollowingResponse[] = await efp.getUserFollowingByListTagSort(
      token_id,
      limit,
      offset,
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
