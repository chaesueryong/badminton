import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId is required' },
        { status: 400 }
      );
    }

    // 포트원 V2 API로 결제 조회
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || '결제 조회 실패' },
        { status: response.status }
      );
    }

    const payment = await response.json();

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: '결제 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
