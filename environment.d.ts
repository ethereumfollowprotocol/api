interface EnvironmentVariables {
  readonly ENV: 'development' | 'production' | 'test'
  readonly PORT: string
  readonly LLAMAFOLIO_ID: string
  readonly ANKR_ID: string
  readonly ALCHEMY_ID: string
  readonly INFURA_ID: string
  readonly SUPABASE_URL: string
  readonly SUPABASE_SECRET_KEY: string
  readonly ENABLE_DATABASE_LOGGING: 'true' | 'false'
  readonly DATABASE_URL: string
  readonly DATABASE_POOLING_URL: string

  postgres: Hyperdrive
  'postgres-pooling': Hyperdrive
}

// Cloudflare Workers
interface Env extends EnvironmentVariables {}

// Node.js
declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
