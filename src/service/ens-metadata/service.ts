import { apiLogger } from '#/logger'
import type { Address } from '#/types'
import { arrayToChunks, isAddress, raise } from '#/utilities.ts'
import type { ENSProfile } from './types'

export type ENSProfileResponse = ENSProfile & { type: 'error' | 'success' }

export interface IENSMetadataService {
  getAddress(ensNameOrAddress: Address | string): Promise<Address>
  getENSProfile(ensNameOrAddress?: Address | string): Promise<ENSProfile>
  batchGetENSProfiles(ensNameOrAddressArray: Array<Address | string>): Promise<ENSProfileResponse[]>
  getENSAvatar(ensNameOrAddress: Address | string): Promise<string>
  batchGetENSAvatars(ensNameOrAddressArray: Array<Address | string>): Promise<{ [ensNameOrAddress: string]: string }>
}

export class ENSMetadataService implements IENSMetadataService {
  constructor(private readonly url: string = 'https://ens.evm.workers.dev') {}

  async getAddress(ensNameOrAddress: Address | string): Promise<Address> {
    // check if it already is a valid type
    if (isAddress(ensNameOrAddress)) {
      return ensNameOrAddress.toLowerCase() as Address
    }

    return (await this.getENSProfile(ensNameOrAddress)).address.toLowerCase() as Address
  }

  /**
   * TODO:
   * currently our ENS metadata service can return a non-200 response with a JSON body
   * We should read that body and throw an error with the message
   */
  async getENSProfile(ensNameOrAddress: Address | string): Promise<ENSProfile> {
    if (ensNameOrAddress === undefined) {
      raise('ENS name or address is required')
    }

    const response = await fetch(`${this.url}/u/${ensNameOrAddress}`)

    if (!response.ok) {
      raise(`invalid ENS name: ${ensNameOrAddress}`)
    }

    const ensProfileData = await response.json()

    return ensProfileData as ENSProfile
  }

  /**
   * TODO: break into batches of 10
   * path should be /u/batch
   */
  async batchGetENSProfiles(ensNameOrAddressArray: Array<Address | string>): Promise<ENSProfileResponse[]> {
    if (ensNameOrAddressArray.length > 10) {
      // apiLogger.warn('more than 10 ids provided, this will be broken into batches of 10')
    }

    // Splits the input array into chunks of 10 for batch processing.
    // Each batch is then formatted into a string query parameter.
    const formattedBatches = arrayToChunks(ensNameOrAddressArray, 10).map(batch =>
      batch.map(id => `queries[]=${id}`).join('&')
    )

    // Performs parallel fetch requests for each batch and waits for all to complete.
    const response = await Promise.all(formattedBatches.map(batch => fetch(`${this.url}/bulk/u?${batch}`)))

    // Checks if any response is not OK (indicating a fetch failure), and if so, raises an exception.
    if (response.some(response => !response.ok)) {
      raise(`contains invalid ENS name: ${JSON.stringify(ensNameOrAddressArray)}`)
    }

    // Processes each response as JSON and flattens the result into a single array.
    const data = (await Promise.all(response.map(response => response.json()))) as {
      response_length: number
      response: ENSProfileResponse
    }[]

    // Returns the combined results from all batches.
    return data.flatMap(datum => datum.response)
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
}
