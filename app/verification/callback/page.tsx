'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerificationCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('본인인증 결과를 확인하고 있습니다...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyIdentity = async () => {
      try {
        const identityVerificationId = searchParams.get('identityVerificationId');

        if (!identityVerificationId) {
          setStatus('error');
          setMessage('본인인증 정보를 찾을 수 없습니다.');
          return;
        }

        // 서버에 본인인증 결과 확인 요청
        const response = await fetch('/api/verification/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ identityVerificationId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '본인인증에 실패했습니다.');
        }

        setStatus('success');
        setMessage('본인인증이 완료되었습니다!');

        // 3초 후 프로필 페이지로 이동
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } catch (error: any) {
        console.error('본인인증 확인 오류:', error);
        setStatus('error');
        setMessage(error.message || '본인인증 처리 중 오류가 발생했습니다.');
      }
    };

    verifyIdentity();
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
                인증 완료
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
                인증 실패
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/verification')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover-hover:hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover-hover:hover:bg-gray-300 transition-colors"
                >
                  프로필로 돌아가기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerificationCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">처리 중</h1>
            <p className="text-gray-600">본인인증 결과를 확인하고 있습니다...</p>
          </div>
        </div>
      </div>
    }>
      <VerificationCallbackContent />
    </Suspense>
  );
}
