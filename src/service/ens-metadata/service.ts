import { ens_normalize } from '@adraffy/ens-normalize'
import { type Kysely, type QueryResult, sql } from 'kysely'
import { database } from '#/database'
import { apiLogger } from '#/logger'
import type { Address, DB } from '#/types'
import type { Environment } from '#/types/index'
import { arrayToChunks, isAddress, raise } from '#/utilities.ts'
import { S3Cache } from './s3-cache'
import type { ENSProfile } from './types'

export type ENSProfileResponse = ENSProfile & { type: 'error' | 'success' }

export interface IENSMetadataService {
  getAddress(ensNameOrAddress: Address | string): Promise<Address>
  getENSProfile(ensNameOrAddress?: Address | string): Promise<ENSProfile>
  batchGetENSProfiles(ensNameOrAddressArray: Array<Address | string>): Promise<ENSProfileResponse[]>
  getENSAvatar(ensNameOrAddress: Address | string): Promise<string>
  batchGetENSAvatars(ensNameOrAddressArray: Array<Address | string>): Promise<{ [ensNameOrAddress: string]: string }>
}

type Row = {
  name: string
  address: `0x${string}`
  avatar: string
  records: string
  updated_at: string
}

export class ENSMetadataService implements IENSMetadataService {
  readonly #db: Kysely<DB>
  readonly #env: Environment

  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  constructor(env: Env) {
    this.#db = database(env)
    this.#env = env
  }

  url = 'https://ens.evm.workers.dev'
  async getAddress(ensNameOrAddress: Address | string): Promise<Address> {
    // check if it already is a valid type
    if (isAddress(ensNameOrAddress)) {
      return ensNameOrAddress.toLowerCase() as Address
    }
    // check if it is a valid ENS name
    const normalized = ens_normalize(ensNameOrAddress)

    return (await this.getENSProfile(normalized)).address.toLowerCase() as Address
  }

