import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the SERVICE ROLE key.
 *
 * WARNING: This client BYPASSES ALL RLS POLICIES. Every operation runs with
 * superuser-level database privileges. Use only in server-side API Routes
 * after performing your own authentication and authorization checks.
 *
 * auth.autoRefreshToken: false — the service role key never expires; no refresh needed
 * auth.persistSession: false  — this is a stateless server client; sessions must not be persisted
 *
 * Usage (ONLY in app/api/ route handlers):
 *   import { createServiceClient } from '@/lib/supabase/service'
 *   const supabase = createServiceClient()
 *   const { data, error } = await supabase.rpc('fn_create_invoice', payload)
 *
 * NEVER import this file in:
 *   - Client Components ('use client')
 *   - lib/supabase/client.ts
 *   - Any file that might be bundled for the browser
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
