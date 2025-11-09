import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/subscriptions/complete - 결제 완료 처리
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentId, transactionId, planId } = await request.json();

    if (!paymentId || !transactionId || !planId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // TODO: 실제 포트원 API로 결제 검증
    // const verified = await verifyPaymentWithPortOne(transactionId);
    // if (!verified) {
    //   return NextResponse.json({ error: '결제 검증 실패' }, { status: 400 });
    // }

    // 플랜 정보 조회
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: '플랜을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 구독 기간 계산
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.billing_period === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.billing_period === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // 구독 생성
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'ACTIVE',
        payment_provider: 'portone',
        subscription_id: transactionId,
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        auto_renew: true
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { error: '구독 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // 결제 내역 저장
    await supabase.from('payment_transactions').insert({
      user_id: user.id,
      subscription_id: subscription.id,
      payment_provider: 'portone',
      transaction_id: transactionId,
      amount: plan.price,
      currency: 'KRW',
      status: 'COMPLETED',
      payment_method: 'CARD',
      paid_at: now.toISOString()
    });

    // 사용자 VIP/프리미엄 상태 업데이트
    const isVipPlan = plan.name.includes('VIP');
    const updateData: any = {};

    if (isVipPlan) {
      updateData.is_vip = true;
      updateData.vip_until = periodEnd.toISOString();
    } else {
      updateData.is_premium = true;
      updateData.premium_until = periodEnd.toISOString();
    }

    await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/complete:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
