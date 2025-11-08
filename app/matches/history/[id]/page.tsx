'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import FloatingActionButton from '@/components/FloatingActionButton';
import {
  MatchType,
  MATCH_TYPE_LABELS,
  getRatingTier,
  formatRatingChange
} from '@/types/rating';

interface MatchHistory {
  id: string;
  matchType: MatchType;
  status: string;
  result: string | null;
  team: 1 | 2;
  isWinner: boolean;
  score: {
    team1: number | null;
    team2: number | null;
    userTeam: number | null;
    opponentTeam: number | null;
  };
  rating: {
    before: number | null;
    after: number | null;
    change: number | null;
  };
  entryFee: {
    points: number;
    feathers: number;
  };
  pointsEarned: number;
  location: string | null;
  sessionDate: string;
  completedAt: string | null;
  teammates: Array<{
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
    ratingBefore: number | null;
    ratingAfter: number | null;
    ratingChange: number | null;
  }>;
  opponents: Array<{
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
    ratingBefore: number | null;
    ratingAfter: number | null;
    ratingChange: number | null;
  }>;
}

interface MatchStats {
  totalMatches: number;
  completed: number;
  wins: number;
  losses: number;
  totalRatingGained: number;
  totalPointsEarned: number;
}

export default function MatchHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const userId = params.id as string;
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<MatchType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchMatchHistory();
  }, [userId, filterType, filterStatus]);

  const fetchMatchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'ALL') params.append('matchType', filterType);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      params.append('limit', '50');

      const response = await fetch(`/api/users/${userId}/matches?${params.toString()}`);

      // If unauthorized, redirect to login
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch match history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const matchTypes: (MatchType | 'ALL')[] = ['ALL', 'MS', 'WS', 'MD', 'WD', 'XD'];
  const statusOptions = [
    { value: 'ALL', label: '전체' },
    { value: 'COMPLETED', label: '완료' },
    { value: 'PENDING', label: '대기중' },
    { value: 'CANCELLED', label: '취소됨' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">매치 기록</h1>
          <p className="text-gray-600">모든 경기 내역과 통계를 확인하세요</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">총 경기</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalMatches}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">완료</div>
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">승리</div>
              <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">패배</div>
              <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">레이팅 변화</div>
              <div className={`text-2xl font-bold ${stats.totalRatingGained >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatRatingChange(stats.totalRatingGained)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">획득 포인트</div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalPointsEarned}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Match Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경기 종목
              </label>
              <div className="flex flex-wrap gap-2">
                {matchTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'ALL' ? '전체' : MATCH_TYPE_LABELS[type as MatchType]}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Match List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">매치 기록을 불러오는 중...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <p>매치 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => router.push(`/matches/${match.id}`)}
                className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                  match.status === 'COMPLETED'
                    ? match.isWinner
                      ? 'border-green-500'
                      : 'border-red-500'
                    : match.status === 'CANCELLED'
                    ? 'border-gray-400'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Match Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                        {MATCH_TYPE_LABELS[match.matchType]}
                      </span>
                      {match.status === 'COMPLETED' && (
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            match.isWinner
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {match.isWinner ? '승리' : '패배'}
                        </span>
                      )}
                      {match.status === 'PENDING' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">
                          대기중
                        </span>
                      )}
                      {match.status === 'CANCELLED' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded">
                          취소됨
                        </span>
                      )}
                    </div>

                    {/* Participants */}
                    <div className="space-y-2 mb-3">
                      {/* Teammates */}
                      {match.teammates.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">팀원:</span>
                          {match.teammates.map((teammate) => (
                            <div key={teammate.id} className="flex items-center space-x-1">
                              <span className="font-medium">{teammate.nickname || teammate.name}</span>
                              {teammate.ratingChange !== null && match.status === 'COMPLETED' && (
                                <span
                                  className={`text-xs ${
                                    teammate.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  ({formatRatingChange(teammate.ratingChange)})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Opponents */}
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">상대:</span>
                        {match.opponents.map((opponent, idx) => (
                          <div key={opponent.id} className="flex items-center space-x-1">
                            {idx > 0 && <span className="text-gray-400">&</span>}
                            <span className="font-medium">{opponent.nickname || opponent.name}</span>
                            {opponent.ratingChange !== null && match.status === 'COMPLETED' && (
                              <span
                                className={`text-xs ${
                                  opponent.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                ({formatRatingChange(opponent.ratingChange)})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score & Rating */}
                    {match.status === 'COMPLETED' && (
                      <div className="flex items-center space-x-6 mb-3">
                        {/* Score */}
                        {match.score.userTeam !== null && match.score.opponentTeam !== null && (
                          <div className="text-sm">
                            <span className="text-gray-500">점수:</span>
                            <span className="ml-2 font-semibold text-lg">
                              {match.score.userTeam} - {match.score.opponentTeam}
                            </span>
                          </div>
                        )}

                        {/* Rating Change */}
                        {match.rating.change !== null && (
                          <div className="text-sm">
                            <span className="text-gray-500">레이팅:</span>
                            <span className="ml-2">
                              {match.rating.before}
                              <span
                                className={`ml-1 font-semibold ${
                                  match.rating.change >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {formatRatingChange(match.rating.change)}
                              </span>
                              <span className="ml-1">→ {match.rating.after}</span>
                            </span>
                          </div>
                        )}

                        {/* Points Earned */}
                        {match.pointsEarned > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">획득:</span>
                            <span className="ml-2 font-semibold text-purple-600">
                              +{match.pointsEarned} 포인트
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Date & Location */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDate(match.completedAt || match.sessionDate)}</span>
                      {match.location && (
                        <>
                          <span>•</span>
                          <span>{match.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Tier Badge */}
                  {match.rating.after !== null && match.status === 'COMPLETED' && (
                    <div className="ml-4">
                      <div className="text-center">
                        <div className="text-3xl mb-1">
                          {getRatingTier(match.rating.after).icon}
                        </div>
                        <div
                          className="text-xs font-medium"
                          style={{ color: getRatingTier(match.rating.after).color }}
                        >
                          {getRatingTier(match.rating.after).name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
}
