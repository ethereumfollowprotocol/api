import type { ColumnType } from 'kysely'

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>

export type Json = ColumnType<JsonValue, string, string>

export type JsonArray = JsonValue[]

export type JsonObject = {
  [K in string]?: JsonValue
}

export type JsonPrimitive = boolean | number | string | null

export type JsonValue = JsonArray | JsonObject | JsonPrimitive

export type Numeric = ColumnType<string, number | string, number | string>

export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface Contracts {
  address: string
  chain_id: Int8
  created_at: Generated<Timestamp | null>
  name: string | null
  owner: string
  updated_at: Generated<Timestamp | null>
}

export interface EfpAccountMetadata {
  address: string
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  key: string
  updated_at: Generated<Timestamp | null>
  value: string
}

export interface EfpAddresses {
  address: string
}

export interface EfpLeaderboard {
  address: string
  avatar: string | null
  blocks: Generated<Int8 | null>
  blocks_rank: Int8 | null
  created_at: Generated<Timestamp | null>
  followers: Generated<Int8 | null>
  followers_rank: Int8 | null
  following: Generated<Int8 | null>
  following_rank: Int8 | null
  mutuals: Generated<Int8 | null>
  mutuals_rank: Int8 | null
  name: string | null
  top8: Generated<Int8 | null>
  top8_rank: Int8 | null
  updated_at: Generated<Timestamp | null>
}

export interface EfpListMetadata {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  key: string
  slot: Buffer
  updated_at: Generated<Timestamp | null>
  value: string
}

export interface EfpListNfts {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  owner: string
  token_id: Int8
  updated_at: Generated<Timestamp | null>
}

export interface EfpListOps {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  data: string
  op: string
  opcode: number
  slot: Buffer
  updated_at: Generated<Timestamp | null>
  version: number
}

export interface EfpListRecords {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  record: Buffer
  record_data: Buffer
  record_type: number
  record_version: number
  slot: Buffer
  updated_at: Generated<Timestamp | null>
}

export interface EfpListRecordTags {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  record: Buffer
  slot: Buffer
  tag: string
  updated_at: Generated<Timestamp | null>
}

export interface EfpLists {
  created_at: Generated<Timestamp | null>
  list_storage_location: Buffer | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_slot: Buffer | null
  manager: string
  nft_chain_id: Int8
  nft_contract_address: string
  owner: string
  token_id: Int8
  updated_at: Generated<Timestamp | null>
  user: string
}

export interface EfpMutuals {
  address: string
  mutuals: Generated<Int8 | null>
  mutuals_rank: Int8 | null
}

export interface EfpPoapLinks {
  claimant: string | null
  claimed: boolean
  created_at: Generated<Timestamp | null>
  link: string
  updated_at: Generated<Timestamp | null>
}

export interface EfpRecentActivity {
  _index: Generated<Int8 | null>
  address: string
  avatar: string | null
  created_at: Generated<Timestamp | null>
  followers: Generated<Int8 | null>
  following: Generated<Int8 | null>
  name: string | null
  updated_at: Generated<Timestamp | null>
}

export interface EfpRecommended {
  address: string
  avatar: string | null
  class: string | null
  created_at: Generated<Timestamp | null>
  index: Int8
  name: string
}

export interface EnsMetadata {
  address: string
  avatar: string | null
  chains: string[] | null
  created_at: Generated<Timestamp | null>
  display: string | null
  errors: string | null
  fresh: Int8 | null
  name: string
  records: Json | null
  resolver: string | null
  updated_at: Generated<Timestamp | null>
}

export interface Events {
  block_hash: string
  block_number: Int8
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  event_args: Json
  event_name: string
  log_index: Numeric
  sort_key: string
  transaction_hash: string
  transaction_index: Numeric
  updated_at: Generated<Timestamp | null>
}

export interface SchemaMigrations {
  version: string
}

export interface ViewDiscover {
  address: string | null
  avatar: string | null
  followers: Int8 | null
  following: Int8 | null
  name: string | null
}

