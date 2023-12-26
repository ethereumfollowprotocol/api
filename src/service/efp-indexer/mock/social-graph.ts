import { serializeListRecord, type ListRecord, type TaggedListRecord } from '#/types/list-record'
import { DEMO_LIST_NFTS_CSV, DEMO_LIST_OPS_CSV } from './data'

type TokenId = bigint

type Tag = string

class LinkedListNode {
  value: ListRecord
  next: LinkedListNode | null
  prev: LinkedListNode | null

  constructor(value: ListRecord) {
    this.value = value
    this.next = null
    this.prev = null
  }
}

class LinkedList {
  head: LinkedListNode | null
  tail: LinkedListNode | null

  constructor() {
    this.head = null
    this.tail = null
  }

  // O(1) time
  add(record: ListRecord) {
    const newNode = new LinkedListNode(record)
    if (!this.head) {
      this.head = newNode
      this.tail = newNode
    } else {
      if (this.tail) {
        this.tail.next = newNode
        newNode.prev = this.tail
        this.tail = newNode
      }
    }
    return newNode // Return the node for external reference
  }

  // O(1) time
  remove(node: LinkedListNode) {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }
    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }
}

function stringify(listRecord: ListRecord): string {
  return `${listRecord.version}/${listRecord.recordType}/${listRecord.data.toString()}`
}

// Social Graph supports:
// O(1) add/remove records via doubly-linked list to maintain order
// O(1) add/remove tags via set
// O(n) get records since we need to iterate through the linked list
// O(1) get tags since we use a set
//
// other tradeoffs are possible but this is a simple implementation shown as an example
export class SocialGraph {
  private readonly listRecords: Map<TokenId, LinkedList>
  private readonly nodeMap: Map<`0x${string}`, LinkedListNode> // To quickly find the node for a given record
  private readonly tags: Map<TokenId, Map<LinkedListNode, Set<Tag>>>

  private readonly primaryLists: Map<`0x${string}`, TokenId>

  constructor() {
    this.listRecords = new Map()
    this.tags = new Map()
    this.nodeMap = new Map()
    this.primaryLists = new Map()
  }

  setPrimaryList(listUser: `0x${string}`, tokenId: TokenId): void {
    this.primaryLists.set(listUser.toLowerCase() as `0x${string}`, tokenId)
  }

  getPrimaryList(listUser: `0x${string}`): TokenId | undefined {
    return this.primaryLists.get(listUser.toLowerCase() as `0x${string}`)
  }

  addRecord(listId: TokenId, record: ListRecord): void {
    if (!this.listRecords.has(listId)) {
      this.listRecords.set(listId, new LinkedList())
    }
    const list = this.listRecords.get(listId)
    if (!list) {
      throw new Error('List should exist')
    }
    const node = list.add(record)
    this.nodeMap.set(serializeListRecord(record), node)
  }

  removeRecord(listId: TokenId, record: ListRecord): void {
    const list = this.listRecords.get(listId)
    const node = this.nodeMap.get(serializeListRecord(record))
    if (list !== undefined && node !== undefined) {
      list.remove(node)
      this.nodeMap.delete(serializeListRecord(record))
    }
  }

  tagRecord(listId: TokenId, record: ListRecord, tag: Tag): void {
    if (!this.tags.has(listId)) {
      this.tags.set(listId, new Map())
    }
    const listTags = this.tags.get(listId)
    if (!listTags) {
      throw new Error('Tags should exist')
    }
    const node = this.nodeMap.get(serializeListRecord(record))
    if (!node) {
      throw new Error('Node should exist')
    }
    if (!listTags.has(node)) {
      listTags.set(node, new Set<Tag>())
    }
    const nodeTags = listTags.get(node)
    if (!nodeTags) {
      throw new Error('Node tags should exist')
    }
    nodeTags.add(tag)
  }

  untagRecord(listId: TokenId, record: ListRecord, tag: Tag): void {
    const node = this.nodeMap.get(serializeListRecord(record))
    if (!node) {
      throw new Error('Node should exist')
    }
    const listTags = this.tags.get(listId)
    const nodeTags = listTags?.get(node)
    if (nodeTags) {
      nodeTags.delete(tag)
    }
  }

  // read-only functions

  // O(n) time
  getListRecords(listId: TokenId): ListRecord[] {
    const records: ListRecord[] = []
    const list = this.listRecords.get(listId)
    if (list) {
      let node = list.head
      while (node) {
        records.push(node.value)
        node = node.next
      }
    }
    return records
  }

  // O(1) time
  getTags(listId: TokenId, record: ListRecord): Set<Tag> {
    const node = this.nodeMap.get(serializeListRecord(record))
    if (!node) {
      throw new Error('Node should exist')
    }
    const listTags = this.tags.get(listId)
    if (listTags?.has(node)) {
      const tags = listTags.get(node)
      if (tags) {
        return tags
      }
    }
    return new Set<Tag>()
  }

