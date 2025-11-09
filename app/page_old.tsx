"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, [supabase.auth]);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="text-6xl">🏸</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            배드민턴으로 연결되는
            <br />
            즐거운 순간
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            함께하는 배드민턴 커뮤니티 플랫폼에서
            <br />
            새로운 친구를 만나고 실력을 키워보세요
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  시작하기
                </Link>
                <Link
                  href="/meetings"
                  className="px-8 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition border border-gray-300"
                >
                  모임 둘러보기
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/meetings"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  모임 찾기
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-8 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition border border-gray-300"
                >
                  랭킹 보기
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              주요 기능
            </h2>
            <p className="text-gray-600">
              배드민턴을 더 즐겁게 만드는 기능들
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">모임 찾기</h3>
              <p className="text-sm text-gray-600">
                내 주변의 배드민턴 모임을 쉽게 찾아보세요
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">스마트 매칭</h3>
              <p className="text-sm text-gray-600">
                비슷한 실력의 파트너를 자동으로 찾아드립니다
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">실력 평가</h3>
              <p className="text-sm text-gray-600">
                ELO 알고리즘으로 공정하게 실력을 평가합니다
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🎁</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">리워드</h3>
              <p className="text-sm text-gray-600">
                활동하고 포인트를 모아 리워드로 교환하세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
            <div>
              <div className="text-3xl font-bold mb-1">1,000+</div>
              <div className="text-sm text-blue-100">활성 회원</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-sm text-blue-100">진행된 모임</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">50+</div>
              <div className="text-sm text-blue-100">등록된 체육관</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">4.8★</div>
              <div className="text-sm text-blue-100">평균 평점</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            이렇게 시작하세요
          </h2>
          <p className="text-gray-600">
            3단계로 간단하게 시작할 수 있습니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              1
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">가입하기</h3>
            <p className="text-sm text-gray-600">
              간편하게 회원가입하고 프로필을 작성하세요
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              2
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">모임 찾기</h3>
            <p className="text-sm text-gray-600">
              내 지역과 실력에 맞는 모임을 찾아보세요
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
              3
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">함께 즐기기</h3>
            <p className="text-sm text-gray-600">
              새로운 친구들과 함께 배드민턴을 즐기세요
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-600 mb-6">
            무료로 가입하고 배드민턴의 즐거움을 함께하세요
          </p>
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              무료로 시작하기 →
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
