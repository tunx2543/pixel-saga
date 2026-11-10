import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function createClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_TUNX2543_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ?? process.env.NEXT_PUBLIC_TUNX2543_SUPABASE_PUBLISHABLE_KEY
      ?? process.env.NEXT_PUBLIC_TUNX2543_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase configuration is missing')
    }

    client = createBrowserClient(url, key)
  }
  return client
}