  async checkCache(ensNameOrAddress: Address | string): Promise<ENSProfile | boolean> {
    if (isAddress(ensNameOrAddress)) {
      const query = sql<Row>`SELECT * FROM query.get_ens_metadata_by_address(${ensNameOrAddress.toLowerCase()})`
      const result = await query.execute(this.#db)
      if (result.rows.length > 0) {
        return result.rows[0] as ENSProfile
      }
    }
    const nameQuery = sql<Row>`SELECT * FROM query.get_ens_metadata_by_name(${ensNameOrAddress.toLowerCase()})`
    const nameResult = await nameQuery.execute(this.#db)
    if (nameResult.rows.length > 0) {
      return nameResult.rows[0] as ENSProfile
    }

    return false
  }

  async cacheRecord(profile: ENSProfile): Promise<boolean> {
    //if profile.records.avatar then set profile.avatar to value
    const cacheService = new S3Cache(this.#env)
    let newAvatar = '' as string
    if (profile.avatar) {
      newAvatar = await cacheService.cacheImage(profile.avatar, profile.address)
      if (newAvatar !== '') profile.avatar = newAvatar
    }
    const nameData = ENSMetadataService.#toTableRow(profile)

    const result = await this.#db
      .insertInto('ens_metadata')
      .values(nameData)
      .onConflict(oc =>
        oc.column('address').doUpdateSet(eb => ({
          name: eb.ref('excluded.name'),
          avatar: eb.ref('excluded.avatar'),
          records: eb.ref('excluded.records')
        }))
      )
      .executeTakeFirst()
    if (result.numInsertedOrUpdatedRows === BigInt(0)) {
      return false
    }
    return true
  }

  /**
   * TODO:
   * currently our ENS metadata service can return a non-200 response with a JSON body
   * We should read that body and throw an error with the message
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  async getENSProfile(rawNameOrAddress: Address | string): Promise<ENSProfile> {
    let ensNameOrAddress = rawNameOrAddress
    if (ensNameOrAddress === undefined) {
      raise('ENS name or address is required')
    }
    if (!isAddress(ensNameOrAddress)) {
      ensNameOrAddress = ens_normalize(ensNameOrAddress)
    }

    const cachedProfile = await this.checkCache(ensNameOrAddress)
    try {
      if (cachedProfile && typeof cachedProfile !== 'boolean') {
        cachedProfile.name = cachedProfile.name ? ens_normalize(cachedProfile.name) : ''
      }
    } catch (_error) {
      return {
        name: '',
        address: ensNameOrAddress,
        avatar: null,
        records: null,
        updated_at: ''
      } as unknown as ENSProfile
    }
    // const cachedProfile = false
    if (!cachedProfile) {
      //silently cache fetched profile without waiting ->
      const response = await fetch(`${this.url}/u/${ensNameOrAddress}`)
      if (response.ok) {
        // raise(`invalid ENS name: ${ensNameOrAddress}`)
        try {
          const ensProfileData = (await response.json()) as ENSProfile
          ensProfileData.name = ens_normalize(ensProfileData.name)
          try {
            await this.cacheRecord(ensProfileData)
          } catch (error) {
            console.log('cache failed', error)
          }

          return ensProfileData as ENSProfile
        } catch (error) {
          console.log('error', error)
        }
      }
      return {
        name: '',
        address: ensNameOrAddress,
        avatar: null,
        records: null,
        updated_at: ''
      } as unknown as ENSProfile
    }
    const returnedRecord = cachedProfile as ENSProfile
    if (cachedProfile) {
      returnedRecord.records = returnedRecord?.records ? (JSON.parse(returnedRecord?.records) as string) : ''
    }
    return returnedRecord as ENSProfile
  }

  /**
   * TODO: break into batches of 10
   * path should be /u/batch
   */
  async batchGetENSProfiles(ensNameOrAddressArray: Array<Address | string>): Promise<ENSProfileResponse[]> {
    if (ensNameOrAddressArray.length > 10) {
      // apiLogger.warn('more than 10 ids provided, this will be broken into batches of 10')
    }

    const addressArrayWithCache: any = await ensNameOrAddressArray.reduce(async (accumulator, address) => {
      const cacheRecord = await this.checkCache(address)
      if (!cacheRecord) {
        return { ...(await accumulator), [address]: null }
      }
      return { ...(await accumulator), [address]: cacheRecord }
    }, {})

    const cacheArray = Object.values(addressArrayWithCache) as ENSProfileResponse[]
    const filteredCache = cacheArray.filter(address => address !== null)

    if (ensNameOrAddressArray.length === filteredCache.length) return cacheArray
    // Splits the input array into chunks of 10 for batch processing.
    // Each batch is then formatted into a string query parameter.
    const formattedBatches = arrayToChunks(ensNameOrAddressArray, 10).map(batch =>
      batch
        .map(id => {
          if (addressArrayWithCache[id] === null) {
            return `queries[]=${id}`
          }
          return ''
        })
        .join('&')
    )

    // Performs parallel fetch requests for each batch and waits for all to complete.
    const response = await Promise.all(
      formattedBatches.map(batch => {
        return fetch(`${this.url}/bulk/u?${batch}`)
      })
    )

    // Processes each response as JSON and flattens the result into a single array.
    const data = (await Promise.all(response.map(response => response.json()))) as {
      response_length: number
      response: ENSProfileResponse
    }[]

    // Returns the combined results from all batches.
    const fetchedRecords = data.flatMap(datum => {
      if (datum.response.name) {
        return datum.response
      }
      return {
        name: '',
        address: '0x',
        avatar: '',
        records: '',
        updated_at: '',
        type: 'error'
      } as ENSProfileResponse
    })
    for (const record of fetchedRecords) {
      if (record.name) {
        await this.cacheRecord(record)
        record.records = JSON.parse(record?.records || '') as string
      }
      //   record.records = JSON.parse(record?.records || '') as string;
    }

    for (const record of filteredCache) {
      if (record.name) {
        record.records = JSON.parse(record?.records || '') as string
      }
    }

    return [...filteredCache, ...fetchedRecords]
  }

  async getENSAvatar(ensNameOrAddress: Address | string): Promise<string> {
    if (ensNameOrAddress === undefined) raise('ENS name or address is required')
    const response = await fetch(`${this.url}/i/${ensNameOrAddress}`, {
      redirect: 'follow'
    })
    if (!response.ok) raise(`invalid ENS name: ${ensNameOrAddress}`)
    return response.url
  }

  /**
   * TODO: implement this in the ENS metadata service worker
   * path should be /i/batch
   */
  async batchGetENSAvatars(
    ensNameOrAddressArray: Array<Address | string>
  ): Promise<{ [ensNameOrAddress: string]: string }> {
    const responses = await Promise.all(
      ensNameOrAddressArray.map(ensNameOrAddress => fetch(`${this.url}/i/${ensNameOrAddress}`, { redirect: 'follow' }))
    )
    return responses.reduce((accumulator, response, index) => {
      const id = `${ensNameOrAddressArray[index]}`
      if (!response.ok) {
        apiLogger.error(`invalid ENS name: ${ensNameOrAddressArray[index]}`)
        return {
          ...accumulator,
          [id]: 'https://app.ethfollow.xyz/assets/gradient-circle.svg'
        }
      }
      return { ...accumulator, [id]: response.url }
    }, {})
  }

  static #toTableRow(namedata: ENSProfile): {
    name: string
    address: string
    avatar: string | undefined
    updated_at: string | undefined
    records: string | undefined
  } {
    return {
      name: namedata.name,
      address: namedata.address.toLowerCase(),
      avatar: namedata?.avatar,
      records: namedata?.records,
      updated_at: namedata?.updated_at
    }
  }
}
