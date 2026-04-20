import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/mein-bereich', '/admin']

// Routes that are excluded from protection (public even though they start with a protected prefix)
const PROTECTED_EXCEPTIONS = ['/admin/login']

// Routes that should redirect if already authenticated
// Wichtig: /auth/reset-password und /auth/update-password NICHT hier drin — eingeloggte User sollen Passwort ändern können
const AUTH_ROUTES = ['/login', '/admin/login']

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  // Sicherheitsnetz: ?code= auf der Landingpage oder falschen Seiten → immer zu update-password
  // Verhindert dass Supabase den Recovery-Code automatisch austauscht bevor der User ein Passwort setzen kann
  const code = searchParams.get('code')
  if (code && (pathname === '/' || pathname === '/login')) {
    const url = new URL('/auth/update-password', request.url)
    url.searchParams.set('code', code)
    return NextResponse.redirect(url)
  }

  const isProtectedRoute =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    !PROTECTED_EXCEPTIONS.includes(pathname)

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    // Admin routes → admin login, alles andere → normaler login
    const isAdminRoute = pathname.startsWith('/admin')
    const loginUrl = new URL(isAdminRoute ? '/admin/login' : '/login', request.url)
    if (!isAdminRoute) loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth routes based on their role
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .eq('is_deleted', false)
      .single()

    if (!profile) return NextResponse.redirect(new URL('/login', request.url))
    if (profile.role === 'platform_admin') return NextResponse.redirect(new URL('/admin', request.url))
    if (['hv_admin', 'hv_mitarbeiter'].includes(profile.role)) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.redirect(new URL('/mein-bereich', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
