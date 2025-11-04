import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 세션 새로고침 - OAuth 콜백 처리에 필수
  const { data: { session } } = await supabase.auth.getSession()

  // API 경로는 미들웨어 체크 제외
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
  if (isApiRoute) {
    return res
  }

  // 로그인이 필요한 페이지 목록 (모임, 체육관, 커뮤니티, 매칭은 공개)
  // /profile/[id] 는 공개, /profile (본인 프로필)만 보호
  const isOwnProfile = req.nextUrl.pathname === '/profile'
  const isOtherUserProfile = req.nextUrl.pathname.startsWith('/profile/') && req.nextUrl.pathname.length > 9
  const protectedPaths = ['/messages', '/admin']
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

    // 프로필이 완성되지 않은 경우 온보딩 페이지로 리다이렉트
    if (error || !user || !user.name || !user.nickname || !user.level) {
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
