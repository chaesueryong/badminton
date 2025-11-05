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
  DollarSign,
  ChevronLeft,
  Shield,
  Award
} from "lucide-react";

interface Participant {
  id: string;
  userId: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    nickname: string;
    level: string;
    profileImage?: string;
  };
}

interface Schedule {
  id: string;
  meetingId: string;
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
  participants?: Participant[];
}

interface Meeting {
  id: string;
  title: string;
  hostId: string;
  thumbnailImage?: string;
}

const levelLabels: Record<string, string> = {
  E_GRADE: "E조",
  D_GRADE: "D조",
  C_GRADE: "C조",
  B_GRADE: "B조",
  A_GRADE: "A조",
  S_GRADE: "자강",
};

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchSchedule();
    fetchMeeting();
  }, [params.id, params.scheduleId]);

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

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}/schedules/${params.scheduleId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        alert("일정을 찾을 수 없습니다");
        router.push(`/meetings/${params.id}`);
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setMeeting(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoinSchedule = async () => {
    if (!confirm('이 일정에 참석하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/meetings/${params.id}/schedules/${params.scheduleId}/join`, {
        method: "POST",
      });

      if (response.ok) {
        alert("일정에 참석 신청했습니다");
        fetchSchedule();
      } else {
        const error = await response.json();
        alert(error.error || "참석 신청에 실패했습니다");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다");
    }
  };

  const handleLeaveSchedule = async () => {
    if (!confirm('이 일정 참석을 취소하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/meetings/${params.id}/schedules/${params.scheduleId}/leave`, {
        method: "POST",
      });

      if (response.ok) {
        alert("일정 참석을 취소했습니다");
        fetchSchedule();
      } else {
        const error = await response.json();
        alert(error.error || "취소에 실패했습니다");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다");
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

  if (!schedule) {
    return null;
  }

  const isScheduleParticipant = schedule.participants?.some(p => p.userId === currentUserId);
  const isScheduleFull = schedule.currentCount >= schedule.maxParticipants;
  const isHost = meeting?.hostId === currentUserId;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <button
            onClick={() => router.push(`/meetings/${params.id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">모임으로 돌아가기</span>
          </button>

          {meeting && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={meeting.thumbnailImage || getDefaultImage('meeting')}
                  alt={meeting.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{meeting.title}</h1>
                <p className="text-sm text-gray-600">일정 상세</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* 일정 정보 */}
        <div className="bg-white rounded-lg border shadow-sm mb-6">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {new Date(schedule.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>{schedule.startTime} - {schedule.endTime}</span>
              </div>

              {schedule.location && (
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{schedule.location}</p>
                    {schedule.address && (
                      <p className="text-sm text-gray-500 mt-0.5">{schedule.address}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-700">
                <Users className="w-5 h-5 text-blue-600" />
                <span>
                  <span className="font-bold text-blue-600 text-lg">{schedule.currentCount}</span>
                  <span className="text-gray-500"> / </span>
                  <span>{schedule.maxParticipants}명</span>
                </span>
              </div>

              {schedule.fee > 0 && (
                <div className="flex items-center gap-3 text-gray-700">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span>{schedule.fee.toLocaleString()}원</span>
                </div>
              )}
            </div>

            {schedule.notes && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">메모</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{schedule.notes}</p>
              </div>
            )}
          </div>

          {/* 참가 버튼 */}
          {schedule.status === 'OPEN' && (
            <div className="p-6">
              {isScheduleParticipant ? (
                <button
                  onClick={handleLeaveSchedule}
                  className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-bold text-lg hover:bg-red-100 transition"
                >
                  참석 취소
                </button>
              ) : (
                <button
                  onClick={handleJoinSchedule}
                  disabled={isScheduleFull}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScheduleFull ? '마감' : '참석하기'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 참가자 목록 */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              참가자 목록 ({schedule.participants?.length || 0}명)
            </h2>
          </div>

          {!schedule.participants || schedule.participants.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 참가자가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y">
              {schedule.participants.map((participant, idx) => (
                <Link
                  key={participant.id}
                  href={`/profile/${participant.user.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0">
                    <img
                      src={participant.user.profileImage || getDefaultImage('profile')}
                      alt={participant.user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{participant.user.name}</span>
                      {participant.userId === meeting?.hostId && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
                          👑 주최자
                        </span>
                      )}
                      {idx === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                          최초 참가
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{participant.user.nickname}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(participant.joinedAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} 참가
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {levelLabels[participant.user.level] || participant.user.level}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
