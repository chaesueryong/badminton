import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/subscriptions/checkout - 결제 준비
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: '플랜 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 플랜 정보 조회
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: '플랜을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, nickname, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 이미 활성 구독이 있는지 확인
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: '이미 활성화된 구독이 있습니다' },
        { status: 400 }
      );
    }

    // 결제 ID 생성 (고유하고 추적 가능하도록)
    const paymentId = `payment-${user.id}-${Date.now()}`;

    return NextResponse.json({
      paymentId,
      plan,
      user: {
        id: user.id,
        name: userData.name || userData.nickname,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/checkout:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
