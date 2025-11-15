import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    try {
      // OAuth code를 세션으로 교환
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('OAuth 교환 에러:', error)
        // Get the redirect URL for error
        const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent(error.message)}`
          : `${origin}/login?error=${encodeURIComponent(error.message)}`
        return NextResponse.redirect(errorRedirectUrl)
      }

      if (data.user && data.session) {
        // Get the redirect URL
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'

        let baseUrl: string

        if (isLocalEnv) {
          // Development: use origin
          baseUrl = origin
        } else if (forwardedHost) {
          // Production with forwarded host
          baseUrl = `https://${forwardedHost}`
        } else if (process.env.NEXT_PUBLIC_SITE_URL) {
          // Production with environment variable
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        } else {
          // Fallback to origin
          baseUrl = origin
        }

        // DB에서 사용자 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (!existingUser) {
          // 신규 사용자 - users 테이블에 추가
          const { data: codeResult } = await supabase.rpc('generate_referral_code')
          const referralCode = codeResult || ''

          await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email!,
            name: '',
            profileImage: '/default-avatar.png',
            referralCode: referralCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

          // 온보딩으로 리다이렉트
          return NextResponse.redirect(`${baseUrl}/onboarding`)
        }

        // 기존 사용자 - next 파라미터로 리다이렉트 (없으면 홈으로)
        return NextResponse.redirect(`${baseUrl}${next}`)
      }
    } catch (err) {
      console.error('콜백 처리 에러:', err)
      const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다')}`
        : `${origin}/login?error=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다')}`
      return NextResponse.redirect(errorRedirectUrl)
    }
  }

  // code가 없으면 로그인 페이지로
  const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
    : `${origin}/login`
  return NextResponse.redirect(errorRedirectUrl)
}
