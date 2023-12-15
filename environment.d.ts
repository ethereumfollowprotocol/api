interface EnvironmentVariables {
  readonly PORT: string
  readonly LLAMAFOLIO_ID: string
  readonly ANKR_ID: string
  readonly ALCHEMY_ID: string
  readonly INFURA_ID: string
  readonly DATABASE_URL: string
  readonly SUPABASE_PROJECT_REF: string
  readonly ENABLE_DATABASE_LOGGING: 'true' | 'false'
}

// Cloudflare Workers
interface Env extends EnvironmentVariables {
  readonly ENV: 'development' | 'production' | 'test'
  readonly ens: Record<string, unknown>
}

// Node.js
declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
