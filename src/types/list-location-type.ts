/**
 * solidity shown below:
 * // @dev The version byte allows for:
 * // 1. Differentiating between record formats for upgradability.
 * // 2. Ensuring backward compatibility with older versions.
 * // 3. Identifying the record's schema or processing logic.
 * ```solidity
 * struct ListStorageLocation {
 *    uint8
 *    version
 *    // @dev type of list location
 *    uint8
 *    locationType
 *    // @dev data for the list location
 *    bytes
 *    data
 * }
 * ```
 */
export type ListLocationType = {
  version: number
  locationType: number
  data: Buffer
}

export type EVMListLocationType = {
  version: number
  locationType: number
  chainId: number
  contractAddress: `0x${string}`
  nonce: `0x${string}`
}

export function decode(listStorageLocation: `0x${string}`): ListLocationType {
  if (listStorageLocation.length !== 2 + (1 + 1 + 32 + 20 + 32) * 2) {
    throw new Error('invalid list location')
  }
  // read bytes 2-21 as address
  const asBytes: Buffer = Buffer.from(listStorageLocation.slice(2), 'hex')
  const version: number = Number(asBytes[0])
  const locationType: number = Number(asBytes[1])
  const data: Buffer = asBytes.subarray(2)
  return { version, locationType, data }
}

export function decodeListStorageLocation(listStorageLocation: `0x${string}`): EVMListLocationType {
  const { version, locationType, data } = decode(listStorageLocation)
  if (version !== 1) {
    throw new Error('invalid list location version')
  }
  if (locationType !== 1) {
    throw new Error('invalid list location type')
  }
  if (data.length !== 32 + 20 + 32) {
    throw new Error('invalid list location data')
  }
  const chainId: number = Number(data.subarray(0, 32).reduce((acc, cur) => acc * 256 + cur, 0))
  const contractAddress: `0x${string}` = `0x${data.subarray(32, 32 + 20).toString('hex')}`
  const nonce: `0x${string}` = `0x${data.subarray(32 + 20, 32 + 20 + 32).toString('hex')}`

  return { version, locationType, chainId, contractAddress, nonce }
}
