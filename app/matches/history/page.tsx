'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar, Users } from 'lucide-react';
import { MatchType, MATCH_TYPE_LABELS } from '@/types/rating';

interface MatchSession {
  id: string;
  match_type: MatchType;
  status: string;
  result: string | null;
  team1_score: number | null;
  team2_score: number | null;
  completed_at: string | null;
  session_date: string;
  is_ranked: boolean;
  participants: Array<{
    id: string;
    team: number;
    rating_change: number | null;
    user: {
      id: string;
      nickname: string;
      profileImage: string | null;
    };
  }>;
}

export default function MatchHistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/matches/sessions/history');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch match history');
      }

      const data = await response.json();
      setSessions(data.sessions);
      setCurrentUserId(data.current_user_id);
    } catch (error) {
      console.error('Failed to fetch match history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultText = (session: MatchSession, userId: string) => {
    if (!session.result) return '-';

    const userParticipant = session.participants.find(p => p.user.id === userId);
    if (!userParticipant) return '-';

    const isSingles = session.match_type === 'MS' || session.match_type === 'WS';

    if (isSingles) {
      const isPlayer1 = userParticipant.team === 1;
      const won = (session.result === 'PLAYER1_WIN' && isPlayer1) ||
                  (session.result === 'PLAYER2_WIN' && !isPlayer1);
      return won ? '승리' : '패배';
    } else {
      const isTeam1 = userParticipant.team === 1;
      const won = (session.result === 'TEAM1_WIN' && isTeam1) ||
                  (session.result === 'TEAM2_WIN' && !isTeam1);
      return won ? '승리' : '패배';
    }
  };

  const getResultColor = (resultText: string) => {
    if (resultText === '승리') return 'text-blue-600 bg-blue-50';
    if (resultText === '패배') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            매치 내역
          </h1>
          <p className="text-gray-600">참가한 모든 매치 기록을 확인하세요</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">완료된 매치가 없습니다</p>
            <p className="text-sm text-gray-400">매치를 완료하면 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const team1 = session.participants.filter(p => p.team === 1);
              const team2 = session.participants.filter(p => p.team === 2);
              const currentUserId = session.participants[0]?.user.id; // This should be replaced with actual current user ID

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/matches/${session.id}`)}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {MATCH_TYPE_LABELS[session.match_type]}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getResultColor(getResultText(session, currentUserId))}`}>
                            {getResultText(session, currentUserId)}
                          </span>
                          {session.is_ranked ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              🏆 랭크
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              🎮 일반
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {session.completed_at
                              ? new Date(session.completed_at).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-center flex-1">
                        <div className="text-sm text-gray-600 mb-1">팀 A</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {session.team1_score ?? '-'}
                        </div>
                      </div>
                      <div className="text-gray-400 font-medium">VS</div>
                      <div className="text-center flex-1">
                        <div className="text-sm text-gray-600 mb-1">팀 B</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {session.team2_score ?? '-'}
                        </div>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">팀 A</div>
                        <div className="space-y-1">
                          {team1.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{p.user.nickname}</span>
                              {p.rating_change !== null && (
                                <span className={`text-xs font-medium ${
                                  p.rating_change > 0 ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                  {p.rating_change > 0 ? '+' : ''}{p.rating_change}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-2">팀 B</div>
                        <div className="space-y-1">
                          {team2.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{p.user.nickname}</span>
                              {p.rating_change !== null && (
                                <span className={`text-xs font-medium ${
                                  p.rating_change > 0 ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                  {p.rating_change > 0 ? '+' : ''}{p.rating_change}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
