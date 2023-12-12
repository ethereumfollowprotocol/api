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
  key: string
  value: string
}

export interface Contracts {
  address: string
  chain_id: Int8
  id: Generated<string>
  name: string
  owner: string
}

export interface Events {
  block_number: Int8
  contract_address: string
  event_name: string
  event_parameters: Json
  id: Generated<string>
  processed: Generated<string>
  timestamp: Timestamp
  transaction_hash: string
}

export interface ListMetadata {
  chain_id: Int8
  contract_address: string
  key: string
  token_id: Int8
  value: string
}

export interface ListNfts {
  chain_id: Int8
  contract_address: string
  list_manager: string | null
  list_storage_location: string | null
  list_storage_location_chain_id: Int8 | null
  list_storage_location_contract_address: string | null
  list_storage_location_nonce: Int8 | null
  list_user: string | null
  owner: string
  token_id: Int8
}

export interface ListOps {
  chain_id: Int8
  code: number
  contract_address: string
  data: string
  id: Generated<string>
  nonce: Int8
  op: string
  version: number
}

export interface ListRecords {
  chain_id: Int8
  contract_address: string
  data: string
  id: Generated<string>
  nonce: Int8
  record: string
  type: number
  version: number
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
  list_ops: ListOps
  list_records: ListRecords
  schema_migrations: SchemaMigrations
}
