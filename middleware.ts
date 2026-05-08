import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware — runs on the Edge Runtime before every matched request.
 *
 * Two responsibilities:
 * 1. SESSION REFRESH: calls getUser() which validates the JWT server-side and
 *    writes the refreshed token back to response cookies via setAll.
 *    Without this, Supabase JWTs expire and users are silently logged out.
 *
 * 2. UNAUTHENTICATED REDIRECT: if no valid user session, redirect to /login.
 *
 * CRITICAL — do not use getSession() here:
 *   getSession() reads the JWT from the cookie without server-side validation.
 *   A forged or expired JWT passes getSession() but fails getUser().
 *   Always use getUser() for security-critical auth checks.
 *
 * CRITICAL — always return supabaseResponse (not NextResponse.next()):
 *   supabaseResponse carries the refreshed auth cookies written by setAll.
 *   Returning a plain NextResponse.next() discards those cookies and the user
 *   appears logged out on the very next request.
 */
export async function middleware(request: NextRequest) {
  // Create a mutable response object that allows cookie writes
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens to both the request and the response.
          // Dual write is required: request update propagates to downstream
          // middleware; response update sends the cookie to the browser.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT add any logic between createServerClient and getUser().
  // getUser() triggers token refresh and writes new cookies via setAll above.
  // Any code between these two calls risks creating auth bugs that are hard to debug.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  /** Forward refreshed auth cookies from supabaseResponse onto a redirect response */
  function redirectWithCookies(url: URL): NextResponse {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // API routes: return JSON 401 instead of HTML redirect for unauthenticated requests
  if (!user && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Unauthenticated: redirect to login (except the login page itself)
  if (!user && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url)
    return redirectWithCookies(loginUrl)
  }

  // Authenticated on login page: redirect to main dashboard
  if (user && pathname === '/login') {
    const dashboardUrl = new URL('/retirada', request.url)
    return redirectWithCookies(dashboardUrl)
  }

  // Role-based access: /entrada is admin-only
  // Reads from app_metadata (set via Supabase Admin API) — NOT user_metadata
  // (user_metadata is user-writable and must not be trusted for security decisions)
  // Phase 3 will provision users with app_metadata.role set to 'admin' or 'operator'
  if (user && pathname.startsWith('/entrada')) {
    const role = user.app_metadata?.role as string | undefined
    if (role !== 'admin') {
      const retiradaUrl = new URL('/retirada', request.url)
      return redirectWithCookies(retiradaUrl)
    }
  }

  // CRITICAL: Always return supabaseResponse — never a plain NextResponse.next()
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js static files)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico   (browser favicon request)
     * - Static file extensions (svg, png, jpg, jpeg, gif, webp)
     *
     * The middleware runs on all other routes, including /login,
     * /entrada, /retirada, and /api/* routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