  getListRecordTags(listId: TokenId): TaggedListRecord[] {
    const records: TaggedListRecord[] = []
    const list = this.listRecords.get(listId)
    if (list) {
      let node = list.head
      while (node) {
        const tags = this.getTags(listId, node.value)
        records.push({
          version: node.value.version,
          recordType: node.value.recordType,
          data: node.value.data,
          tags: Array.from(tags).sort()
        })
        node = node.next
      }
    }
    return records
  }

  static isFollow(record: ListRecord, tags: Set<Tag> | Tag[]): boolean {
    if (record.version !== 1 || record.recordType !== 1 || record.data.length !== 20) {
      return false
    }
    const tagsSet = new Set(tags)
    if (tagsSet.has('block') || tagsSet.has('mute')) {
      return false
    }
    return true
  }

  getFollowers(address: `0x${string}`): `0x${string}`[] {
    const followers: `0x${string}`[] = []
    // check every primary list to see if it contains the address
    for (const [listUser, tokenId] of this.primaryLists.entries()) {
      if (tokenId === undefined) continue
      const listRecordTags: TaggedListRecord[] = this.getListRecordTags(tokenId)
      for (const listRecordTag of listRecordTags) {
        const { version, recordType, data, tags } = listRecordTag
        if (!SocialGraph.isFollow({ version, recordType, data }, tags)) {
          continue
        }
        const follower: `0x${string}` = `0x${data.toString('hex')}` as `0x${string}`
        if (follower.toLowerCase() === address.toLowerCase()) {
          followers.push(listUser)
        }
      }
    }
    return followers
  }

  getFollowersCount(address: `0x${string}`): number {
    return this.getFollowers(address).length
  }

  getFollowing(address: `0x${string}`): TaggedListRecord[] {
    const primaryList: TokenId | undefined = this.getPrimaryList(address)
    if (primaryList === undefined) return []

    const listRecordTags: TaggedListRecord[] = this.getListRecordTags(primaryList)
    // filter all the ones with "block" or "mute" in the tags
    const following: TaggedListRecord[] = []
    for (const listRecordTag of listRecordTags) {
      const { version, recordType, data, tags } = listRecordTag
      if (!SocialGraph.isFollow({ version, recordType, data }, tags)) {
        continue
      }
      following.push({ version, recordType, data, tags: tags })
    }
    return following
  }

  getFollowingCount(address: `0x${string}`): number {
    return this.getFollowing(address).length
  }

  // iterate over each of the users with a primary list set
  // count their following
  // sort by following count
  getLeaderboardFollowing(limit: number): Promise<{ address: `0x${string}`; following_count: number }[]> {
    const leaderboard: { address: `0x${string}`; following_count: number }[] = []
    for (const [listUser, tokenId] of this.primaryLists.entries()) {
      if (tokenId === undefined) continue
      const followingCount: number = this.getFollowingCount(listUser)
      leaderboard.push({ address: listUser, following_count: followingCount })
    }
    leaderboard.sort((a, b) => b.following_count - a.following_count)
    return Promise.resolve(leaderboard.slice(0, limit))
  }

  // step 1: iterate over all known list records and extract the set of address records with >= 1 follow (de-duped into a set)
  // then format that set into an array of { address, followers_count } objects
  // step 2: sort the array by followers_count
  // step 3: return the top N results
  getLeaderboardFollowers(limit: number): Promise<{ address: `0x${string}`; followers_count: number }[]> {
    const followersByAddress: Map<`0x${string}`, Set<`0x${string}`>> = new Map()

    // step 1: iterate over all list records for all lists
    for (const [listId, list] of this.listRecords.entries()) {
      let node = list.head
      while (node) {
        const record = node.value
        const tags = this.getTags(listId, record)
        if (SocialGraph.isFollow(record, tags)) {
          const followed: `0x${string}` = `0x${record.data.toString('hex')}` as `0x${string}`
          const follower: `0x${string}` = listId.toString() as `0x${string}`
          if (!followersByAddress.has(followed)) {
            followersByAddress.set(followed, new Set())
          }
          const followers = followersByAddress.get(followed)
          if (followers) {
            followers.add(follower)
          }
        }
        node = node.next
      }
    }

    const leaderboard: { address: `0x${string}`; followers_count: number }[] = []
    for (const [address, followers] of followersByAddress.entries()) {
      leaderboard.push({ address, followers_count: followers.size })
    }
    leaderboard.sort((a, b) => b.followers_count - a.followers_count)
    return Promise.resolve(leaderboard.slice(0, limit))
  }
}

type ListNFTRow = {
  tokenId: TokenId
  listUser: string
}

type ListOpRow = {
  nonce: number
  list_op: string
}

// Generic function to parse a CSV file
function parseCSV<T>(fileContent: string, mapFn: (line: string) => T): T[] {
  const lines = fileContent.split('\n')
  return lines
    .slice(1)
    .filter(line => line.trim())
    .map(mapFn)
}

