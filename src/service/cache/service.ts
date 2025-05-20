import type { KVNamespace } from '@cloudflare/workers-types'
import { createClient } from 'redis'
import type { RedisClientType } from 'redis'
import type { Environment } from '#/types/index'

export interface ICacheService {
  get(key: string): Promise<{} | null>
  put(key: string, value: string, ttl?: number): Promise<void>
}

export class CacheService implements ICacheService {
  readonly #env: Environment
  readonly #cacheType: string
  #client: RedisClientType | KVNamespace | null = null
  #connecting = false

  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  constructor(env: Env) {
    this.#env = env
    if (this.#env.EFP_DATA_CACHE === undefined) {
      this.#cacheType = 'redis'
    } else {
      this.#cacheType = 'kv'
      this.#client = this.#env.EFP_DATA_CACHE as KVNamespace
    }
  }

  async createRedisClient(): Promise<RedisClientType> {
    if (this.#connecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
      return this.#client as RedisClientType
    }

    this.#connecting = true

    const client: RedisClientType = createClient({
      url: this.#env.REDIS_URL,
      socket: {
        connectTimeout: 10000
      }
    })

    client.on('error', (err: Error) => {
      console.error(`Redis Error: ${err.message}`)
      client.quit()
      this.#client = null
    })

    try {
      await client.connect()
      this.#client = client
    } catch (err) {
      console.error(`Failed to connect to Redis: ${err}`)
      this.#client = null
    } finally {
      this.#connecting = false
    }

    return client
  }

  async getRedisClient(): Promise<RedisClientType> {
    if (!this.#client) {
      return await this.createRedisClient()
    }
    return this.#client as RedisClientType
  }

  async closeClient(): Promise<void> {
    if (this.#cacheType === 'redis' && this.#client) {
      await (this.#client as RedisClientType).quit()
      this.#client = null
    }
  }

  async get(key: string): Promise<{} | null> {
    if (this.#cacheType === 'redis') {
      const client = await this.getRedisClient()
      const result = await client.get(key)
      client.quit()
      return result ? (JSON.parse(result as string) as {}) : null
    }
    return this.#env.EFP_DATA_CACHE.get(key, 'json')
  }

  async put(key: string, value: string, ttl = this.#env.CACHE_TTL): Promise<void> {
    if (this.#cacheType === 'redis') {
      const client = await this.getRedisClient()
      if (ttl === 0) {
        await client.set(key, value, {} as any)
      } else {
        await client.set(key, value, { EX: ttl } as any)
      }
      client.quit()
    } else if (ttl === 0) {
      await this.#env.EFP_DATA_CACHE.put(key, value, {})
    } else {
      await this.#env.EFP_DATA_CACHE.put(key, value, { expirationTtl: ttl })
    }
  }
}
