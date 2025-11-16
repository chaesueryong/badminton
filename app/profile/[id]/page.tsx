"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ImageUpload from "@/components/ImageUpload";
import { STORAGE_BUCKETS } from "@/lib/storage";
import Image from "next/image";
import RegionSelect from "@/components/RegionSelect";
import { Feather } from "lucide-react";
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

  // YYYY.MM.DD 형식 파싱
  const match = birthdate.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
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
  total_games: number;
  wins: number;
  points: number;
  rating: number;
  feathers: number;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient();
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
          const data = profileData as any;
          const initialEditFormData = {
            nickname: data.nickname || "",
            phone: data.phone || "",
            region: data.region || "",
            level: data.level || "",
            bio: data.bio || "",
            gender: data.gender || "",
            preferredStyle: data.preferredStyle || "",
            experience: data.experience || 0,
            birthdate: data.birthdate || "",
          };
          console.log("Initial edit form data:", initialEditFormData);
          setEditFormData(initialEditFormData);
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
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
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
        setProfile(refreshedProfile as any);

        // editFormData도 새로운 데이터로 업데이트
        setEditFormData({
          nickname: (refreshedProfile as any).nickname || "",
          phone: (refreshedProfile as any).phone || "",
          region: (refreshedProfile as any).region || "",
          level: (refreshedProfile as any).level || "",
          bio: (refreshedProfile as any).bio || "",
          gender: (refreshedProfile as any).gender || "",
          preferredStyle: (refreshedProfile as any).preferredStyle || "",
          experience: (refreshedProfile as any).experience || 0,
          birthdate: (refreshedProfile as any).birthdate || "",
        });
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
      setEditFormData({
        nickname: profile.nickname || "",
        phone: profile.phone || "",
        region: profile.region || "",
        level: profile.level || "",
        bio: profile.bio || "",
        gender: profile.gender || "",
        preferredStyle: profile.preferredStyle || "",
        experience: profile.experience || 0,
        birthdate: profile.birthdate || "",
      });
    }
    setIsEditing(false);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold mb-2">{profile.nickname}</h1>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {levelLabels[profile.level] || profile.level}
                  </span>
                </div>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleCancelEdit();
                    } else {
                      // 수정 모드로 전환할 때 현재 프로필 데이터로 폼 초기화
                      if (profile) {
                        console.log("Setting edit form data from profile:", profile);
                        const newEditFormData = {
                          nickname: profile.nickname || "",
                          phone: profile.phone || "",
                          region: profile.region || "",
                          level: profile.level || "",
                          bio: profile.bio || "",
                          gender: profile.gender || "",
                          preferredStyle: profile.preferredStyle || "",
                          experience: profile.experience || 0,
                          birthdate: profile.birthdate || "",
                        };
                        console.log("New edit form data:", newEditFormData);
                        setEditFormData(newEditFormData);
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
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-4 sm:p-8 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">총 경기</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{profile.total_games || 0}</p>
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
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">승률</h3>
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
                      width: profile.total_games > 0 ? `${Math.max((profile.wins / profile.total_games) * 100, 5)}%` : '0%',
                    }}
                  >
                    <span className={`${profile.total_games > 0 && (profile.wins / profile.total_games) < 0.15 ? 'ml-1' : ''}`}>
                      {profile.total_games > 0 ? ((profile.wins / profile.total_games) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-right sm:ml-6">
                <p className="text-lg sm:text-xl font-bold">
                  {profile.total_games > 0 ? ((profile.wins / profile.total_games) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {profile.wins || 0}승 {(profile.total_games || 0) - (profile.wins || 0)}패
                </p>
              </div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="p-4 sm:p-8">
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
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    pattern="^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="010-1234-5678"
                    title="전화번호 형식: 010-1234-5678 또는 01012345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지역
                  </label>
                  <RegionSelect
                    defaultProvince={editFormData.region?.split(' ')[0] || ''}
                    defaultCity={editFormData.region?.split(' ')[1] || ''}
                    onChange={(province, city) => setEditFormData({ ...editFormData, region: `${province} ${city}` })}
                    showLabel={false}
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
                  <p className="text-gray-900">{profile.phone || "-"}</p>
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
                        {profile.birthdate} ({calculateAge(profile.birthdate) || "-"}세)
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">경력</p>
                  <p className="text-gray-900">{profile.experience || "-"}년</p>
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
                  <p className="text-gray-900">{profile.bio || "-"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
