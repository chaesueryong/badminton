import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { GameSettings } from "@/config/game-settings";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { nickname, phone, level, region, gender, preferredStyle, experience, birthdate, referralCode } = body;

    if (!nickname || !level || !gender || !preferredStyle || experience === undefined || !birthdate) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // 닉네임 중복 체크
    const { data: existingNickname } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle();

    if (existingNickname && existingNickname.id !== user.id) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다" },
        { status: 400 }
      );
    }

    // 초대 코드 검증 (입력된 경우에만)
    let referrerId = null;
    if (referralCode && referralCode.trim()) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id, nickname, referralCode')
        .eq('referralCode', referralCode.trim().toUpperCase())
        .maybeSingle();

      if (!referrer) {
        return NextResponse.json(
          { error: "유효하지 않은 초대 코드입니다" },
          { status: 400 }
        );
      }

      if (referrer.id === user.id) {
        return NextResponse.json(
          { error: "자신의 초대 코드는 사용할 수 없습니다" },
          { status: 400 }
        );
      }

      referrerId = referrer.id;
    }

    // 사용자 정보 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let result;

    if (!existingUser) {
      // 사용자가 없으면 생성
      const now = new Date().toISOString();

      // 고유한 추천 코드 생성
      const { data: codeResult } = await supabase.rpc('generate_referral_code');
      const newReferralCode = codeResult || '';

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          name: nickname,  // 닉네임을 name으로 사용
          nickname,
          phone,
          level,
          region,
          gender,
          preferredStyle,
          experience,
          birthdate,
          profileImage: '/default-avatar.png',  // 소셜 이미지 사용 안함, 기본 아이콘
          referralCode: newReferralCode,
          referredBy: referrerId,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      result = newUser;
    } else {
      // 사용자 정보 업데이트
      const updateData: any = {
        name: nickname,  // 닉네임을 name으로도 업데이트
        nickname,
        phone,
        level,
        region,
        gender,
        preferredStyle,
        experience,
        birthdate,
      };

      // 초대 코드가 아직 없으면 생성
      if (!existingUser.referralCode) {
        const { data: codeResult } = await supabase.rpc('generate_referral_code');
        updateData.referralCode = codeResult || '';
      }

      // 추천인이 있고 아직 설정되지 않은 경우에만 추가
      if (referrerId && !existingUser.referredBy) {
        updateData.referredBy = referrerId;
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      result = updatedUser;
    }

    // 추천인에게 포인트 지급 (신규 가입 시에만) - from config
    if (referrerId && !existingUser?.referredBy) {
      const REFERRAL_REWARD_POINTS = GameSettings.referral.signup;

      // 추천인의 현재 포인트 가져오기
      const { data: referrerData } = await supabase
        .from('users')
        .select('points')
        .eq('id', referrerId)
        .single();

      // 추천인의 포인트 증가
      const { error: pointsError } = await supabase
        .from('users')
        .update({
          points: (referrerData?.points || 0) + REFERRAL_REWARD_POINTS
        })
        .eq('id', referrerId);

      if (pointsError) {
        console.error('추천 포인트 지급 오류:', pointsError);
      } else {
        // 포인트 트랜잭션 기록 (선택사항)
        await supabase.from('feather_transactions').insert({
          id: crypto.randomUUID(),
          userId: referrerId,
          amount: REFERRAL_REWARD_POINTS,
          transactionType: 'EARN',
          reason: '친구 초대 보상',
          relatedId: user.id,
          relatedType: 'REFERRAL',
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      { error: error.message || "프로필 업데이트에 실패했습니다" },
      { status: 500 }
    );
  }
}
