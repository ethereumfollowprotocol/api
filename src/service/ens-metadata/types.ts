
export type ENSProfile = {
    name: string
    address: Address
    avatar: string
    display: string
    records: Record<string, string>
    chains: Record<string, Address>
    fresh: number
    resolver: Address
    errors: any
  }
