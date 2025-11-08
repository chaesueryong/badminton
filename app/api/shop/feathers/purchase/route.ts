import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/shop/feathers/purchase - 깃털 구매 완료 처리
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

    const { productId, paymentId, transactionId } = await request.json();

    if (!productId || !paymentId || !transactionId) {
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

    // 상품 정보 조회
    const { data: product, error: productError } = await supabase
      .from('feather_products')
      .select('*')
      .eq('id', productId)
      .eq('enabled', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 현재 깃털 잔액 조회
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('feathers')
      .eq('id', user.id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 깃털 지급
    const totalFeathers = product.feather_amount + (product.bonus_feathers || 0);
    const newFeatherBalance = (currentUser.feathers || 0) + totalFeathers;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        feathers: newFeatherBalance
      })
      .eq('id', user.id)
      .select('feathers')
      .single();

    if (updateError) {
      console.error('Error updating user feathers:', updateError);
      return NextResponse.json(
        { error: '깃털 지급에 실패했습니다' },
        { status: 500 }
      );
    }

    // 거래 내역 저장 (기존 feather_transactions 테이블 사용)
    await supabase.from('feather_transactions').insert({
      userId: user.id,
      amount: totalFeathers,
      transactionType: 'EARN',
      reason: `깃털 구매: ${product.name}`,
      relatedId: transactionId,
      relatedType: 'PURCHASE'
    });

    return NextResponse.json({
      success: true,
      feathersReceived: totalFeathers,
      newBalance: updatedUser?.feathers || 0
    });
  } catch (error) {
    console.error('Error in POST /api/shop/feathers/purchase:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
