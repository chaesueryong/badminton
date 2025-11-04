"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Meeting {
  id: string;
  title: string;
  hostId: string;
  isRegular: boolean;
  regularSchedule?: string;
}

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

export default function MeetingManagePage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    address: "",
    maxParticipants: 10,
    fee: 0,
    notes: "",
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchMeeting();
    fetchSchedules();
  }, [params.id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.id);
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

        // 호스트가 아니면 접근 불가
        if (currentUserId && data.hostId !== currentUserId) {
          alert("모임 관리 권한이 없습니다");
          router.push(`/meetings/${params.id}`);
        }
      }
    } catch (error) {
      console.error(error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch(`/api/meetings/${params.id}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("일정이 생성되었습니다!");
        setFormData({
          date: "",
          startTime: "",
          endTime: "",
          location: "",
          address: "",
          maxParticipants: 10,
          fee: 0,
          notes: "",
        });
        fetchSchedules();
      } else {
        const error = await response.json();
        alert(error.error || "일정 생성에 실패했습니다");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/meetings/${params.id}/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("일정이 삭제되었습니다");
        fetchSchedules();
      } else {
        alert("일정 삭제에 실패했습니다");
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

  if (!meeting) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/meetings/${params.id}`)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{meeting.title} 관리</h1>
          <p className="text-gray-600 mt-2">정기 모임 일정을 생성하고 관리하세요</p>
        </div>

        {/* 일정 생성 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">새 일정 만들기</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜 *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 인원 *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간 *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간 *
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                장소
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="예: 서울시민체육관"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="상세 주소"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참가비 (원)
              </label>
              <input
                type="number"
                min="0"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="일정에 대한 추가 안내사항"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isCreating ? "생성 중..." : "일정 생성"}
            </button>
          </form>
        </div>

        {/* 일정 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {schedules.length === 0 ? (
            <p className="text-gray-600 text-center py-8">아직 생성된 일정이 없습니다</p>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {new Date(schedule.date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </h3>
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
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>⏰ {schedule.startTime} - {schedule.endTime}</p>
                        {schedule.location && <p>📍 {schedule.location}</p>}
                        <p>👥 {schedule.currentCount}/{schedule.maxParticipants}명</p>
                        {schedule.fee > 0 && <p>💰 {schedule.fee.toLocaleString()}원</p>}
                        {schedule.notes && <p className="mt-2 text-gray-700">📝 {schedule.notes}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="ml-4 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
