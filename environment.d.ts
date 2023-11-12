interface EnvironmentVariables {
  readonly NODE_ENV: 'development' | 'production' | 'test'
  readonly ENV: 'development' | 'production' | 'test'
  readonly PORT: string
  readonly LLAMAFOLIO_ID: string
  readonly ALCHEMY_ID: string
  readonly INFURA_ID: string
  readonly SUPABASE_URL: string
  readonly SUPABASE_SECRET_KEY: string
  readonly SUPABASE_PUBLIC_KEY: string
}

// Cloudflare Workers
interface Env extends EnvironmentVariables {}

// Node.js
declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
