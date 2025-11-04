import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, cancelReason } = await request.json()

    // 토스페이먼츠 결제 취소 API 호출
    const response = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || '결제 취소 실패' },
        { status: response.status }
      )
    }

    // DB 업데이트
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    await supabase
      .from('payments')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
      })
      .eq('payment_key', paymentKey)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Payment cancel error:', error)
    return NextResponse.json(
      { error: '결제 취소 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