export interface ViewEfpStats {
  address_count: Int8 | null
  list_count: Int8 | null
  list_op_count: Int8 | null
  user_count: Int8 | null
}

export interface ViewEventsEfpAccountMetadata {
  address: string | null
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  key: string | null
  log_index: Numeric | null
  transaction_index: Numeric | null
  value: string | null
}

export interface ViewEventsEfpAccountsWithPrimaryList {
  address: string | null
  primary_list_token_id: Int8 | null
}

export interface ViewEventsEfpContracts {
  address: string | null
  chain_id: Int8 | null
  name: string | null
  owner: string | null
}

export interface ViewEventsEfpLeaderboardMutuals {
  leader: string | null
  mutuals: Int8 | null
  mutuals_rank: Int8 | null
}

export interface ViewEventsEfpListMetadata {
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  key: string | null
  log_index: Numeric | null
  slot: Buffer | null
  transaction_index: Numeric | null
  value: string | null
}

export interface ViewEventsEfpListNfts {
  chain_id: Int8 | null
  contract_address: string | null
  owner: string | null
  token_id: Int8 | null
}

export interface ViewEventsEfpListOps {
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  data: Buffer | null
  event_name: string | null
  log_index: Numeric | null
  op: string | null
  op_bytes: Buffer | null
  opcode: number | null
  slot: Buffer | null
  sort_key: string | null
  transaction_index: Numeric | null
  version: number | null
}

export interface ViewEventsEfpListOpsRecordTag {
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  data: Buffer | null
  log_index: Numeric | null
  opcode: number | null
  record: Buffer | null
  slot: Buffer | null
  sort_key: string | null
  tag: string | null
  transaction_index: Numeric | null
}

export interface ViewEventsEfpListRecords {
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  log_index: Numeric | null
  record: Buffer | null
  record_data: Buffer | null
  record_type: number | null
  record_version: number | null
  slot: Buffer | null
  transaction_index: Numeric | null
}

export interface ViewEventsEfpListRecordTags {
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  log_index: Numeric | null
  record: Buffer | null
  record_data: Buffer | null
  record_type: number | null
  record_version: number | null
  slot: Buffer | null
  tag: string | null
  transaction_index: Numeric | null
}

export interface ViewEventsEfpListStorageLocations {
  efp_list_nft_chain_id: Int8 | null
  efp_list_nft_contract_address: string | null
  efp_list_nft_token_id: Int8 | null
  efp_list_storage_location: Buffer | null
  efp_list_storage_location_chain_id: Int8 | null
  efp_list_storage_location_contract_address: string | null
  efp_list_storage_location_slot: Buffer | null
  efp_list_storage_location_type: number | null
  efp_list_storage_location_version: number | null
}

export interface ViewEventsLatestRecordTags {
  chain_id: Int8 | null
  contract_address: string | null
  max_sort_key: string | null
  record: Buffer | null
  slot: Buffer | null
  tag: string | null
}

export interface ViewJoinEfpLeaderboard {
  address: string | null
  blocks: Int8 | null
  blocks_rank: Int8 | null
  ens_avatar: string | null
  ens_name: string | null
  followers: Int8 | null
  followers_rank: Int8 | null
  following: Int8 | null
  following_rank: Int8 | null
  mutuals: Int8 | null
  mutuals_rank: Int8 | null
  top8: Int8 | null
  top8_rank: Int8 | null
}

export interface ViewJoinEfpListRecordsWithNftManagerUserTags {
  has_block_tag: boolean | null
  has_mute_tag: boolean | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_slot: Buffer | null
  manager: string | null
  nft_chain_id: Int8 | null
  nft_contract_address: string | null
  owner: string | null
  record: Buffer | null
  record_data: Buffer | null
  record_type: number | null
  record_version: number | null
  tags: string[] | null
  token_id: Int8 | null
  updated_at: Timestamp | null
  user: string | null
}

