"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import {
  Activity,
  Star,
  Gift,
  Users,
  Building,
  Trophy,
  MessageCircle,
  Menu,
  X,
  Home,
  User as UserIcon
} from "lucide-react";

export default function Navbar() {
  const supabase = createClientComponentClient();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // 닉네임과 프로필 이미지 가져오기
      if (session?.user) {
        supabase
          .from('users')
          .select('nickname, profileImage')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: userData }) => {
            if (userData?.nickname) {
              setNickname(userData.nickname);
            }
            if (userData?.profileImage) {
              setProfileImage(userData.profileImage);
            }
          });
      }
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from('users')
          .select('nickname, profileImage')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: userData }) => {
            if (userData?.nickname) {
              setNickname(userData.nickname);
            }
            if (userData?.profileImage) {
              setProfileImage(userData.profileImage);
            }
          });
      } else {
        setNickname("");
        setProfileImage("");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* 데스크톱 네비게이션 */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                배드메이트
              </span>
            </Link>

            {/* 데스크톱 메뉴 */}
            <div className="flex items-center space-x-1">
              <Link
                href="/meetings"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/meetings')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                모임
              </Link>
              <Link
                href="/gyms"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/gyms')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                체육관
              </Link>
              <Link
                href="/community"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/community')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                커뮤니티
              </Link>
              <Link
                href="/matching"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/matching')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                매칭
              </Link>
              <Link
                href="/leaderboard"
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive('/leaderboard')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                <Trophy className="w-4 h-4" />
                랭킹
              </Link>
              <Link
                href="/rewards"
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive('/rewards')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                <Gift className="w-4 h-4" />
                리워드
              </Link>
            </div>

            {/* 로그인/프로필 */}
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="text-gray-400">로딩...</div>
              ) : user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover-hover:hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt={nickname || "프로필"} className="w-full h-full object-cover" />
                      ) : (
                        (nickname || user.email || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {nickname || "프로필"}
                    </span>
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    }}
                    className="text-sm text-gray-600 hover-hover:hover:text-gray-900 transition"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover-hover:hover:from-blue-700 hover-hover:hover:to-indigo-700 active:scale-95 transition-all shadow-md hover-hover:hover:shadow-lg"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 상단 헤더 */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-base font-bold text-gray-900">
              배드메이트
            </span>
          </Link>
          {loading ? (
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <Link
              href="/profile"
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-md overflow-hidden"
            >
              {profileImage ? (
                <img src={profileImage} alt={nickname || "프로필"} className="w-full h-full object-cover" />
              ) : (
                (nickname || user.email || "U").charAt(0).toUpperCase()
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-md"
            >
              로그인
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="grid grid-cols-5 h-14">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center space-y-0.5 transition-all ${
              isActive('/')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">홈</span>
          </Link>

          <Link
            href="/meetings"
            className={`flex flex-col items-center justify-center space-y-0.5 transition-all ${
              isActive('/meetings')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">모임</span>
          </Link>

          <Link
            href="/matching"
            className={`flex flex-col items-center justify-center space-y-0.5 transition-all ${
              isActive('/matching')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-medium">매칭</span>
          </Link>

          <Link
            href="/community"
            className={`flex flex-col items-center justify-center space-y-0.5 transition-all ${
              isActive('/community')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium">커뮤니티</span>
          </Link>

          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center space-y-0.5 transition-all ${
              isMoreMenuOpen
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">더보기</span>
          </button>
        </div>
      </nav>

      {/* 모바일 더보기 메뉴 */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMoreMenuOpen(false)}>
          <div
            className="absolute bottom-14 left-0 right-0 bg-white border-t border-gray-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-2">
              <Link
                href="/gyms"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                  isActive('/gyms')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                <Building className="w-5 h-5" />
                <span className="text-sm font-medium">체육관</span>
              </Link>

              <Link
                href="/leaderboard"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                  isActive('/leaderboard')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">랭킹</span>
              </Link>

              <Link
                href="/rewards"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                  isActive('/rewards')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                <Gift className="w-5 h-5" />
                <span className="text-sm font-medium">리워드</span>
              </Link>

              <div className="border-t border-gray-200 mt-2 pt-2">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                        isActive('/profile')
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 active:bg-gray-50'
                      }`}
                    >
                      <UserIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">내 프로필</span>
                    </Link>

                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/";
                      }}
                      className="w-full flex items-center px-4 py-3 space-x-3 text-red-600 active:bg-red-50 transition-all"
                    >
                      <X className="w-5 h-5" />
                      <span className="text-sm font-medium">로그아웃</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center px-4 py-3 space-x-3 text-blue-600 active:bg-blue-50 transition-all"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">로그인</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
