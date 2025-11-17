import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('[Auth Callback] 요청 시작')

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[Auth Callback] code:', code ? '존재함' : '없음')
  console.log('[Auth Callback] origin:', origin)

  if (code) {
    console.log('[Auth Callback] Supabase 클라이언트 생성 중...')
    const supabase = await createClient()

    try {
      // OAuth code를 세션으로 교환
      console.log('[Auth Callback] Code 교환 시작...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('[Auth Callback] Code 교환 결과:', error ? '실패' : '성공')

      if (error) {
        console.error('OAuth 교환 에러:', error)
        // Get the redirect URL for error
        const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent(error.message)}`
          : `${origin}/login?error=${encodeURIComponent(error.message)}`
        return NextResponse.redirect(errorRedirectUrl)
      }

      if (data.user && data.session) {
        console.log('[Auth Callback] 사용자 세션 확인됨, userId:', data.user.id)

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

        console.log('[Auth Callback] baseUrl:', baseUrl)

        // DB에서 사용자 확인
        console.log('[Auth Callback] 기존 사용자 확인 중...')
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        if (selectError) {
          console.error('[Auth Callback] 사용자 조회 에러:', selectError)
        }
        console.log('[Auth Callback] 기존 사용자:', existingUser ? '존재함' : '신규')

        if (!existingUser) {
          console.log('[Auth Callback] 신규 사용자 생성 시작')
          // 신규 사용자 - users 테이블에 추가
          let referralCode = ''

          try {
            console.log('[Auth Callback] 추천 코드 생성 중...')
            const { data: codeResult, error: rpcError } = await supabase.rpc('generate_referral_code')
            if (rpcError) {
              console.error('[Auth Callback] RPC 에러 (무시하고 계속):', rpcError)
            } else {
              referralCode = codeResult || ''
              console.log('[Auth Callback] 추천 코드 생성 완료')
            }
          } catch (rpcErr) {
            console.error('[Auth Callback] RPC 호출 실패 (무시하고 계속):', rpcErr)
          }

          console.log('[Auth Callback] users 테이블에 삽입 중...')
          const { error: insertError } = await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email!,
            name: '',
            profileImage: '/default-avatar.png',
            referralCode: referralCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

          if (insertError) {
            console.error('[Auth Callback] 사용자 생성 에러:', insertError)
            throw insertError
          }

          console.log('[Auth Callback] 신규 사용자 생성 완료, 온보딩으로 리다이렉트')
          // 온보딩으로 리다이렉트
          return NextResponse.redirect(`${baseUrl}/onboarding`)
        }

        console.log('[Auth Callback] 기존 사용자, 홈으로 리다이렉트')
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
