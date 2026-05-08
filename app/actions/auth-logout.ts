'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server Action: logout
 * Calls supabase.auth.signOut() to clear the session cookie,
 * then redirects the user to /login.
 *
 * Used as form action in the dashboard sidebar:
 *   <form action={logout}><Button type="submit">Sair</Button></form>
 *
 * IMPORTANT: redirect() must be OUTSIDE of try/catch.
 * redirect() throws a special Next.js internal exception — catching it causes an error.
 */
export async function logout() {
  const supabase = createClient()

  // Sign out — this clears the session cookie via @supabase/ssr
  // Errors from signOut are intentionally ignored:
  // if signOut fails (e.g. already signed out), we still redirect to /login
  await supabase.auth.signOut()

  // IMPORTANT: redirect() outside of try/catch
  redirect('/login')
}
