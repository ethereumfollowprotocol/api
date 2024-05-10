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
}

// Cloudflare Workers
interface Env extends EnvironmentVariables {
  // ens is a binded service in wrangler.toml
  readonly ens: Record<string, unknown>
  // EFP_DEMO_KV is a binded production service in wrangler.toml
  readonly EFP_DEMO_KV: KVNamespace
  // generated in ci during deployment
  readonly COMMIT_SHA: string
}

// Node.js
declare namespace nodeJs {
  interface ProcessEnv extends EnvironmentVariables {}
}
