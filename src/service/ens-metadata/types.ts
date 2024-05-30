import type { Address } from '#/types'

export type ENSProfile = {
  name: string
  address: Address
  avatar?: string
  updated_at?: string
  //   display: string
  //   records: Record<string, string>
  //   chains: Record<string, Address>
  //   fresh: number
  //   resolver: Address
  //   errors: Record<string, string>
}
