import { createClient } from '@supabase/supabase-js'

import type { Database } from '#/types/generated/database.ts'

export function supabaseClient(environment: Env) {
  return createClient<Database>(environment.SUPABASE_URL, environment.SUPABASE_SECRET_KEY)
}
