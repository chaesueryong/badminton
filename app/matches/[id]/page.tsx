'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Trophy, Calendar, Feather, Share2, Lock, Play, Coins } from 'lucide-react';
import { MatchType, MATCH_TYPE_LABELS } from '@/types/rating';
import Scoreboard from '@/components/Scoreboard';

interface User {
  id: string;
  name: string;
  nickname: string;
  profileImage: string | null;
}

interface Participant {
  id: string;
  team: number;
  user: User;
}

interface MatchSession {
  id: string;
  match_type: MatchType;
  status: string;
  entry_fee_points: number;
  entry_fee_feathers: number;
  winner_points: number;
  bet_currency_type: string;
  bet_amount_per_player: number;
  creation_cost_points: number;
  creation_cost_feathers: number;
  session_date: string;
  created_at: string;
  creator_id: string;
  password: string | null;
  is_ranked: boolean;
  participants: Participant[];
}

export default function MatchSessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<MatchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [sessionPassword, setSessionPassword] = useState('');
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/matches/sessions/${sessionId}`);

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      setSession(data);

      // Get current user ID from response
      if (data.current_user_id) {
        setCurrentUserId(data.current_user_id);
      }

      // Auto-show scoreboard if game is in progress
      if (data.status === 'IN_PROGRESS') {
        setShowScoreboard(true);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      toast.error('세션 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (entryCurrency: 'points' | 'feathers') => {
    if (!session) return;

    // If password is required and not provided, show error toast
    if (session.password && !sessionPassword) {
      toast.error('비밀번호를 입력해주세요');
      return;
    }

    setJoining(true);
    try {
      // Determine which team to join based on current participants
      const team1Count = session.participants.filter(p => p.team === 1).length;
      const team2Count = session.participants.filter(p => p.team === 2).length;
      const assignedTeam = team1Count <= team2Count ? 1 : 2;

      const response = await fetch(`/api/matches/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryCurrency,
          team: assignedTeam, // Auto-assign to team with fewer players
          password: session.password ? sessionPassword : null
        })
      });

      if (!response.ok) {
        const error = await response.json();

        // If wrong password, reset password input
        if (error.error === '비밀번호가 일치하지 않습니다') {
          setSessionPassword('');
          toast.error('비밀번호가 일치하지 않습니다');
          return;
        }

        // If unauthorized for other reasons (not logged in), redirect to login
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        throw new Error(error.error || '세션 참가 실패');
      }

      toast.success('세션에 참가했습니다!');
      setShowPasswordInput(false);
      setSessionPassword('');
      fetchSession(); // Refresh session data
    } catch (error: any) {
      console.error('Failed to join session:', error);
      toast.error(error.message || '세션 참가에 실패했습니다');
    } finally {
      setJoining(false);
    }
  };

  const shareSession = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${session ? MATCH_TYPE_LABELS[session.match_type] : ''} 매치 세션`,
        text: '매치 세션에 참가하세요!',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('링크가 복사되었습니다!');
    }
  };

  const handleStartGame = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/matches/sessions/${sessionId}/start`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '게임 시작에 실패했습니다');
      }

      toast.success('게임이 시작되었습니다!');
      setShowScoreboard(true);
      fetchSession(); // Refresh to update status
    } catch (error: any) {
      console.error('Failed to start game:', error);
      toast.error(error.message || '게임 시작에 실패했습니다');
    }
  };

  const handleGameEnd = async (winner: 'A' | 'B', scoreA: number, scoreB: number) => {
    if (!session) return;

    // Determine result based on match type (singles vs doubles)
    const isSingles = session.match_type === 'MS' || session.match_type === 'WS';
    const result = isSingles
      ? (winner === 'A' ? 'PLAYER1_WIN' : 'PLAYER2_WIN')
      : (winner === 'A' ? 'TEAM1_WIN' : 'TEAM2_WIN');

    const response = await fetch(`/api/matches/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result,
        team1Score: scoreA,
        team2Score: scoreB
      })
    });

    if (!response.ok) {
      const error = await response.json();
      toast.error(error.error || '게임 종료에 실패했습니다');
      throw new Error(error.error || '게임 종료에 실패했습니다');
    }

    toast.success('게임이 종료되었습니다!');
    setShowScoreboard(false);
    fetchSession(); // Refresh to show completed status
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">세션을 찾을 수 없습니다</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const maxPlayers = session.match_type === 'MS' || session.match_type === 'WS' ? 2 : 4;
  const isFull = session.participants.length >= maxPlayers;
  const isCreator = currentUserId === session.creator_id;

  // Debug log
  console.log('Debug Info:', {
    currentUserId,
    creatorId: session.creator_id,
    isCreator,
    isFull,
    status: session.status,
    participantCount: session.participants.length,
    maxPlayers
  });

  // Show scoreboard if game is in progress
  if (showScoreboard && session.status === 'IN_PROGRESS') {
    const teamA = session.participants.filter(p => p.team === 1);
    const teamB = session.participants.filter(p => p.team === 2);

    console.log('Scoreboard data:', {
      allParticipants: session.participants.map(p => ({ nickname: p.user.nickname, team: p.team })),
      teamA: teamA.map(p => ({ nickname: p.user.nickname, team: p.team })),
      teamB: teamB.map(p => ({ nickname: p.user.nickname, team: p.team }))
    });

    return (
      <Scoreboard
        sessionId={sessionId}
        matchType={session.match_type}
        teamA={{ players: teamA.map(p => p.user.nickname) }}
        teamB={{ players: teamB.map(p => p.user.nickname) }}
        onGameEnd={handleGameEnd}
        onClose={() => setShowScoreboard(false)}
        isCreator={isCreator}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {MATCH_TYPE_LABELS[session.match_type]} 매치
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-sm text-gray-600">
                  상태: <span className={`font-medium ${session.status === 'PENDING' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {session.status === 'PENDING' ? '대기 중' : session.status}
                  </span>
                </p>
                {session.password && (
                  <div className="flex items-center gap-1 text-purple-600 text-sm">
                    <Lock className="w-4 h-4" />
                    <span>비밀번호 보호</span>
                  </div>
                )}
                {session.is_ranked ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    🏆 랭크 게임
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    🎮 일반 게임
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={shareSession}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Betting Info */}
          {session.bet_currency_type !== 'NONE' && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-900 mb-1">🎲 내기 모드 활성화</p>
              <p className="text-xs text-yellow-800">
                플레이어당 {session.bet_amount_per_player} {session.bet_currency_type === 'POINTS' ? '포인트' : '깃털'} 베팅
              </p>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              참가자 ({session.participants.length}/{maxPlayers})
            </h2>
          </div>

          <div className="space-y-3">
            {session.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {participant.user.nickname?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{participant.user.nickname}</p>
                      {participant.user.id === session.creator_id && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          생성자
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">팀 {participant.team}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: maxPlayers - session.participants.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500">대기 중...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Join Buttons */}
        {!isFull && session.status === 'PENDING' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">세션 참가하기</h3>

            {/* Password Input if required */}
            {session.password && (
              <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <label className="text-sm font-medium text-purple-900">
                    비밀번호 입력 필요
                  </label>
                </div>
                <input
                  type="text"
                  value={sessionPassword}
                  onChange={(e) => setSessionPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="6자리 숫자 입력"
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Bet Information */}
            {session.bet_currency_type !== 'NONE' && session.bet_amount_per_player > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">내기 모드 활성화</h4>
                </div>
                <div className="space-y-1 text-sm text-yellow-800">
                  <p>• 각 플레이어는 <span className="font-bold text-yellow-900">
                    {session.bet_amount_per_player.toLocaleString()} {session.bet_currency_type === 'POINTS' ? '포인트' : '깃털'}
                  </span>을 걸어야 합니다</p>
                  <p>• 승리 팀이 패배 팀의 내기 금액을 가져갑니다</p>
                  <p className="text-xs text-yellow-700 mt-2">* 입장료와 별도로 내기 금액이 차감됩니다</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-4">
              입장료를 선택하세요
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleJoinSession('points')}
                disabled={joining}
                className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <p className="font-semibold flex items-center gap-1"><Coins className="w-5 h-5" /> 포인트로 참가</p>
                <p className="text-sm mt-1">{session.entry_fee_points} 포인트</p>
              </button>
              <button
                onClick={() => handleJoinSession('feathers')}
                disabled={joining}
                className="p-4 border-2 border-amber-600 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <p className="font-semibold flex items-center justify-center gap-1">
                  <Feather className="w-4 h-4" />
                  깃털로 참가
                </p>
                <p className="text-sm mt-1">{session.entry_fee_feathers} 깃털</p>
              </button>
            </div>
          </div>
        )}

        {isFull && session.status === 'PENDING' && (
          <div className="bg-green-50 rounded-lg p-6 text-center border-2 border-green-200">
            <p className="text-green-800 font-medium mb-3">모든 참가자가 모였습니다!</p>
            {isCreator && (
              <button
                onClick={handleStartGame}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5" />
                게임 시작하기
              </button>
            )}
            {!isCreator && (
              <p className="text-sm text-green-700">세션 생성자가 게임을 시작할 때까지 기다려주세요...</p>
            )}
          </div>
        )}

        {session.status === 'IN_PROGRESS' && (
          <div className="bg-blue-50 rounded-lg p-6 text-center border-2 border-blue-200">
            <p className="text-blue-800 font-medium mb-3">게임이 진행 중입니다</p>
            <button
              onClick={() => setShowScoreboard(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              점수판 보기
            </button>
          </div>
        )}

        {session.status === 'COMPLETED' && (
          <div className="bg-purple-50 rounded-lg p-6 text-center border-2 border-purple-200">
            <Trophy className="w-16 h-16 text-purple-600 mx-auto mb-3" />
            <p className="text-purple-800 font-medium">게임이 종료되었습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
