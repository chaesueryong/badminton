import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  // 서버 사이드에서는 NEXT_PUBLIC_이 아닌 일반 환경변수 사용
  // NEXT_PUBLIC_은 빌드 타임에만 작동하므로 런타임에는 undefined
  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  console.log('[Auth Callback] Request:', { code: code ? 'present' : 'none', error })

  // 로그인 취소 또는 에러 발생 시
  if (error) {
    console.log('[Auth Callback] OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError) {
        console.error('Auth exchange error:', authError)

        // Rate limit 에러 처리
        if (authError.status === 429 || authError.message?.includes('rate limit')) {
          return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')}`)
        }

        const errorMessage = authError.message || '인증에 실패했습니다'
        return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorMessage)}`)
      }

      if (data.user) {
        console.log('[Auth Callback] User authenticated:', data.user.id)

        // DB에서 사용자 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (!existingUser) {
          // 첫 로그인 - 사용자 정보 입력 페이지로
          console.log('[Auth Callback] New user, redirecting to onboarding')
          const now = new Date().toISOString()

          // 고유한 초대 코드 생성
          const { data: codeResult } = await supabase.rpc('generate_referral_code')
          const referralCode = codeResult || ''

          const { error: insertError } = await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email!,
            name: '',  // 닉네임만 사용
            profileImage: '/default-avatar.png',  // 소셜 이미지 사용 안함, 기본 아이콘
            referralCode: referralCode,
            createdAt: now,
            updatedAt: now,
          })

          if (insertError) {
            console.error('[Auth Callback] User insert error:', insertError)
          }

          return NextResponse.redirect(`${baseUrl}/onboarding`)
        }

        // 기존 사용자 - 홈으로
        console.log('[Auth Callback] Existing user, redirecting to home')
        return NextResponse.redirect(baseUrl)
      }

      console.log('[Auth Callback] No user data after successful auth')
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('사용자 정보를 가져올 수 없습니다')}`)
    } catch (err) {
      console.error('Auth callback error:', err)
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다')}`)
    }
  }

  // code도 error도 없는 경우 - 로그인 페이지로
  return NextResponse.redirect(`${baseUrl}/login`)
}
