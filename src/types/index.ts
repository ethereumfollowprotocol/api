export * from './generated'

export type Environment = Pretty<Env>

/**
 * This type utility is used to unwrap complex types so you can hover over them in VSCode and see the actual type
 */
export type Pretty<T> = {
  [K in keyof T]: T[K]
} & {}
