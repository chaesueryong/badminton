'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function LoginContent() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { signInWithGoogle, signInWithKakao, session } = useAuth();

  useEffect(() => {
    // URL에서 에러 메시지 확인
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    // 이미 로그인된 경우 홈으로 리다이렉트
    if (session) {
      router.replace(redirectPath);
    }
  }, [router, redirectPath, searchParams, session]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      // Store redirect path in sessionStorage before OAuth redirect
      if (redirectPath !== '/') {
        sessionStorage.setItem('redirectAfterLogin', redirectPath);
      }

      const { error } = await signInWithGoogle();
      if (error) {
        console.error('구글 로그인 실패:', error);
        setError('구글 로그인에 실패했습니다. 다시 시도해주세요.');
      }
      // OAuth flow will redirect automatically
    } catch (error: any) {
      console.error('구글 로그인 실패:', error);
      setError('구글 로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setError('');
      setLoading(true);

      // Store redirect path in sessionStorage before OAuth redirect
      if (redirectPath !== '/') {
        sessionStorage.setItem('redirectAfterLogin', redirectPath);
      }

      const { error } = await signInWithKakao();
      if (error) {
        console.error('카카오 로그인 실패:', error);
        setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      }
      // OAuth flow will redirect automatically
    } catch (error: any) {
      console.error('카카오 로그인 실패:', error);
      setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-between p-6 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex-1 flex flex-col items-center justify-center pt-10">
          <div className="text-6xl mb-6">🏸</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">배드민턴 커뮤니티</h1>
          <p className="text-base md:text-lg text-gray-600 text-center">
            함께 운동하고 즐기는 배드민턴 플레이어들의 공간
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <div className="flex-1">
                <p className="font-medium text-sm">로그인 오류</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3 mb-8">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google로 시작하기</span>
          </button>

          {/* Kakao Login */}
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full bg-[#FEE500] text-black font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-[#FDD835] transition-colors disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.766 1.873 5.192 4.659 6.558-.196.728-.636 2.373-.732 2.746-.117.47.178.465.375.338.155-.1 2.423-1.594 3.401-2.235.415.044.84.067 1.297.067 5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
            </svg>
            <span>카카오로 시작하기</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            시작하기 버튼을 누르면{' '}
            <Link href="/terms" className="text-blue-600 underline cursor-pointer hover:text-blue-700">
              이용약관
            </Link>
            과{' '}
            <Link href="/privacy" className="text-blue-600 underline cursor-pointer hover:text-blue-700">
              개인정보 처리방침
            </Link>
            에<br />
            동의하는 것으로 간주합니다
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-600">로딩 중...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
