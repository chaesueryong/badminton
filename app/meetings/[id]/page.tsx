"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getDefaultImage } from "@/lib/constants";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Target,
  UserCheck,
  Cake,
  DollarSign,
  Activity,
  RefreshCw,
  Tag,
  Share2,
  Heart,
  Shield,
  Award,
  BarChart3
} from "lucide-react";

interface Participant {
  id: string;
  userId: string;
  status: string;
  role?: string;
  user: {
    id: string;
    name: string;
    nickname: string;
    level: string;
    profileImage?: string;
  };
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  currentCount: number;
  maxParticipants: number;
  level: string | null;
  levelMin?: string;
  levelMax?: string;
  fee: number;
  feePeriod?: string;
  status: string;
  hostId: string;
  thumbnailImage?: string;
  images?: string[];
  tags?: string[];
  isRegular?: boolean;
  regularSchedule?: string;
  categoryType?: string;
  requiredGender?: string;
  ageMin?: number;
  ageMax?: number;
  views?: number;
  region?: string;
  host: {
    id: string;
    name: string;
    nickname: string;
    level: string;
    profileImage?: string;
  };
  participants?: Participant[];
}

const levelLabels: Record<string, string> = {
  E_GRADE: "E조",
  D_GRADE: "D조",
  C_GRADE: "C조",
  B_GRADE: "B조",
  A_GRADE: "A조",
  S_GRADE: "자강",
  BEGINNER: "E조",
  INTERMEDIATE: "C조",
  ADVANCED: "B조",
  EXPERT: "A조",
};

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  address?: string;
  maxParticipants: number;
  currentCount: number;
  status: string;
  fee: number;
  notes?: string;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchMeeting();
    fetchSchedules();
  }, [params.id]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setMeeting(data);
      } else {
        alert("모임을 찾을 수 없습니다");
        router.push("/meetings");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}/schedules`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/meetings/${params.id}/join`, {
        method: "POST",
      });

      if (response.ok) {
        alert("모임 참가 신청이 완료되었습니다!");
        fetchMeeting();
      } else {
        const error = await response.json();
        alert(error.error || "참가 신청에 실패했습니다");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다");
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: meeting?.title || '배드민턴 모임',
      text: meeting?.description || '배드민턴 모임에 참여하세요!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // 웹 공유 API를 지원하지 않는 경우 URL 복사
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  const isFull = meeting.currentCount >= meeting.maxParticipants;
  const isOpen = meeting.status === "OPEN";
  const isHost = currentUserId === meeting.hostId;
  const isParticipant = meeting.participants?.some(p => p.userId === currentUserId);

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-0">
      {/* 상단 이미지 */}
      <div className="w-full h-48 sm:h-64 md:h-96 bg-gray-200">
        <img
          src={meeting.thumbnailImage || (meeting.images && meeting.images.length > 0 ? meeting.images[0] : getDefaultImage('meeting'))}
          alt={meeting.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container mx-auto px-2 sm:px-4 max-w-4xl py-2 sm:py-8">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
          {/* 헤더 */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{meeting.title}</h1>
              </div>
              {isHost && (
                <button
                  onClick={() => router.push(`/meetings/${params.id}/edit`)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover-hover:hover:bg-blue-700 transition font-medium text-xs sm:text-sm"
                >
                  모임 수정
                </button>
              )}
            </div>
          </div>

          {/* 모임 소개 */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📝 모임 소개</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                {meeting.description || '소개글이 없습니다.'}
              </p>
            </div>
          </div>

          {/* 일정 */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                일정 {schedules.length > 0 && `(${schedules.length})`}
              </h2>
              {isHost && (
                <button
                  onClick={() => router.push(`/meetings/${params.id}/manage`)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  관리 →
                </button>
              )}
            </div>
            {schedules.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="mb-3">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <p className="text-gray-500 text-sm">등록된 일정이 없습니다</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {schedules.slice(0, 3).map((schedule) => (
                    <div
                      key={schedule.id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/meetings/${params.id}/schedules/${schedule.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="text-center min-w-[50px] sm:min-w-[60px]">
                              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                {new Date(schedule.date).getDate()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(schedule.date).toLocaleDateString('ko-KR', { month: 'short' })}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {new Date(schedule.date).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </h3>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-0.5">
                                <p>🕐 {schedule.startTime} - {schedule.endTime}</p>
                                {schedule.location && (
                                  <p className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-500" />
                                    <span className="truncate">{schedule.location}</span>
                                  </p>
                                )}
                                {schedule.fee > 0 && (
                                  <p className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-gray-500" />
                                    {schedule.fee.toLocaleString()}원
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-3">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />
                            <span className="text-sm sm:text-lg font-bold text-blue-600">
                              {schedule.currentCount}/{schedule.maxParticipants}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            schedule.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                            schedule.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {schedule.status === 'OPEN' ? '모집중' :
                             schedule.status === 'CLOSED' ? '마감' :
                             schedule.status === 'COMPLETED' ? '완료' : '취소'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {schedules.length > 3 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => {
                        const schedulesSection = document.getElementById('all-schedules');
                        schedulesSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      전체 일정 보기 ({schedules.length}개) →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 운영진 */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
              운영진
            </h2>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              {/* 호스트 */}
              <Link href={`/profile/${meeting.host.id}`} className="text-center hover:opacity-80 transition-opacity">
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl mb-1 sm:mb-2 mx-auto overflow-hidden">
                  <img
                    src={meeting.host.profileImage || getDefaultImage('profile')}
                    alt={meeting.host.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs sm:text-sm font-medium">{meeting.host.nickname}</span>
                  <span className="text-xs px-1 sm:px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">👑</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{levelLabels[meeting.host.level] || meeting.host.level}</p>
              </Link>

              {/* 매니저들 */}
              {meeting.participants?.filter(p => p.status === 'MANAGER' || p.role === 'MANAGER').map((manager) => (
                <Link key={manager.id} href={`/profile/${manager.user.id}`} className="text-center hover:opacity-80 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-2 mx-auto overflow-hidden">
                    <img
                      src={manager.user.profileImage || getDefaultImage('profile')}
                      alt={manager.user.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-medium">{manager.user.nickname}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">⭐</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{levelLabels[manager.user.level] || manager.user.level}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* 모임 정보 */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
              모임 정보
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-gray-700">
              {meeting.region && (
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">지역</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">{meeting.region}</p>
                  </div>
                </div>
              )}
              {meeting.location && (
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg sm:text-xl flex-shrink-0">🏢</span>
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">장소</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">{meeting.location}</p>
                  </div>
                </div>
              )}
              {meeting.date && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">일시</p>
                    <p className="text-sm text-gray-600">
                      {new Date(meeting.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                      {meeting.startTime && meeting.endTime && (
                        <span> {meeting.startTime} - {meeting.endTime}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {meeting.isRegular && meeting.regularSchedule && (
                <div className="flex items-start gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">정기 모임</p>
                    <p className="text-sm text-gray-600">{meeting.regularSchedule}</p>
                  </div>
                </div>
              )}
              {meeting.categoryType && (
                <div className="flex items-start gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">모임 유형</p>
                    <p className="text-sm text-gray-600">
                      {meeting.categoryType === 'ONE_TIME' && '일회성 모임'}
                      {meeting.categoryType === 'REGULAR' && '정기 모임'}
                      {meeting.categoryType === 'TOURNAMENT' && '대회/토너먼트'}
                      {meeting.categoryType === 'LESSON' && '레슨/강습'}
                      {meeting.categoryType === 'SOCIAL' && '친목'}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 sm:w-5 h-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm text-gray-900">모집 인원</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">최대 {meeting.maxParticipants}명</p>
                </div>
              </div>
              {(meeting.levelMin || meeting.levelMax) && (
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <Target className="w-5 sm:w-5 h-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">실력 급수</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      {meeting.levelMin && meeting.levelMax
                        ? `${levelLabels[meeting.levelMin]} ~ ${levelLabels[meeting.levelMax]}`
                        : meeting.levelMin
                        ? `${levelLabels[meeting.levelMin]} 이상`
                        : meeting.levelMax ? `${levelLabels[meeting.levelMax]} 이하` : ''}
                    </p>
                  </div>
                </div>
              )}
              {meeting.requiredGender && meeting.requiredGender !== 'ANY' && (
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <UserCheck className="w-5 sm:w-5 h-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">성별 제한</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      {meeting.requiredGender === 'MALE' && '남성만'}
                      {meeting.requiredGender === 'FEMALE' && '여성만'}
                    </p>
                  </div>
                </div>
              )}
              {(meeting.ageMin || meeting.ageMax) && (
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <Cake className="w-5 sm:w-5 h-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">나이 제한</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      {meeting.ageMin && meeting.ageMax
                        ? `${meeting.ageMin}세 ~ ${meeting.ageMax}세`
                        : meeting.ageMin
                        ? `${meeting.ageMin}세 이상`
                        : `${meeting.ageMax}세 이하`}
                    </p>
                  </div>
                </div>
              )}
              {meeting.fee > 0 && (
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="w-5 sm:w-5 h-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-900">참가비</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      {meeting.fee.toLocaleString()}원
                      {meeting.feePeriod && meeting.feePeriod !== 'monthly' && (
                        <span>
                          {meeting.feePeriod === 'quarterly' && '/분기'}
                          {meeting.feePeriod === 'yearly' && '/연'}
                        </span>
                      )}
                      {(!meeting.feePeriod || meeting.feePeriod === 'monthly') && '/월'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 전체 일정 */}
          {schedules.length > 3 && (
            <div id="all-schedules" className="p-4 sm:p-6 md:p-8 border-b">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold">전체 일정 {schedules.length}</h2>
                {isHost && (
                  <button
                    onClick={() => router.push(`/meetings/${params.id}/manage`)}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    일정 관리 →
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-300 transition cursor-pointer"
                      onClick={() => router.push(`/meetings/${params.id}/schedules/${schedule.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="text-center min-w-[50px] sm:min-w-[60px]">
                              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                {new Date(schedule.date).getDate()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(schedule.date).toLocaleDateString('ko-KR', { month: 'short' })}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {new Date(schedule.date).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </h3>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-0.5">
                                <p>🕐 {schedule.startTime} - {schedule.endTime}</p>
                                {schedule.location && (
                                  <p className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-500" />
                                    <span className="truncate">{schedule.location}</span>
                                  </p>
                                )}
                                {schedule.fee > 0 && (
                                  <p className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-gray-500" />
                                    {schedule.fee.toLocaleString()}원
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-3">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />
                            <span className="text-sm sm:text-lg font-bold text-blue-600">
                              {schedule.currentCount}/{schedule.maxParticipants}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            schedule.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                            schedule.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {schedule.status === 'OPEN' ? '모집중' :
                             schedule.status === 'CLOSED' ? '마감' :
                             schedule.status === 'COMPLETED' ? '완료' : '취소'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          )}

          {/* 모임 상태 */}
          <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
              참가 현황
            </h2>
            <div className="space-y-4">
              {/* 급수 분포 */}
              {(() => {
                const levelCount: Record<string, number> = {};

                // 호스트 급수 추가
                if (meeting.host?.level) {
                  levelCount[meeting.host.level] = 1;
                }

                // 참가자 급수 추가
                if (meeting.participants && meeting.participants.length > 0) {
                  meeting.participants.forEach(p => {
                    const level = p.user.level;
                    levelCount[level] = (levelCount[level] || 0) + 1;
                  });
                }

                const totalMembers = (meeting.participants?.length || 0) + 1;
                const grades = ['S_GRADE', 'A_GRADE', 'B_GRADE', 'C_GRADE', 'D_GRADE', 'E_GRADE'];
                const gradeColors: Record<string, string> = {
                  'S_GRADE': 'from-purple-500 to-purple-700',
                  'A_GRADE': 'from-red-500 to-red-700',
                  'B_GRADE': 'from-orange-500 to-orange-700',
                  'C_GRADE': 'from-yellow-500 to-yellow-700',
                  'D_GRADE': 'from-green-500 to-green-700',
                  'E_GRADE': 'from-blue-500 to-blue-700',
                };
                const hasData = grades.some(grade => levelCount[grade] > 0);

                if (!hasData) return null;

                return (
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">급수 분포</h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      {grades.map(grade => {
                        const count = levelCount[grade] || 0;
                        if (count === 0) return null;
                        const percentage = (count / totalMembers) * 100;

                        return (
                          <div key={grade} className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-gray-700">
                              {levelLabels[grade]}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-5 sm:h-6 relative overflow-hidden">
                              <div
                                className={`bg-gradient-to-r ${gradeColors[grade]} h-full rounded-full flex items-center justify-end pr-1.5 sm:pr-2 transition-all duration-300`}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                              >
                                <span className="text-xs font-medium text-white">
                                  {count}명
                                </span>
                              </div>
                            </div>
                            <div className="w-10 sm:w-12 text-xs sm:text-sm text-gray-600 text-right">
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 태그 */}
              {meeting.tags && meeting.tags.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">모임 태그</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {meeting.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 모임 멤버 */}
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold">멤버 {meeting.participants.length}</h2>
                <button className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                  <span className="flex items-center gap-1">
                    최근가입
                    <RefreshCw className="w-3 h-3" />
                  </span>
                </button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {meeting.participants.map((participant, idx) => (
                  <Link key={participant.id} href={`/profile/${participant.user.id}`} className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-medium flex-shrink-0 overflow-hidden text-sm sm:text-base">
                      <img
                        src={participant.user.profileImage || getDefaultImage('profile')}
                        alt={participant.user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{participant.user.name}</span>
                        {participant.userId === meeting.hostId && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 sm:px-2 py-0.5 rounded font-medium">
                            Premium Sponsor
                          </span>
                        )}
                        {idx < 2 && idx > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 rounded font-medium">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{participant.user.nickname || levelLabels[participant.user.level]}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg md:hidden z-40">
        <div className="container mx-auto px-4 max-w-5xl py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-6 sm:gap-8">
              <button onClick={handleShare} className="flex flex-col items-center hover:opacity-70 transition">
                <Share2 className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
                <span className="text-xs text-gray-600 mt-0.5">공유하기</span>
              </button>
            </div>
            {isOpen && !isHost && !isParticipant && (
              <button
                onClick={handleJoin}
                disabled={isFull || isJoining}
                className="flex-1 bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-lg hover-hover:hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isFull ? "모집 마감" : isJoining ? "신청 중..." : "참가 신청"}
              </button>
            )}
            {isHost && (
              <button
                onClick={() => router.push(`/meetings/${params.id}/manage`)}
                className="flex-1 bg-gray-600 text-white py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-lg hover-hover:hover:bg-gray-700 transition"
              >
                모임 관리
              </button>
            )}
            {isParticipant && !isHost && (
              <button className="flex-1 bg-green-600 text-white py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-lg">
                ✓ 참가 중
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 데스크톱 플로팅 버튼 */}
      <div className="hidden md:block fixed bottom-8 right-8">
        <div className="flex gap-3">
          <button onClick={handleShare} className="bg-white border border-gray-200 shadow-lg rounded-full p-3 hover:bg-gray-50 transition">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
          {isOpen && !isHost && !isParticipant && (
            <button
              onClick={handleJoin}
              disabled={isFull || isJoining}
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg"
            >
              {isFull ? "모집 마감" : isJoining ? "신청 중..." : "참가 신청"}
            </button>
          )}
          {isHost && (
            <button
              onClick={() => router.push(`/meetings/${params.id}/manage`)}
              className="bg-gray-600 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-700 transition shadow-lg"
            >
              모임 관리
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
