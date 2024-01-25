export * from './generated'

export type StringifiedBoolean = 'true' | 'false'

export type MaybePromise<T> = T | Promise<T> | PromiseLike<T>

export type Address = `0x${string}`

export type Environment = Pretty<Env>

export type NoRepetition<U extends string, ResultT extends any[] = []> =
  | ResultT
  | {
      [k in U]: NoRepetition<Exclude<U, k>, [k, ...ResultT]>
    }[U]

/**
 * This type utility is used to unwrap complex types so you can hover over them in VSCode and see the actual type
 */
export type Pretty<T> = {
  [K in keyof T]: T[K]
} & {}
