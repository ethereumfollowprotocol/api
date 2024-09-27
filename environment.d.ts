interface EnvironmentVariables {
  readonly NODE_ENV: 'development' | 'production' | 'test'
  readonly ENVIRONMENT: 'development' | 'production' | 'stage' | 'test'
  readonly PORT: string
  readonly LLAMAFOLIO_ID: string
  readonly ANKR_ID: string
  readonly ALCHEMY_ID: string
  readonly INFURA_ID: string
  readonly DATABASE_URL: string
  readonly ENABLE_DATABASE_LOGGING: 'true' | 'false'
  readonly IS_DEMO: 'true' | 'false'
  readonly S3_ACCESS_KEY: string
  readonly S3_ACCESS_KEY_SECRET: string
  readonly S3_BUCKET: string
  readonly S3_REGION: string
  readonly AIRSTACK_API_KEY: string
  readonly CACHE_TTL: number
}

// Cloudflare Workers
interface Env extends EnvironmentVariables {
  // ens is a binded service in wrangler.toml
  readonly ens: Record<string, unknown>
  // EFP_DEMO_KV is a binded production service in wrangler.toml
  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  readonly EFP_DEMO_KV: KVNamespace
  // EFP_DATA_CACHE is a binded production service in wrangler.toml
  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  readonly EFP_DATA_CACHE: KVNamespace
  // generated in ci during deployment
  readonly COMMIT_SHA: string
}

// Node.js
// biome-ignore lint/style/noNamespace: <explanation>
declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
