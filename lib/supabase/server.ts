import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 *
 * IMPORTANT — Next.js 14 vs 15 difference:
 *   In Next.js 14, cookies() is SYNCHRONOUS. Do NOT await it.
 *   In Next.js 15, cookies() became async. This project targets Next.js 14.
 *
 * The setAll method wraps cookie mutations in try/catch because Server Components
 * are read-only for cookies — only Middleware can write cookies. The try/catch is
 * intentional (official @supabase/ssr pattern), NOT sloppy error handling.
 * Token refresh happens in middleware.ts, not here.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies — only Middleware can.
            // This catch is intentional: token refresh is handled by middleware.ts.
          }
        },
      },
    }
  )
}
