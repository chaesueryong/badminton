import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your server
  // vulnerable to CSRF attacks.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is logged in and needs onboarding
  if (user) {
    const pathname = request.nextUrl.pathname

    // Allow these paths always
    const allowedPaths = [
      '/onboarding',
      '/auth/callback',
      '/api',
      '/login',
      '/_next',
      '/favicon.ico'
    ]

    // Check if current path is allowed
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path))

    if (!isAllowedPath) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      // If no profile or onboarding not completed, redirect to onboarding
      if (!profile || !profile.onboarding_completed) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
