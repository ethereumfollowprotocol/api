import { raise } from '#/utilities.ts';
import { type Address } from 'viem';
import type { ENSProfile } from './types';

export interface IENSMetadataService {
  getENSProfile(ensNameOrAddress?: Address | string): Promise<ENSProfile>
}

export class ENSMetadataService implements IENSMetadataService {

    constructor(private readonly url: string = 'https://ens.ethfollow.xyz') {}

  async getENSProfile(ensNameOrAddress: Address | string): Promise<ENSProfile> {
    const response = await fetch(`${this.url}/u/${ensNameOrAddress}`)

    if (!response.ok) {
        raise(`invalid ENS name: ${ensNameOrAddress}`)
    }

    const ensProfileData = await response.json()
    return ensProfileData as ENSProfile
  }
}
