"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ImageUpload from "@/components/ImageUpload";
import { STORAGE_BUCKETS } from "@/lib/storage";
import Image from "next/image";
import RegionSelect from "@/components/RegionSelect";
import { formatPhoneNumber, unformatPhoneNumber } from "@/lib/utils/phone";
import { Feather, Trophy, Gift, Copy, Share2, Crown, Sparkles, Shield, CheckCircle } from "lucide-react";
import { usePremium } from "@/lib/hooks/usePremium";
import { toast } from "sonner";

const levelLabels: Record<string, string> = {
  E_GRADE: "E조",
  D_GRADE: "D조",
  C_GRADE: "C조",
  B_GRADE: "B조",
  A_GRADE: "A조",
  S_GRADE: "자강",
  // 레거시 지원
  BEGINNER: "E조",
  INTERMEDIATE: "C조",
  ADVANCED: "B조",
  EXPERT: "A조",
};

// 생년월일로부터 나이 계산하는 함수
function calculateAge(birthdate: string | null): number | null {
  if (!birthdate) return null;

  // YYYY.MM.DD 또는 YYYY-MM-DD 형식 파싱
  const match = birthdate.match(/^(\d{4})[.\-](\d{2})[.\-](\d{2})$/);
  if (!match) return null;

  const birthYear = parseInt(match[1]);
  const birthMonth = parseInt(match[2]);
  const birthDay = parseInt(match[3]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - birthYear;

  // 생일이 아직 안 지났으면 1살 빼기
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age;
}

interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  email: string | null;
  level: string;
  region: string | null;
  phone: string | null;
  bio: string | null;
  profileImage: string | null;
  gender: string | null;
  preferredStyle: string | null;
  experience: number | null;
  age: number | null;
  birthdate: string | null;
  totalGames: number;
  wins: number;
  points: number;
  rating: number;
  feathers: number;
  createdAt: string;
  referralCode: string | null;
  referredBy: string | null;
  is_vip: boolean | null;
  vip_until: string | null;
  is_premium: boolean | null;
  premium_until: string | null;
  is_verified: boolean | null;
  verified_name: string | null;
  verified_at: string | null;
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const { isPremium, loading: premiumLoading } = usePremium();
  const [editFormData, setEditFormData] = useState({
    nickname: "",
    phone: "",
    region: "",
    level: "",
    bio: "",
    gender: "",
    preferredStyle: "",
    experience: 0,
    birthdate: "",
  });
  const [editProvince, setEditProvince] = useState("");
  const [editCity, setEditCity] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const shareReferralCode = async () => {
    if (!profile?.referralCode) return;

    const shareText = `배드메이트에 초대합니다! 초대 코드: ${profile.referralCode}`;
    const shareUrl = `${window.location.origin}/onboarding`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '배드메이트 초대',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('공유 취소됨');
      }
    } else {
      // 모바일이 아닌 경우 클립보드에 복사
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('초대 링크가 복사되었습니다!');
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Check if user is logged in
      if (!session?.user && !userId) {
        router.push("/login");
        setLoading(false);
        return;
      }

      setCurrentUser(session?.user || null);

      // Determine which profile to fetch
      const profileId = userId || session?.user?.id;

      if (!profileId) {
        setLoading(false);
        return;
      }

      // Check if viewing own profile
      setIsOwnProfile(!userId || userId === session?.user?.id);

      // 프로필 데이터 가져오기
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileData) {
        console.log("Profile data loaded:", profileData);
        setProfile(profileData);
        if (isOwnProfile) {
          // birthdate를 YYYY-MM-DD에서 YYYY.MM.DD로 변환
          let formattedBirthdate = "";
          if ((profileData as any).birthdate) {
            formattedBirthdate = (profileData as any).birthdate.replace(/-/g, '.');
          }

          // 지역 파싱
          let province = "";
          let city = "";
          if ((profileData as any).region) {
            const parts = (profileData as any).region.split(' ');
            if (parts.length === 2) {
              province = parts[0];
              city = parts[1];
            }
          }

          const initialEditFormData = {
            nickname: (profileData as any).nickname || "",
            phone: formatPhoneNumber((profileData as any).phone) || "",
            region: (profileData as any).region || "",
            level: (profileData as any).level || "",
            bio: (profileData as any).bio || "",
            gender: (profileData as any).gender || "",
            preferredStyle: (profileData as any).preferredStyle || "",
            experience: (profileData as any).experience || 0,
            birthdate: formattedBirthdate,
          };
          console.log("Initial edit form data:", initialEditFormData);
          setEditFormData(initialEditFormData);
          setEditProvince(province);
          setEditCity(city);
        }
        setLoading(false);
      } else if (isOwnProfile && session?.user) {
        console.log('No profile data found, redirecting to onboarding');
        // 프로필이 없으면 온보딩으로 (자신의 프로필만)
        setLoading(false);
        router.push("/onboarding");
      } else {
        // 다른 사용자의 프로필이 없을 때
        setLoading(false);
        toast.error("사용자를 찾을 수 없습니다.");
        router.push("/");
      }
    };

    fetchUserProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user && !userId) {
        router.push("/login");
      } else {
        setCurrentUser(session?.user || null);
        // Update isOwnProfile when auth state changes
        setIsOwnProfile(!userId || userId === session?.user?.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, userId]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;

    console.log("Submitting profile data:", editFormData);

    setSubmitting(true);
    try {
      // Prepare data with unformatted phone number
      const submitData = {
        ...editFormData,
        phone: unformatPhoneNumber(editFormData.phone),
      };

      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Update failed:", errorData);
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      console.log("Received updated profile:", updatedProfile);

      // Supabase에서 최신 데이터 다시 가져오기
      const { data: refreshedProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!fetchError && refreshedProfile) {
        console.log("Refreshed profile from database:", refreshedProfile);
        setProfile(refreshedProfile);

        // birthdate를 YYYY-MM-DD에서 YYYY.MM.DD로 변환
        let formattedBirthdate = "";
        if ((refreshedProfile as any).birthdate) {
          formattedBirthdate = (refreshedProfile as any).birthdate.replace(/-/g, '.');
        }

        // 지역 파싱
        let province = "";
        let city = "";
        if ((refreshedProfile as any).region) {
          const parts = (refreshedProfile as any).region.split(' ');
          if (parts.length === 2) {
            province = parts[0];
            city = parts[1];
          }
        }

        // editFormData도 새로운 데이터로 업데이트
        setEditFormData({
          nickname: (refreshedProfile as any).nickname || "",
          phone: formatPhoneNumber((refreshedProfile as any).phone) || "",
          region: (refreshedProfile as any).region || "",
          level: (refreshedProfile as any).level || "",
          bio: (refreshedProfile as any).bio || "",
          gender: (refreshedProfile as any).gender || "",
          preferredStyle: (refreshedProfile as any).preferredStyle || "",
          experience: (refreshedProfile as any).experience || 0,
          birthdate: formattedBirthdate,
        });
        setEditProvince(province);
        setEditCity(city);
      } else {
        // 실패 시 API 응답 데이터 사용
        setProfile({
          ...profile,
          ...updatedProfile,
        });
      }

      setIsEditing(false);
      toast.success("프로필이 수정되었습니다!");
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      toast.error("프로필 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    // 수정 취소 시 원래 데이터로 복원
    if (profile) {
      // birthdate 변환
      let formattedBirthdate = "";
      if (profile.birthdate) {
        formattedBirthdate = profile.birthdate.replace(/-/g, '.');
      }

      // 지역 파싱
      let province = "";
      let city = "";
      if (profile.region) {
        const parts = profile.region.split(' ');
        if (parts.length === 2) {
          province = parts[0];
          city = parts[1];
        }
      }

      setEditFormData({
        nickname: profile.nickname || "",
        phone: formatPhoneNumber(profile.phone) || "",
        region: profile.region || "",
        level: profile.level || "",
        bio: profile.bio || "",
        gender: profile.gender || "",
        preferredStyle: profile.preferredStyle || "",
        experience: profile.experience || 0,
        birthdate: formattedBirthdate,
      });
      setEditProvince(province);
      setEditCity(city);
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (!confirm("정말 로그아웃 하시겠습니까?")) return;

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
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

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 md:py-8">
      <div className="md:container md:mx-auto md:px-4 md:max-w-4xl">
        <div className="bg-white md:rounded-lg md:shadow-md overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold mb-4 sm:mb-0 sm:mr-6 overflow-hidden relative">
                  {profile.profileImage && profile.profileImage !== '/default-avatar.png' ? (
                    <Image
                      src={profile.profileImage}
                      alt={profile.nickname}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 96px"
                    />
                  ) : (
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isOwnProfile && isPremium && (
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1.5 sm:p-2 shadow-lg">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <h1 className="text-xl sm:text-2xl font-bold">{profile.nickname}</h1>
                    {isOwnProfile && isPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-xs font-bold text-white shadow-md">
                        <Crown className="w-3 h-3" />
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {levelLabels[profile.level] || profile.level}
                  </span>
                </div>
              </div>
              {isOwnProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleCancelEdit();
                      } else {
                        // 수정 모드로 전환할 때 현재 프로필 데이터로 폼 초기화
                        if (profile) {
                          console.log("Setting edit form data from profile:", profile);
                          // birthdate를 YYYY-MM-DD에서 YYYY.MM.DD로 변환
                          let formattedBirthdate = "";
                          if (profile.birthdate) {
                            formattedBirthdate = profile.birthdate.replace(/-/g, '.');
                          }

                          // 지역 파싱
                          let province = "";
                          let city = "";
                          if (profile.region) {
                            const parts = profile.region.split(' ');
                            if (parts.length === 2) {
                              province = parts[0];
                              city = parts[1];
                            }
                          }

                          const newEditFormData = {
                            nickname: profile.nickname || "",
                            phone: formatPhoneNumber(profile.phone) || "",
                            region: profile.region || "",
                            level: profile.level || "",
                            bio: profile.bio || "",
                            gender: profile.gender || "",
                            preferredStyle: profile.preferredStyle || "",
                            experience: profile.experience || 0,
                            birthdate: formattedBirthdate,
                          };
                          console.log("New edit form data:", newEditFormData);
                          setEditFormData(newEditFormData);
                          setEditProvince(province);
                          setEditCity(city);
                        } else {
                          console.log("Profile is null or undefined");
                        }
                        setIsEditing(true);
                      }
                    }}
                    className="bg-white/20 hover-hover:hover:bg-white/30 px-4 sm:px-6 py-2 rounded-lg transition text-sm sm:text-base"
                  >
                    {isEditing ? "취소" : "프로필 수정"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-4 sm:p-8 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">총 경기</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{profile.totalGames || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">승리</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{profile.wins || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">레이팅</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{profile.rating || 1500}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">포인트</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{profile.points || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">깃털</p>
              <div className="flex items-center justify-center gap-1">
                <Feather className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                <p className="text-lg sm:text-2xl font-bold text-amber-600">{(profile.feathers || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 승률 */}
          <div className="p-4 sm:p-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">승률</h3>
              <button
                onClick={() => router.push(`/matches/history/${profile.id}`)}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 hover-hover:hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trophy className="w-4 h-4" />
                <span>매치 기록</span>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                  <span>승</span>
                  <span>패</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full flex items-center justify-center text-xs text-white font-semibold transition-all duration-300"
                    style={{
                      width: profile.totalGames > 0 ? `${Math.max((profile.wins / profile.totalGames) * 100, 5)}%` : '0%',
                    }}
                  >
                    <span className={`${profile.totalGames > 0 && (profile.wins / profile.totalGames) < 0.15 ? 'ml-1' : ''}`}>
                      {profile.totalGames > 0 ? ((profile.wins / profile.totalGames) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-right sm:ml-6">
                <p className="text-lg sm:text-xl font-bold">
                  {profile.totalGames > 0 ? ((profile.wins / profile.totalGames) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {profile.wins || 0}승 {(profile.totalGames || 0) - (profile.wins || 0)}패
                </p>
              </div>
            </div>
          </div>

          {/* VIP/프리미엄 구독 정보 - 자신의 프로필일 때만 표시 */}
          {isOwnProfile && (profile.is_vip || profile.is_premium) && (
            <div className="p-4 sm:p-8 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">구독 정보</h3>
              <div className="space-y-3">
                {/* VIP 구독 */}
                {profile.is_vip && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 sm:p-6 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        <h4 className="text-lg font-bold text-purple-900">VIP 멤버십</h4>
                      </div>
                      {profile.vip_until && new Date(profile.vip_until) > new Date() ? (
                        <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">활성</span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">만료</span>
                      )}
                    </div>
                    {profile.vip_until && (
                      <div className="text-sm text-purple-700 space-y-1">
                        <p className="font-medium">
                          만료일: {new Date(profile.vip_until).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {new Date(profile.vip_until) > new Date() ? (
                          <p className="text-xs text-purple-600">
                            {Math.ceil((new Date(profile.vip_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음
                          </p>
                        ) : (
                          <p className="text-xs text-red-600">만료되었습니다</p>
                        )}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="text-xs text-purple-700 font-medium mb-1">VIP 혜택:</p>
                      <ul className="text-xs text-purple-600 space-y-0.5 ml-4">
                        <li>• 세션 생성 무제한</li>
                        <li>• 세션 입장료 무료</li>
                        <li>• 메시징 무제한</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 프리미엄 구독 */}
                {profile.is_premium && (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 sm:p-6 border-2 border-pink-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Crown className="w-6 h-6 text-pink-600" />
                        <h4 className="text-lg font-bold text-pink-900">프리미엄 멤버십</h4>
                      </div>
                      {profile.premium_until && new Date(profile.premium_until) > new Date() ? (
                        <span className="px-3 py-1 bg-pink-600 text-white text-xs font-bold rounded-full">활성</span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">만료</span>
                      )}
                    </div>
                    {profile.premium_until && (
                      <div className="text-sm text-pink-700 space-y-1">
                        <p className="font-medium">
                          만료일: {new Date(profile.premium_until).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {new Date(profile.premium_until) > new Date() ? (
                          <p className="text-xs text-pink-600">
                            {Math.ceil((new Date(profile.premium_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음
                          </p>
                        ) : (
                          <p className="text-xs text-red-600">만료되었습니다</p>
                        )}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-pink-200">
                      <p className="text-xs text-pink-700 font-medium mb-1">프리미엄 혜택:</p>
                      <ul className="text-xs text-pink-600 space-y-0.5 ml-4">
                        <li>• 모임인원 300명까지 제한 해제</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 구독 연장 버튼 */}
                <Link
                  href="/shop/subscription"
                  className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center font-bold rounded-lg hover-hover:hover:from-blue-700 hover-hover:hover:to-purple-700 transition-all shadow-md hover-hover:hover:shadow-lg"
                >
                  구독 연장하기
                </Link>
              </div>
            </div>
          )}

          {/* 초대 코드 - 자신의 프로필일 때만 표시 */}
          {isOwnProfile && profile.referralCode && (
            <div className="p-4 sm:p-8 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">친구 초대</h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">내 초대 코드</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 tracking-wider">
                      {profile.referralCode}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyReferralCode}
                      className="p-3 bg-white rounded-lg shadow hover-hover:hover:shadow-md transition active:scale-95"
                      title="복사하기"
                    >
                      {copySuccess ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <Copy className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={shareReferralCode}
                      className="p-3 bg-white rounded-lg shadow hover-hover:hover:shadow-md transition active:scale-95"
                      title="공유하기"
                    >
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>친구가 이 코드로 가입하면 100 포인트를 받아요!</p>
                  <p className="text-xs text-gray-500">가입 시 초대 코드를 입력하도록 안내해주세요.</p>
                </div>
              </div>
            </div>
          )}

          {/* 본인인증 상태 - 자신의 프로필일 때만 표시 */}
          {isOwnProfile && (
            <div className="p-4 sm:p-8 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">본인인증</h3>
              {profile.is_verified ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900">인증 완료</p>
                      <p className="text-sm text-green-700">
                        {profile.verified_name}님으로 본인인증이 완료되었습니다.
                      </p>
                    </div>
                  </div>
                  {profile.verified_at && (
                    <p className="text-xs text-green-600 mt-2">
                      인증일: {new Date(profile.verified_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">본인인증이 필요합니다</p>
                      <p className="text-sm text-blue-700">
                        안전한 서비스 이용을 위해 본인인증을 진행해주세요.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/verification"
                    className="block w-full py-2.5 bg-blue-600 text-white text-center font-medium rounded-lg hover-hover:hover:bg-blue-700 transition-colors"
                  >
                    본인인증 하기
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* 상세 정보 */}
          <div className="p-4 sm:p-8 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">상세 정보</h3>
            {isEditing && isOwnProfile ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프로필 이미지
                  </label>
                  <ImageUpload
                    bucket={STORAGE_BUCKETS.PROFILES}
                    path={currentUser?.id}
                    currentImage={profile.profileImage || undefined}
                    onUpload={async (url) => {
                      // 이미지 업로드 시 즉시 API로 프로필 업데이트
                      try {
                        if (!currentUser) return;
                        const response = await fetch(`/api/users/${currentUser.id}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ profileImage: url }),
                        });

                        if (!response.ok) throw new Error('Failed to update profile image');

                        const updatedProfile = await response.json();
                        setProfile({
                          ...profile,
                          profileImage: url,
                        });
                        toast.success("프로필 이미지가 업데이트되었습니다!");
                      } catch (error) {
                        console.error("프로필 이미지 업데이트 실패:", error);
                        toast.error("프로필 이미지 업데이트에 실패했습니다.");
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={profile.email || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    닉네임
                  </label>
                  <input
                    type="text"
                    value={editFormData.nickname}
                    onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow user to type, but format on blur
                      setEditFormData({ ...editFormData, phone: value });
                    }}
                    onBlur={(e) => {
                      // Format the phone number on blur
                      const formatted = formatPhoneNumber(e.target.value);
                      setEditFormData({ ...editFormData, phone: formatted });
                    }}
                    pattern="^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="010-1234-5678"
                    title="전화번호 형식: 010-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지역
                  </label>
                  <RegionSelect
                    defaultProvince={editProvince}
                    defaultCity={editCity}
                    showLabel={false}
                    onChange={(province, city) => {
                      setEditProvince(province);
                      setEditCity(city);
                      const newRegion = province && city ? `${province} ${city}` : "";
                      setEditFormData({ ...editFormData, region: newRegion });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    성별
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="MALE">남성</option>
                    <option value="FEMALE">여성</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    생년월일
                  </label>
                  <input
                    type="text"
                    value={editFormData.birthdate}
                    onChange={(e) => setEditFormData({ ...editFormData, birthdate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="1994.06.04"
                    pattern="\d{4}\.\d{2}\.\d{2}"
                    title="생년월일 형식: YYYY.MM.DD (예: 1994.06.04)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    급수
                  </label>
                  <select
                    value={editFormData.level}
                    onChange={(e) => setEditFormData({ ...editFormData, level: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="E_GRADE">E조</option>
                    <option value="D_GRADE">D조</option>
                    <option value="C_GRADE">C조</option>
                    <option value="B_GRADE">B조</option>
                    <option value="A_GRADE">A조</option>
                    <option value="S_GRADE">자강</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    경력 (년)
                  </label>
                  <input
                    type="number"
                    value={editFormData.experience}
                    onChange={(e) => setEditFormData({ ...editFormData, experience: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    min="0"
                    max="50"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    선호 스타일
                  </label>
                  <select
                    value={editFormData.preferredStyle}
                    onChange={(e) => setEditFormData({ ...editFormData, preferredStyle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">선택하세요</option>
                    <option value="ALL">전체</option>
                    <option value="MENS_DOUBLES">남복 (남자 복식)</option>
                    <option value="MIXED_DOUBLES">혼복 (혼합 복식)</option>
                    <option value="WOMENS_DOUBLES">여복 (여자 복식)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    자기소개
                  </label>
                  <textarea
                    rows={4}
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover-hover:hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {submitting ? "저장 중..." : "저장하기"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">이메일</p>
                  <p className="text-gray-900">{profile.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">전화번호</p>
                  <p className="text-gray-900">{formatPhoneNumber(profile.phone) || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">급수</p>
                  <p className="text-gray-900">{levelLabels[profile.level] || profile.level || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">성별</p>
                  <p className="text-gray-900">{profile.gender === "MALE" ? "남성" : profile.gender === "FEMALE" ? "여성" : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">생년월일 (나이)</p>
                  <p className="text-gray-900">
                    {profile.birthdate ? (
                      <>
                        {profile.birthdate.replace(/-/g, '.')} ({calculateAge(profile.birthdate) || "-"}세)
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">경력</p>
                  <p className="text-gray-900">{profile.experience ? `${profile.experience}년` : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">선호 스타일</p>
                  <p className="text-gray-900">
                    {profile.preferredStyle === "ALL" ? "전체" :
                     profile.preferredStyle === "MENS_DOUBLES" ? "남복 (남자 복식)" :
                     profile.preferredStyle === "MIXED_DOUBLES" ? "혼복 (혼합 복식)" :
                     profile.preferredStyle === "WOMENS_DOUBLES" ? "여복 (여자 복식)" : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">지역</p>
                  <p className="text-gray-900">{profile.region || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">자기소개</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || "-"}</p>
                </div>
              </div>
            )}
          </div>

          {/* 로그아웃 버튼 - 자신의 프로필일 때만 표시 */}
          {isOwnProfile && (
            <div className="p-4 sm:p-8 border-b border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 py-3 rounded-lg hover-hover:hover:bg-red-100 transition font-medium"
              >
                로그아웃
              </button>
            </div>
          )}

          {/* 푸터 정보 - 모바일에서만 표시 */}
          <div className="p-4 sm:p-8 md:hidden space-y-6">
            {/* 사이트 정보 */}
            <div>
              <h3 className="font-bold text-base mb-2">배드메이트</h3>
              <p className="text-gray-600 text-sm">
                배드민턴 모임 찾기, 파트너 매칭,
                <br />
                체육관 정보까지 한곳에서
              </p>
            </div>

            {/* 법적 고지 */}
            <div>
              <h3 className="font-semibold text-sm mb-2 text-gray-700">법적 고지</h3>
              <div className="space-y-2 text-sm">
                <a
                  href="/terms"
                  className="block text-gray-600 hover-hover:hover:text-gray-900 transition-colors"
                >
                  이용약관
                </a>
                <a
                  href="/privacy"
                  className="block text-gray-600 hover-hover:hover:text-gray-900 transition-colors"
                >
                  개인정보처리방침
                </a>
              </div>
            </div>

            {/* 문의 */}
            <div>
              <h3 className="font-semibold text-sm mb-2 text-gray-700">문의하기</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>이메일: contact@badmate.kr</li>
                <li>개인정보 관련: privacy@badmate.kr</li>
              </ul>
            </div>

            {/* 저작권 */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">
                &copy; {new Date().getFullYear()} 배드메이트 (BadMate). All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
