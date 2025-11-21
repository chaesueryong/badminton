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
    const { nickname, phone, level, region, gender, preferredStyle, experience, birthdate } = body;

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

    // 초대 코드 기능 비활성화 (referralCode 컬럼이 없음)
    let referrerId = null;

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

      // 초대 코드 기능 비활성화

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

    // 추천 기능 비활성화 - referralCode 컬럼 없음
    if (false) {
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
