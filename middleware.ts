import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 세션 새로고침 - OAuth 콜백 처리에 필수
  // API route도 세션 refresh 필요!
  const { data: { session } } = await supabase.auth.getSession()

  console.log('[Middleware]', req.nextUrl.pathname, 'session:', session ? 'YES' : 'NO', session?.user?.id)

  // API 경로는 체크만 안 하고, 세션 refresh는 위에서 했으므로 바로 리턴
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
  if (isApiRoute) {
    return res
  }

  // 로그인이 필요한 페이지 목록 (모임, 체육관, 커뮤니티, 매칭은 공개)
  // /profile/[id] 는 공개, /profile (본인 프로필)만 보호
  const isOwnProfile = req.nextUrl.pathname === '/profile'
  const isOtherUserProfile = req.nextUrl.pathname.startsWith('/profile/') && req.nextUrl.pathname.length > 9
  const protectedPaths = ['/messages', '/admin', '/matches/history']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path)) || isOwnProfile

  // 온보딩 및 로그인 페이지
  const isOnboardingPage = req.nextUrl.pathname === '/onboarding'
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isAuthCallback = req.nextUrl.pathname === '/auth/callback'
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')

  // 로그인되지 않은 상태에서 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedPath && !session && !isLoginPage) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 로그인된 사용자의 프로필 완성 여부 확인 (admin 페이지 제외)
  if (session && !isOnboardingPage && !isAuthCallback && !isLoginPage && !isAdminPage) {
    const { data: user, error } = await supabase
      .from('users')
      .select('name, nickname, level')
      .eq('id', session.user.id)
      .maybeSingle()

    console.log('[Middleware Profile Check]', req.nextUrl.pathname, 'user:', user ? 'OK' : 'NULL', 'error:', error?.message || 'none')

    // 에러가 발생한 경우 로깅하고 계속 진행 (프로필 확인 실패해도 페이지는 보여줌)
    if (error) {
      console.error('Middleware profile check error:', error)
      return res
    }

    // 프로필이 완성되지 않은 경우 온보딩 페이지로 리다이렉트
    if (!user || !user.name || !user.nickname || !user.level) {
      console.log('[Middleware] Redirecting to onboarding - incomplete profile')
      const onboardingUrl = new URL('/onboarding', req.url)
      return NextResponse.redirect(onboardingUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
