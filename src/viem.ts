// import { mainnet } from 'viem/chains'
import type { Address } from 'viem'

import { raise } from '#/utilities.ts'

/**
 * Takes an ENS name or address and returns the address
 */
export async function ensAddress({
  ensNameOrAddress,
  env
}: {
  ensNameOrAddress?: Address | string
  env: Env
}): Promise<Address> {
  const { normalize } = await import('viem/ens')
  const { isAddress, getAddress } = await import('viem')

  if (!ensNameOrAddress) {
    raise(`invalid id. Must be a valid address or ENS name. Provided id: ${ensNameOrAddress}`)
  }
  if (ensNameOrAddress.indexOf('.eth') > -1) {
    const client = await mainnetClient(env)
    const address = await client.getEnsAddress({ name: normalize(ensNameOrAddress) })
    if (!address) raise(`invalid ENS name: ${ensNameOrAddress}`)
    return address
  }
  if (isAddress(ensNameOrAddress)) return getAddress(ensNameOrAddress)

  raise(`Invalid id. Must be a valid address or ENS name: ${ensNameOrAddress}`)
}

export async function mainnetClient(environment: Env) {
  const { mainnet } = await import('viem/chains')
  const { createPublicClient, fallback, http } = await import('viem')
  return createPublicClient({
    chain: mainnet,
    transport: fallback([
      http(`https://eth.llamarpc.com/rpc/${environment.LLAMAFOLIO_ID}`),
      http(`https://rpc.ankr.com/eth/${environment.ANKR_ID}`),
      http(`https://eth-mainnet.alchemyapi.io/v2/${environment.ALCHEMY_ID}`),
      http(`https://mainnet.infura.io/v3/${environment.INFURA_ID}`)
    ]),
    batch: { multicall: true }
  })
}
