'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Shield, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    PortOne?: any;
  }
}

export default function VerificationPage() {
  const [user, setUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // 이미 인증되었는지 확인
      const { data: userData } = await supabase
        .from('users')
        .select('is_verified, verified_name, birth_date, phone')
        .eq('id', session.user.id)
        .maybeSingle();

      if ((userData as any)?.is_verified) {
        setIsVerified(true);
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    // PortOne SDK 로드
    const script = document.createElement('script');
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleVerification = async () => {
    if (!window.PortOne) {
      setError('본인인증 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const response = await window.PortOne.requestIdentityVerification({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
        identityVerificationId: `verification_${user.id}_${Date.now()}`,
        redirectUrl: `${window.location.origin}/verification/callback`,
      });

      if (response.code != null) {
        setError(`본인인증 실패: ${response.message}`);
        setVerifying(false);
        return;
      }

      // 성공 시 콜백 페이지로 리다이렉트됨
    } catch (err: any) {
      console.error('본인인증 오류:', err);
      setError('본인인증 중 오류가 발생했습니다.');
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                본인인증 완료
              </h1>
              <p className="text-gray-600 mb-6">
                이미 본인인증이 완료되었습니다.
              </p>
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover-hover:hover:bg-blue-700 transition-colors"
              >
                프로필로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              본인인증
            </h1>
            <p className="text-gray-600">
              안전한 서비스 이용을 위해 본인인증을 진행해주세요.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">본인인증이 필요한 이유</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 안전한 모임 참여</li>
              <li>• 중복 가입 방지</li>
              <li>• 신뢰할 수 있는 커뮤니티 조성</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerification}
            disabled={verifying}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover-hover:hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {verifying ? '인증 진행 중...' : '본인인증 시작'}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/profile')}
              className="text-sm text-gray-600 hover-hover:hover:text-gray-900"
            >
              나중에 하기
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>본인인증은 PortOne을 통해 안전하게 처리됩니다.</p>
          <p>인증 과정에서 수집된 정보는 본인 확인 용도로만 사용됩니다.</p>
        </div>
      </div>
    </div>
  );
}
