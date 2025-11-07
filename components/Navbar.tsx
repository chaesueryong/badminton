"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { getDefaultImage } from "@/lib/constants";
import {
  Activity,
  Star,
  Gift,
  Users,
  Trophy,
  MessageCircle,
  Menu,
  X,
  Home,
  User as UserIcon,
  Bell,
  MapPin,
  Feather,
  Crown,
  Sparkles,
  UserPlus
} from "lucide-react";

export default function Navbar() {
  const supabase = createClientComponentClient();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [userRegion, setUserRegion] = useState<string>("");
  const [feathers, setFeathers] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isVIP, setIsVIP] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // 닉네임, 프로필 이미지, 지역, 깃털, 포인트 가져오기
      if (session?.user) {
        supabase
          .from('users')
          .select('nickname, profileImage, region, feathers, points')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: userData }) => {
            if (userData?.nickname) {
              setNickname(userData.nickname);
            }
            if (userData?.profileImage) {
              setProfileImage(userData.profileImage);
            }
            if (userData?.region) {
              setUserRegion(userData.region);
            }
            if (userData?.feathers !== undefined) {
              setFeathers(userData.feathers);
            }
            if (userData?.points !== undefined) {
              setPoints(userData.points);
            }
          });

        // Check Premium membership
        const now = new Date().toISOString();
        supabase
          .from('premium_memberships')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gte('end_date', now)
          .maybeSingle()
          .then(({ data }) => {
            setIsPremium(!!data);
          });

        // Check VIP membership
        supabase
          .from('vip_memberships')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gte('end_date', now)
          .maybeSingle()
          .then(({ data }) => {
            setIsVIP(!!data);
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
          .select('nickname, profileImage, region, feathers, points')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: userData }) => {
            if (userData?.nickname) {
              setNickname(userData.nickname);
            }
            if (userData?.profileImage) {
              setProfileImage(userData.profileImage);
            }
            if (userData?.region) {
              setUserRegion(userData.region);
            }
            if (userData?.feathers !== undefined) {
              setFeathers(userData.feathers);
            }
            if (userData?.points !== undefined) {
              setPoints(userData.points);
            }
          });

        // Check Premium membership
        const now = new Date().toISOString();
        supabase
          .from('premium_memberships')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gte('end_date', now)
          .maybeSingle()
          .then(({ data }) => {
            setIsPremium(!!data);
          });

        // Check VIP membership
        supabase
          .from('vip_memberships')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gte('end_date', now)
          .maybeSingle()
          .then(({ data }) => {
            setIsVIP(!!data);
          });
      } else {
        setNickname("");
        setProfileImage("");
        setUserRegion("");
        setFeathers(0);
        setPoints(0);
        setIsPremium(false);
        setIsVIP(false);
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
                href="/ratings"
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  pathname?.startsWith('/ratings') || pathname?.startsWith('/matches')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                <Trophy className="w-4 h-4" />
                레이팅
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
              <Link
                href="/shop"
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive('/shop')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover-hover:hover:bg-gray-50'
                }`}
              >
                <Feather className="w-4 h-4" />
                상점
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
                      <img
                        src={profileImage || getDefaultImage('profile')}
                        alt={nickname || "프로필"}
                        className="w-full h-full object-cover"
                      />
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
          {/* 왼쪽: 지역 표시 */}
          {user && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {userRegion || "지역 미설정"}
              </span>
            </div>
          )}

          {/* 오른쪽: 프리미엄/VIP 뱃지, 깃털, 포인트, 알림, 메시지 */}
          <div className={`flex items-center gap-2 ${!user ? 'ml-auto' : ''}`}>
            {user && (
              <>
                {isPremium && (
                  <Link
                    href="/shop/subscription"
                    className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full border border-pink-200"
                  >
                    <Crown className="w-3 h-3 text-pink-600" />
                    <span className="text-[10px] font-bold text-pink-700">프리미엄</span>
                  </Link>
                )}
                {isVIP && (
                  <Link
                    href="/shop/subscription"
                    className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-full border border-purple-200"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span className="text-[10px] font-bold text-purple-700">VIP</span>
                  </Link>
                )}
                <Link
                  href="/shop"
                  className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200 hover-hover:hover:from-blue-100 hover-hover:hover:to-indigo-100 transition-all cursor-pointer"
                >
                  <Star className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] font-semibold text-blue-700">{points.toLocaleString()}</span>
                </Link>
                <Link
                  href="/shop"
                  className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-full border border-amber-200 hover-hover:hover:from-amber-100 hover-hover:hover:to-yellow-100 transition-all cursor-pointer"
                >
                  <Feather className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-semibold text-amber-700">{feathers.toLocaleString()}</span>
                </Link>
                <Link href="/notifications" className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                </Link>
                <Link href="/messages">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                </Link>
              </>
            )}
            {!loading && !user && (
              <Link
                href="/login"
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-md"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          <Link
            href="/"
            onClick={() => setIsMoreMenuOpen(false)}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive('/')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={isActive('/') ? 2.5 : 2} />
            <span className="text-[10px] leading-none">홈</span>
          </Link>

          <Link
            href={user ? "/meetings/my" : "/meetings"}
            onClick={() => setIsMoreMenuOpen(false)}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive('/meetings') || isActive('/meetings/my')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Users className="w-5 h-5" strokeWidth={isActive('/meetings') || isActive('/meetings/my') ? 2.5 : 2} />
            <span className="text-[10px] leading-none">{user ? "내모임" : "모임"}</span>
          </Link>

          <Link
            href="/ratings"
            onClick={() => setIsMoreMenuOpen(false)}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              pathname?.startsWith('/ratings') || pathname?.startsWith('/matches') || pathname?.startsWith('/invitations')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Trophy className="w-5 h-5" strokeWidth={(pathname?.startsWith('/ratings') || pathname?.startsWith('/matches') || pathname?.startsWith('/invitations')) ? 2.5 : 2} />
            <span className="text-[10px] leading-none">레이팅</span>
          </Link>

          <Link
            href="/community"
            onClick={() => setIsMoreMenuOpen(false)}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isActive('/community')
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <MessageCircle className="w-5 h-5" strokeWidth={isActive('/community') ? 2.5 : 2} />
            <span className="text-[10px] leading-none">커뮤니티</span>
          </Link>

          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              isMoreMenuOpen
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Menu className="w-5 h-5" strokeWidth={isMoreMenuOpen ? 2.5 : 2} />
            <span className="text-[10px] leading-none">더보기</span>
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
              {user && (
                <>
                  <Link
                    href="/matches/create"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                      isActive('/matches/create')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 active:bg-gray-50'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
                    <span className="text-sm font-medium">매치 생성</span>
                  </Link>

                  <Link
                    href="/invitations"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                      isActive('/invitations')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 active:bg-gray-50'
                    }`}
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="text-sm font-medium">매치 초대</span>
                  </Link>

                  <Link
                    href="/matches/my-sessions"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                      isActive('/matches/my-sessions')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 active:bg-gray-50'
                    }`}
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="text-sm font-medium">내 세션</span>
                  </Link>
                </>
              )}

              <Link
                href="/matching"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                  isActive('/matching')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">파트너 매칭</span>
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              {user && (
                <>
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

                  <Link
                    href="/shop"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center px-4 py-3 space-x-3 transition-all ${
                      isActive('/shop')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 active:bg-gray-50'
                    }`}
                  >
                    <Feather className="w-5 h-5" />
                    <span className="text-sm font-medium">상점</span>
                  </Link>
                </>
              )}

              <div className="border-t border-gray-200 mt-2 pt-2">
                {user && (
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
                    <span className="text-sm font-medium">프로필</span>
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
