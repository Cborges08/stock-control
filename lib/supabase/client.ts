import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components ('use client').
 *
 * Uses createBrowserClient from @supabase/ssr — NOT createClient from @supabase/supabase-js.
 * This client reads and writes auth cookies in the browser context.
 *
 * Usage:
 *   'use client'
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *
 * NEVER import this file in Server Components or API Routes.
 * For server-side use, import from '@/lib/supabase/server' instead.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
