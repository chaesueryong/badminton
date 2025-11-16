'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // URL에서 에러 메시지 확인
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    // 이미 로그인된 경우 홈으로 리다이렉트
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const redirect = params.get('redirect') || '/';
        router.replace(redirect);
      }
    };
    checkSession();
  }, [router]);

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      setError('');

      // Determine redirect URL based on environment
      let redirectUrl: string;

      if (process.env.NODE_ENV === 'development') {
        // Development: use window.location.origin
        redirectUrl = `${window.location.origin}/auth/callback`;
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        // Production with environment variable
        redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
      } else {
        // Fallback to window.location.origin
        redirectUrl = `${window.location.origin}/auth/callback`;
      }

      console.log('[OAuth] Redirect URL:', redirectUrl);
      console.log('[OAuth] Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        windowOrigin: window.location.origin
      });

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('로그인 에러:', error);
      setError(error.message || '소셜 로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center px-4 pt-20 md:pt-32">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">🏸 로그인</h1>
            <p className="text-gray-600">
              배드민턴 커뮤니티에 오신 것을 환영합니다
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

          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover-hover:hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
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
              Google로 로그인
            </button>

            <button
              onClick={() => handleSocialLogin('kakao')}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] py-2 rounded-lg hover-hover:hover:bg-[#FDD835] transition font-medium"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.766 1.873 5.192 4.659 6.558-.196.728-.636 2.373-.732 2.746-.117.47.178.465.375.338.155-.1 2.423-1.594 3.401-2.235.415.044.84.067 1.297.067 5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
              </svg>
              카카오로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
