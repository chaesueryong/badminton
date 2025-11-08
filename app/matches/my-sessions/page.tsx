'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Users, Trophy, Calendar, Copy, Check, Feather, Coins } from 'lucide-react';
import { MatchType, MATCH_TYPE_LABELS } from '@/types/rating';
import { toast } from 'sonner';

interface MatchSession {
  id: string;
  match_type: MatchType;
  status: string;
  entry_fee_points: number;
  entry_fee_feathers: number;
  bet_currency_type: string;
  bet_amount_per_player: number;
  session_date: string;
  created_at: string;
  is_ranked: boolean;
  participants: Array<{
    user: {
      id: string;
      name: string;
      nickname: string;
      profileImage: string | null;
    };
  }>;
}

export default function MySessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch sessions - API will handle auth
    fetchMySessionsInit();
  }, []);

  const fetchMySessionsInit = async () => {
    try {
      const response = await fetch('/api/matches/sessions/my-sessions');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        setCurrentUserId(data.userId);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copySessionLink = (sessionId: string) => {
    const link = `${window.location.origin}/matches/${sessionId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareSession = async (sessionId: string, matchType: MatchType) => {
    const link = `${window.location.origin}/matches/${sessionId}`;
    const text = `배드민턴 매치에 참가하세요! (${MATCH_TYPE_LABELS[matchType]})`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '배드민턴 매치 초대',
          text: text,
          url: link,
        });
      } catch (err) {
        console.log('공유 취소됨');
      }
    } else {
      copySessionLink(sessionId);
      toast.success('링크가 복사되었습니다!');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('세션을 삭제하시겠습니까? 세션 생성 비용이 환불됩니다.')) return;

    try {
      const response = await fetch(`/api/matches/sessions/${sessionId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('세션이 삭제되었습니다.');
        fetchMySessionsInit();
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('세션 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내가 생성한 세션</h1>
          <p className="text-gray-600">대기 중인 매치 세션을 관리하세요</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">생성한 세션이 없습니다.</p>
            <button
              onClick={() => router.push('/matches/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              세션 생성하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                        {MATCH_TYPE_LABELS[session.match_type]}
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">
                        {session.status === 'PENDING' ? '대기 중' : session.status === 'IN_PROGRESS' ? '진행 중' : '완료'}
                      </span>
                      {session.is_ranked ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                          🏆 랭크 게임
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded">
                          🎮 일반 게임
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(session.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>참가자: {session.participants.length}명</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-700">
                          입장료: {session.entry_fee_points} 포인트 / {session.entry_fee_feathers} 깃털
                        </span>
                      </div>
                      {session.bet_currency_type !== 'NONE' && session.bet_amount_per_player > 0 && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-700">
                            내기: {session.bet_amount_per_player} {session.bet_currency_type === 'POINTS' ? '포인트' : '깃털'} /인
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push(`/matches/${session.id}`)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    세션 보기
                  </button>
                  <button
                    onClick={() => copySessionLink(session.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                  >
                    {copiedId === session.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        링크 복사
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => shareSession(session.id, session.match_type)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    공유
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
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
  );
}
