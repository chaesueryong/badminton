'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function SubscriptionCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('결제 결과를 확인하고 있습니다...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processPayment = async () => {
      try {
        const paymentId = searchParams.get('paymentId');
        const planId = searchParams.get('planId');

        if (!paymentId || !planId) {
          setStatus('error');
          setMessage('결제 정보를 찾을 수 없습니다.');
          return;
        }

        // 1. 포트원 서버에서 결제 상태 확인
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });

        if (!verifyResponse.ok) {
          const error = await verifyResponse.json();
          throw new Error(error.error || '결제 상태 확인 실패');
        }

        const { payment } = await verifyResponse.json();

        // 2. 결제 상태 확인
        if (payment.status !== 'PAID') {
          // 결제가 완료되지 않았거나 취소된 경우
          setStatus('error');
          if (payment.status === 'CANCELLED') {
            setMessage('결제가 취소되었습니다.');
            toast.info('결제가 취소되었습니다.');
          } else {
            setMessage('결제가 완료되지 않았습니다.');
            toast.error('결제가 완료되지 않았습니다.');
          }

          // 3초 후 상점으로 이동
          setTimeout(() => {
            router.push('/shop/subscription');
          }, 3000);
          return;
        }

        // 3. 결제 완료 처리
        const response = await fetch('/api/subscriptions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: paymentId,
            transactionId: paymentId,
            planId: planId
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '결제 완료 처리 실패');
        }

        setStatus('success');
        setMessage('구독이 완료되었습니다!');
        toast.success('구독이 완료되었습니다! 🎉');

        // 3초 후 프로필 페이지로 이동
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } catch (error: any) {
        console.error('Payment processing error:', error);
        setStatus('error');
        setMessage(error.message || '결제 처리 중 오류가 발생했습니다.');

        // 3초 후 상점으로 이동
        setTimeout(() => {
          router.push('/shop/subscription');
        }, 3000);
      }
    };

    processPayment();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                처리 중
              </h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                결제 완료
              </h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                잠시 후 프로필 페이지로 이동합니다...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                결제 실패
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/shop/subscription')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover-hover:hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={() => router.push('/shop')}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover-hover:hover:bg-gray-300 transition-colors"
                >
                  상점으로 돌아가기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">결제 결과를 확인하고 있습니다...</p>
        </div>
      </div>
    }>
      <SubscriptionCallbackContent />
    </Suspense>
  );
}
