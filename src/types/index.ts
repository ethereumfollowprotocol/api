export * from './generated'

export type Environment = Pretty<Env>

export const sortFields = ['ascending', 'descending', 'asc', 'desc'] as const

export type SortField = (typeof sortFields)[number]

/**
 * This type utility is used to unwrap complex types so you can hover over them in VSCode and see the actual type
 */
export type Pretty<T> = {
  [K in keyof T]: T[K]
} & {}
