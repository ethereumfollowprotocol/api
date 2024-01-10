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

export interface ViewEfpAccountMetadata {
  address: string | null
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  key: string | null
  log_index: Numeric | null
  transaction_index: Numeric | null
  value: string | null
}

export interface ViewEfpAccountsWithPrimaryList {
  address: string | null
  primary_list_token_id: Int8 | null
}

export interface ViewEfpContracts {
  address: string | null
  chain_id: Int8 | null
  name: string | null
  owner: string | null
}

export interface ViewEfpListMetadata {
  block_number: Int8 | null
  chain_id: Int8 | null
  contract_address: string | null
  key: string | null
  log_index: Numeric | null
  slot: Buffer | null
  transaction_index: Numeric | null
  value: string | null
}

export interface ViewEfpListNfts {
  address: string | null
  chain_id: Int8 | null
  owner: string | null
  token_id: Int8 | null
}

export interface ViewEfpListNftsWithManagerUser {
  efp_list_manager: string | null
  efp_list_nft_chain_id: Int8 | null
  efp_list_nft_contract_address: string | null
  efp_list_nft_owner: string | null
  efp_list_nft_token_id: Int8 | null
  efp_list_storage_location: Buffer | null
  efp_list_storage_location_chain_id: Int8 | null
  efp_list_storage_location_contract_address: string | null
  efp_list_storage_location_slot: Buffer | null
  efp_list_storage_location_type: number | null
  efp_list_storage_location_version: number | null
  efp_list_user: string | null
}

export interface ViewEfpListOps {
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

export interface ViewEfpListOpsRecordTag {
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

export interface ViewEfpListRecords {
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

export interface ViewEfpListRecordsDeleted {
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

export interface ViewEfpListRecordsWithNftManagerUserTags {
  efp_list_manager: string | null
  efp_list_nft_chain_id: Int8 | null
  efp_list_nft_contract_address: string | null
  efp_list_nft_owner: string | null
  efp_list_nft_token_id: Int8 | null
  efp_list_storage_location_chain_id: Int8 | null
  efp_list_storage_location_contract_address: string | null
  efp_list_storage_location_slot: Buffer | null
  efp_list_user: string | null
  has_block_tag: boolean | null
  has_mute_tag: boolean | null
  record: Buffer | null
  record_data: Buffer | null
  record_type: number | null
  record_version: number | null
  tags: string[] | null
}

export interface ViewEfpListRecordsWithTags {
  chain_id: Int8 | null
  contract_address: string | null
  record: Buffer | null
  record_data: Buffer | null
  record_type: number | null
  record_version: number | null
  slot: Buffer | null
  tags: string[] | null
}

export interface ViewEfpListRecordTags {
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

export interface ViewEfpListRecordTagsDeleted {
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

export interface ViewEfpListStorageLocations {
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

export interface ViewLatestRecordTags {
  chain_id: Int8 | null
  contract_address: string | null
  max_sort_key: string | null
  record: Buffer | null
  slot: Buffer | null
  tag: string | null
}

export interface DB {
  events: Events
  schema_migrations: SchemaMigrations
  view__efp_account_metadata: ViewEfpAccountMetadata
  view__efp_accounts_with_primary_list: ViewEfpAccountsWithPrimaryList
  view__efp_contracts: ViewEfpContracts
  view__efp_list_metadata: ViewEfpListMetadata
  view__efp_list_nfts: ViewEfpListNfts
  view__efp_list_nfts_with_manager_user: ViewEfpListNftsWithManagerUser
  view__efp_list_ops: ViewEfpListOps
  view__efp_list_ops__record_tag: ViewEfpListOpsRecordTag
  view__efp_list_record_tags: ViewEfpListRecordTags
  view__efp_list_record_tags__deleted: ViewEfpListRecordTagsDeleted
  view__efp_list_records: ViewEfpListRecords
  view__efp_list_records__deleted: ViewEfpListRecordsDeleted
  view__efp_list_records_with_nft_manager_user_tags: ViewEfpListRecordsWithNftManagerUserTags
  view__efp_list_records_with_tags: ViewEfpListRecordsWithTags
  view__efp_list_storage_locations: ViewEfpListStorageLocations
  view__latest_record_tags: ViewLatestRecordTags
}