function makeListNFTRow(line: string): ListNFTRow {
  const [token_idStr, list_user] = line.split(',')
  if (typeof token_idStr !== 'string' || typeof list_user !== 'string') {
    throw new Error('Invalid format in TokenUser CSV')
  }
  return { tokenId: BigInt(parseInt(token_idStr, 10)), listUser: list_user }
}

function makeListOpRow(line: string): ListOpRow {
  const [nonceStr, list_op] = line.split(',')
  if (typeof nonceStr !== 'string' || typeof list_op !== 'string') {
    throw new Error('Invalid format in Operation CSV')
  }
  return { nonce: parseInt(nonceStr, 10), list_op }
}

export function makeSocialGraph(): SocialGraph {
  console.log('Building social graph...')
  const socialGraph: SocialGraph = new SocialGraph()
  const nfts: ListNFTRow[] = parseCSV<ListNFTRow>(DEMO_LIST_NFTS_CSV, makeListNFTRow)
  for (const nft of nfts) {
    const { tokenId, listUser } = nft
    if (typeof tokenId !== 'bigint') {
      throw new Error('Invalid token ID')
    }
    if (typeof listUser !== 'string' || !listUser.startsWith('0x')) {
      throw new Error('Invalid list user')
    }
    console.log(`Setting primary list for ${listUser} to ${tokenId}`)
    socialGraph.setPrimaryList(listUser as `0x${string}`, tokenId)
  }

  const listOps: ListOpRow[] = parseCSV<ListOpRow>(DEMO_LIST_OPS_CSV, makeListOpRow)

  for (const listOp of listOps) {
    const { nonce, list_op } = listOp
    if (nonce >= nfts.length) {
      throw new Error('Invalid nonce')
    }
    const nft: ListNFTRow = nfts[nonce] as ListNFTRow
    const { tokenId, listUser } = nft

    const listOpBytes: Buffer = Buffer.from(list_op.substring(2), 'hex')
    const listOpVersion: number = Number(listOpBytes[0])
    const listOpcode: number = Number(listOpBytes[1])
    const listRecordVersion: number = Number(listOpBytes[2])
    const listRecordType: number = Number(listOpBytes[3])

    if (listOpVersion !== 1) {
      throw new Error('Invalid list op version')
    }
    if (listRecordVersion !== 1) {
      throw new Error('Invalid list record version')
    }
    if (listOpcode === 1) {
      // add record operation
      if (listOpBytes.length !== 24) {
        throw new Error('Invalid add record operation')
      }
      const listRecordBytes: Buffer = listOpBytes.subarray(4, 24)
      const listRecord: ListRecord = {
        version: listRecordVersion,
        recordType: listRecordType,
        data: listRecordBytes
      }
      console.log(`${tokenId} Add record ${serializeListRecord(listRecord)}`)
      socialGraph.addRecord(tokenId, listRecord)
    } else if (listOpcode === 2) {
      // delete record operation
      if (listOpBytes.length !== 24) {
        throw new Error('Invalid delete record operation')
      }
      const listRecordBytes: Buffer = listOpBytes.subarray(4, 24)
      const listRecord: ListRecord = {
        version: listRecordVersion,
        recordType: listRecordType,
        data: listRecordBytes
      }
      console.log(`${tokenId} Delete record ${serializeListRecord(listRecord)}`)
      socialGraph.removeRecord(tokenId, listRecord)
    } else if (listOpcode === 3) {
      // add record tag operation
      if (listOpBytes.length <= 24) {
        throw new Error('Invalid add record tag operation')
      }
      const listRecordBytes: Buffer = listOpBytes.subarray(4, 24)
      const listRecord: ListRecord = {
        version: listRecordVersion,
        recordType: listRecordType,
        data: listRecordBytes
      }
      const listTagBytes: Buffer = listOpBytes.subarray(24)
      const tag: string = listTagBytes.toString('utf-8')
      console.log(`${tokenId} Tag record ${serializeListRecord(listRecord)} "${tag}"`)
      socialGraph.tagRecord(tokenId, listRecord, tag)
    } else if (listOpcode === 4) {
      // delete record tag operation
      if (listOpBytes.length <= 24) {
        throw new Error('Invalid delete record tag operation')
      }
      const listRecordBytes: Buffer = listOpBytes.subarray(4, 24)
      const listRecord: ListRecord = {
        version: listRecordVersion,
        recordType: listRecordType,
        data: listRecordBytes
      }
      const listTagBytes: Buffer = listOpBytes.subarray(24)
      const tag: string = listTagBytes.toString('utf-8')
      console.log(`${tokenId} Untag record ${serializeListRecord(listRecord)} "${tag}"`)
      socialGraph.untagRecord(tokenId, listRecord, tag)
    } else {
      throw new Error(`Invalid list opcode: ${listOpcode}`)
    }
  }

  return socialGraph
}
