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

export type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface AccountMetadata {
  address: string
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  key: string
  updated_at: Generated<Timestamp | null>
  value: string
}

export interface Contracts {
  address: string
  chain_id: Int8
  created_at: Generated<Timestamp | null>
  name: string
  owner: string
  updated_at: Generated<Timestamp | null>
}

export interface Events {
  block_number: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  event_name: string
  event_parameters: Json
  id: Generated<string>
  transaction_hash: string
  updated_at: Generated<Timestamp | null>
}

export interface ListMetadata {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  key: string
  nonce: Int8
  updated_at: Generated<Timestamp | null>
  value: string
}

export interface ListNfts {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  list_manager: string | null
  list_storage_location: string | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_nonce: Int8 | null
  owner: string
  token_id: Int8
  updated_at: Generated<Timestamp | null>
}

export interface ListNftsView {
  chain_id: Int8 | null
  contract_address: string | null
  created_at: Timestamp | null
  list_manager: string | null
  list_storage_location: string | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_nonce: Int8 | null
  list_user: string | null
  owner: string | null
  token_id: Int8 | null
  updated_at: Timestamp | null
}

export interface ListOps {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  data: string
  nonce: Int8
  op: string
  opcode: number
  updated_at: Generated<Timestamp | null>
  version: number
}

export interface ListRecords {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  data: string
  nonce: Int8
  record: string
  record_type: number
  updated_at: Generated<Timestamp | null>
  version: number
}

export interface ListRecordTags {
  chain_id: Int8
  contract_address: string
  created_at: Generated<Timestamp | null>
  nonce: Int8
  record: string
  tag: string
  updated_at: Generated<Timestamp | null>
}

export interface ListRecordTagsExtendedView {
  data: string | null
  has_block_tag: boolean | null
  has_mute_tag: boolean | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_nonce: Int8 | null
  list_user: string | null
  record: string | null
  record_type: number | null
  tags: string[] | null
  token_id: Int8 | null
  version: number | null
}

export interface ListRecordTagsView {
  chain_id: Int8 | null
  contract_address: string | null
  data: string | null
  nonce: Int8 | null
  record: string | null
  record_type: number | null
  tags: string[] | null
  version: number | null
}

export interface SchemaMigrations {
  version: string
}

export interface DB {
  account_metadata: AccountMetadata
  contracts: Contracts
  events: Events
  list_metadata: ListMetadata
  list_nfts: ListNfts
  list_nfts_view: ListNftsView
  list_ops: ListOps
  list_record_tags: ListRecordTags
  list_record_tags_extended_view: ListRecordTagsExtendedView
  list_record_tags_view: ListRecordTagsView
  list_records: ListRecords
  schema_migrations: SchemaMigrations
}
