import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { identityVerificationId } = await request.json();

    if (!identityVerificationId) {
      return NextResponse.json(
        { error: '본인인증 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 현재 로그인한 사용자 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // PortOne API로 본인인증 결과 조회
    const portoneResponse = await fetch(
      `https://api.portone.io/identity-verifications/${identityVerificationId}`,
      {
        headers: {
          'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
      }
    );

    if (!portoneResponse.ok) {
      throw new Error('본인인증 정보를 가져올 수 없습니다.');
    }

    const verificationData = await portoneResponse.json();

    if (verificationData.status !== 'VERIFIED') {
      return NextResponse.json(
        { error: '본인인증이 완료되지 않았습니다.' },
        { status: 400 }
      );
    }

    // CI로 중복 가입 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('verification_ci', verificationData.customData?.ci)
      .neq('id', session.user.id)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 인증된 다른 계정이 존재합니다.' },
        { status: 400 }
      );
    }

    // 생년월일 파싱 (YYYYMMDD -> DATE)
    const birthDate = verificationData.customData?.birthDate;
    const formattedBirthDate = birthDate
      ? `${birthDate.substring(0, 4)}-${birthDate.substring(4, 6)}-${birthDate.substring(6, 8)}`
      : null;

    // 사용자 정보 업데이트
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({
        verified_name: verificationData.customData?.name,
        birth_date: formattedBirthDate,
        gender: verificationData.customData?.gender,
        phone: verificationData.customData?.phoneNumber,
        verification_ci: verificationData.customData?.ci,
        verification_di: verificationData.customData?.di,
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('사용자 정보 업데이트 오류:', updateError);
      throw new Error('본인인증 정보 저장에 실패했습니다.');
    }

    return NextResponse.json({
      success: true,
      message: '본인인증이 완료되었습니다.',
    });
  } catch (error: any) {
    console.error('본인인증 검증 오류:', error);
    return NextResponse.json(
      { error: error.message || '본인인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
