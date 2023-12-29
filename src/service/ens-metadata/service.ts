import type { Address } from '#/types'
import { isAddress, raise } from '#/utilities.ts'
import type { ENSProfile } from './types'

export interface IENSMetadataService {
  getAddress(ensNameOrAddress: Address | string): Promise<Address>
  getENSProfile(ensNameOrAddress?: Address | string): Promise<ENSProfile>
}

export class ENSMetadataService implements IENSMetadataService {
  constructor(private readonly url: string = 'https://ens.ethfollow.xyz') {}

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
}
