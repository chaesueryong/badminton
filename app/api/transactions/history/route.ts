import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/transactions/history - 전체 거래 내역 조회
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'all', 'feathers', 'points', 'purchases'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let transactions: any[] = [];

    // 깃털 거래 내역 조회
    if (!type || type === 'all' || type === 'feathers') {
      const { data: featherTxs, error: featherError } = await supabase
        .from('feather_transactions')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!featherError && featherTxs) {
        transactions.push(...featherTxs.map(tx => ({
          ...tx,
          category: 'feather',
          displayAmount: tx.amount,
          displayType: tx.transactionType,
          date: tx.createdAt
        })));
      }
    }

    // 매치 입장료 거래 내역
    if (!type || type === 'all' || type === 'points' || type === 'matches') {
      const { data: matchTxs, error: matchError } = await supabase
        .from('match_entry_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!matchError && matchTxs) {
        transactions.push(...matchTxs.map(tx => ({
          ...tx,
          category: tx.currency_type === 'POINTS' ? 'points' : 'feather',
          displayAmount: tx.amount,
          displayType: tx.transaction_type,
          date: tx.created_at,
          reason: tx.transaction_type === 'ENTRY_FEE' ? '매치 입장료' : '매치 입장료 환불'
        })));
      }
    }

    // 결제 거래 내역
    if (!type || type === 'all' || type === 'purchases') {
      const { data: paymentTxs, error: paymentError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!paymentError && paymentTxs) {
        transactions.push(...paymentTxs.map(tx => ({
          ...tx,
          category: 'purchase',
          displayAmount: tx.amount,
          displayType: 'PURCHASE',
          date: tx.created_at,
          reason: `결제 - ${tx.status}`
        })));
      }
    }

    // 구매 내역
    if (!type || type === 'all' || type === 'purchases') {
      const { data: purchaseTxs, error: purchaseError } = await supabase
        .from('purchase_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!purchaseError && purchaseTxs) {
        transactions.push(...purchaseTxs.map(tx => ({
          ...tx,
          category: 'purchase',
          displayAmount: tx.amount_paid,
          displayType: 'PURCHASE',
          date: tx.created_at,
          reason: `${tx.item_type} 구매`
        })));
      }
    }

    // 날짜순 정렬
    transactions.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // limit 적용
    transactions = transactions.slice(0, limit);

    return NextResponse.json({
      transactions,
      total: transactions.length
    });
  } catch (error) {
    console.error('Error in GET /api/transactions/history:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
