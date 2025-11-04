// 토스페이먼츠 결제 라이브러리
import { loadTossPayments } from '@tosspayments/payment-sdk'

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''

export interface PaymentRequest {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail?: string
  successUrl: string
  failUrl: string
}

// 결제 요청
export async function requestPayment(paymentData: PaymentRequest) {
  try {
    const tossPayments = await loadTossPayments(clientKey)

    await tossPayments.requestPayment('카드', {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      successUrl: paymentData.successUrl,
      failUrl: paymentData.failUrl,
    })
  } catch (error) {
    console.error('Payment request failed:', error)
    throw error
  }
}

// 결제 승인
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
) {
  const response = await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '결제 승인 실패')
  }

  return await response.json()
}

// 결제 취소
export async function cancelPayment(paymentKey: string, cancelReason: string) {
  const response = await fetch('/api/payments/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentKey,
      cancelReason,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '결제 취소 실패')
  }

  return await response.json()
}

// 주문 ID 생성
export function generateOrderId() {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
