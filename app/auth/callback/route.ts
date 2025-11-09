import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    try {
      // OAuth code를 세션으로 교환
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('OAuth 교환 에러:', error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user && data.session) {
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
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // 기존 사용자 - 홈으로 리다이렉트
        return NextResponse.redirect(origin)
      }
    } catch (err) {
      console.error('콜백 처리 에러:', err)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다')}`)
    }
  }

  // code가 없으면 로그인 페이지로
  return NextResponse.redirect(`${origin}/login`)
}
