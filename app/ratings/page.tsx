'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FloatingActionButton from '@/components/FloatingActionButton';
import {
  MatchType,
  MATCH_TYPE_LABELS,
  LeaderboardEntry,
  getRatingTier
} from '@/types/rating';

export default function RatingsPage() {
  const router = useRouter();
  const [matchType, setMatchType] = useState<MatchType | 'ALL'>('ALL');
  const [region, setRegion] = useState<string>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [matchType, region]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (region !== 'all') params.append('region', region);
      params.append('limit', '50');

      const response = await fetch(`/api/leaderboard/${matchType}?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const matchTypes: (MatchType | 'ALL')[] = ['ALL', 'MS', 'WS', 'MD', 'WD', 'XD'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">레이팅 랭킹</h1>
          <p className="text-gray-600">경기 종목별 실력 랭킹을 확인하세요</p>
        </div>

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
                    onClick={() => setMatchType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      matchType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'ALL' ? '전체' : MATCH_TYPE_LABELS[type as MatchType]}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 지역</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="인천">인천</option>
                <option value="부산">부산</option>
                <option value="대구">대구</option>
                <option value="대전">대전</option>
                <option value="광주">광주</option>
                <option value="울산">울산</option>
                <option value="세종">세종</option>
                <option value="강원">강원</option>
                <option value="충북">충북</option>
                <option value="충남">충남</option>
                <option value="전북">전북</option>
                <option value="전남">전남</option>
                <option value="경북">경북</option>
                <option value="경남">경남</option>
                <option value="제주">제주</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">랭킹을 불러오는 중...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>랭킹 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순위
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      플레이어
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      티어
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      레이팅
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      경기 수
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      승률
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전적
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((entry) => {
                    const tier = getRatingTier(entry.rating);
                    return (
                      <tr
                        key={entry.userId}
                        onClick={() => router.push(`/matches/history/${entry.userId}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {entry.rank <= 3 ? (
                              <span className="text-2xl">
                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="text-lg font-semibold text-gray-700">
                                {entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                              {entry.profileImage ? (
                                <img
                                  src={entry.profileImage}
                                  alt={entry.nickname}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                  {entry.nickname?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {entry.nickname || entry.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {entry.region || '지역 미설정'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{tier.icon}</span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: tier.color }}
                            >
                              {tier.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {entry.rating}
                          </div>
                          <div className="text-xs text-gray-500">
                            최고: {entry.peakRating}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {entry.gamesPlayed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.winRate}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                          {entry.wins}승 {entry.losses}패
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">레이팅 시스템 안내</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 각 경기 종목별로 독립적인 레이팅이 관리됩니다</li>
            <li>• 단식(MS, WS)은 1:1 대결, 복식(MD, WD, XD)은 팀 평균 레이팅으로 계산됩니다</li>
            <li>• 매치 세션 참가 시 입장료(포인트/깃털)가 차감됩니다</li>
            <li>• 승리한 팀/선수는 레이팅 상승과 포인트 보상을 받습니다</li>
            <li>• 세션이 취소되면 입장료가 환불됩니다</li>
            <li>• 초기 레이팅은 1500점이며, ELO 시스템을 기반으로 변동됩니다</li>
          </ul>
        </div>
      </div>

      <FloatingActionButton />
    </div>
  );
}
