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

  async getENSProfile(ensNameOrAddress: Address | string): Promise<ENSProfile> {
    try {
      if (ensNameOrAddress === undefined) {
        raise('ENS name or address is required')
      }
      const response = await fetch(`${this.url}/u/${ensNameOrAddress}`)

      const ensProfileData = (await response.json()) as ENSProfile | { status: number; error: string }

      if (!ensProfileData) raise(`Failed to fetch ENS profile for ${ensNameOrAddress}`)
      // ENS worker still returns data when status code is not 200
      if (Object.hasOwn(ensProfileData, 'error')) raise(ensProfileData)

      return ensProfileData as ENSProfile
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      raise(errorMessage)
    }
  }
}
