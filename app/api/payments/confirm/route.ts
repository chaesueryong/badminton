import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    // 토스페이먼츠 결제 승인 API 호출
    const response = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || '결제 승인 실패' },
        { status: response.status }
      )
    }

    // DB에 결제 정보 저장
    const supabase = await createClient()

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        payment_key: paymentKey,
        amount,
        status: 'COMPLETED',
        method: result.method,
        approved_at: new Date(result.approvedAt).toISOString(),
        metadata: result,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      payment,
      tossResult: result,
    })
  } catch (error) {
    console.error('Payment confirm error:', error)
    return NextResponse.json(
      { error: '결제 승인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