export interface ViewJoinEfpListRecordsWithNftManagerUserTagsNoPrim {
  has_block_tag: boolean | null
  has_mute_tag: boolean | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_slot: Buffer | null
  manager: string | null
  nft_chain_id: Int8 | null
  nft_contract_address: string | null
  owner: string | null
  record: Buffer | null
  record_data: Buffer | null
  record_type: number | null
  record_version: number | null
  tags: string[] | null
  token_id: Int8 | null
  updated_at: Timestamp | null
  user: string | null
}

export interface ViewJoinEfpListRecordsWithTags {
  chain_id: Int8 | null
  contract_address: string | null
  record: Buffer | null
  record_data: Buffer | null
  record_type: number | null
  record_version: number | null
  slot: Buffer | null
  tags: string[] | null
  updated_at: Timestamp | null
}

export interface ViewJoinEfpListsWithMetadata {
  created_at: Timestamp | null
  list_storage_location: Buffer | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_slot: Buffer | null
  manager: string | null
  nft_chain_id: Int8 | null
  nft_contract_address: string | null
  owner: string | null
  token_id: Int8 | null
  updated_at: Timestamp | null
  user: string | null
}

export interface ViewLatestFollows {
  _index: Int8 | null
  address: string | null
  updated_at: Timestamp | null
}

export interface ViewLatestLeaders {
  _index: Int8 | null
  address: string | null
  updated_at: Timestamp | null
}

export interface ViewTrending {
  address: string | null
  avatar: string | null
  count: Int8 | null
  name: string | null
}

export interface DB {
  contracts: Contracts
  efp_account_metadata: EfpAccountMetadata
  efp_addresses: EfpAddresses
  efp_leaderboard: EfpLeaderboard
  efp_list_metadata: EfpListMetadata
  efp_list_nfts: EfpListNfts
  efp_list_ops: EfpListOps
  efp_list_record_tags: EfpListRecordTags
  efp_list_records: EfpListRecords
  efp_lists: EfpLists
  efp_mutuals: EfpMutuals
  efp_poap_links: EfpPoapLinks
  efp_recent_activity: EfpRecentActivity
  efp_recommended: EfpRecommended
  ens_metadata: EnsMetadata
  events: Events
  schema_migrations: SchemaMigrations
  view__discover: ViewDiscover
  view__efp_stats: ViewEfpStats
  view__events__efp_account_metadata: ViewEventsEfpAccountMetadata
  view__events__efp_accounts_with_primary_list: ViewEventsEfpAccountsWithPrimaryList
  view__events__efp_contracts: ViewEventsEfpContracts
  view__events__efp_leaderboard_mutuals: ViewEventsEfpLeaderboardMutuals
  view__events__efp_list_metadata: ViewEventsEfpListMetadata
  view__events__efp_list_nfts: ViewEventsEfpListNfts
  view__events__efp_list_ops: ViewEventsEfpListOps
  view__events__efp_list_ops__record_tag: ViewEventsEfpListOpsRecordTag
  view__events__efp_list_record_tags: ViewEventsEfpListRecordTags
  view__events__efp_list_records: ViewEventsEfpListRecords
  view__events__efp_list_storage_locations: ViewEventsEfpListStorageLocations
  view__events__latest_record_tags: ViewEventsLatestRecordTags
  view__join__efp_leaderboard: ViewJoinEfpLeaderboard
  view__join__efp_list_records_with_nft_manager_user_tags: ViewJoinEfpListRecordsWithNftManagerUserTags
  view__join__efp_list_records_with_nft_manager_user_tags_no_prim: ViewJoinEfpListRecordsWithNftManagerUserTagsNoPrim
  view__join__efp_list_records_with_tags: ViewJoinEfpListRecordsWithTags
  view__join__efp_lists_with_metadata: ViewJoinEfpListsWithMetadata
  view__latest_follows: ViewLatestFollows
  view__latest_leaders: ViewLatestLeaders
  view__trending: ViewTrending
}
