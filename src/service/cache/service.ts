import type { KVNamespace } from '@cloudflare/workers-types'
import { createClient } from 'redis'
import type { RedisClientType } from 'redis'
import type { Environment } from '#/types/index'

export interface ICacheService {
  get(key: string): Promise<{} | null>
  put(key: string, value: string): Promise<void>
}

export class CacheService implements ICacheService {
  readonly #env: Environment
  readonly #cacheType: string
  #client: RedisClientType | KVNamespace

  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  constructor(env: Env) {
    this.#env = env
    if (this.#env.EFP_DATA_CACHE === undefined) {
      this.#cacheType = 'redis'
      this.#client = this.createRedisClient()
    } else {
      this.#cacheType = 'kv'
      this.#client = this.#env.EFP_DATA_CACHE as KVNamespace
    }
  }

  createRedisClient(): RedisClientType {
    const client: RedisClientType = createClient({
      url: this.#env.REDIS_URL
    })
    client.on('error', (err: Error) => {
      console.log(`Error: ${err}`)
      client.quit()
    })
    client.connect()
    return client
  }

  closeClient(): void {
    ;(this.#client as RedisClientType).quit()
  }

  async get(key: string): Promise<{} | null> {
    if (this.#cacheType === 'redis') {
      if (!this.#client) {
        this.#client = this.createRedisClient()
      }
      const result = await (this.#client as RedisClientType).get(key)
      return JSON.parse(result as string) as any
    }
    return this.#env.EFP_DATA_CACHE.get(key, 'json')
  }

  async put(key: string, value: string): Promise<void> {
    if (this.#cacheType === 'redis') {
      if (!this.#client) {
        this.#client = this.createRedisClient()
      }
      await (this.#client as RedisClientType).set(key, value, {
        EX: this.#env.CACHE_TTL
      } as any)
    } else {
      await this.#env.EFP_DATA_CACHE.put(key, value, { expirationTtl: this.#env.CACHE_TTL })
    }
  }
}
