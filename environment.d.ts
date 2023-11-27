interface EnvironmentVariables {
  readonly PORT: string
  readonly LLAMAFOLIO_ID: string
  readonly ANKR_ID: string
  readonly ALCHEMY_ID: string
  readonly INFURA_ID: string
  readonly SUPABASE_URL: string
  readonly SUPABASE_SECRET_KEY: string
  readonly SUPABASE_PROJECT_REF: string
  readonly SUPABASE_GRAPHQL_URL: string
  readonly ENABLE_DATABASE_LOGGING: 'true' | 'false'
}

// Cloudflare Workers
interface Env extends EnvironmentVariables {
  readonly ENV: 'development' | 'production' | 'test'
  readonly ens: any
}

// Node.js
declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
