import { normalize } from 'viem/ens'
import { mainnet } from 'viem/chains'
import { raise } from '#/utilities.ts'
import { createPublicClient, http, fallback, getAddress, isAddress, type Address } from 'viem'

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
  if (!ensNameOrAddress) {
    raise(`invalid id. Must be a valid address or ENS name. Provided id: ${ensNameOrAddress}`)
  }
  if (ensNameOrAddress.indexOf('.eth') > -1) {
    const client = mainnetClient(env)
    const address = await client.getEnsAddress({ name: normalize(ensNameOrAddress) })
    if (!address) raise(`invalid ENS name: ${ensNameOrAddress}`)
    return address
  }
  if (isAddress(ensNameOrAddress)) return getAddress(ensNameOrAddress)

  raise(`Invalid id. Must be a valid address or ENS name: ${ensNameOrAddress}`)
}

export function mainnetClient(environment: Env) {
  return createPublicClient({
    chain: mainnet,
    transport: fallback([
      http(`https://rpc.ankr.com/eth/${environment.ANKR_ID}`),
      http(`https://ethereum.ethfollow.xyz/v1/mainnet`),
      http(`https://eth.llamarpc.com/rpc/${environment.LLAMAFOLIO_ID}`),
      http(`https://eth-mainnet.alchemyapi.io/v2/${environment.ALCHEMY_ID}`),
      http(`https://mainnet.infura.io/v3/${environment.INFURA_ID}`)
    ]),
    batch: { multicall: true }
  })
}
