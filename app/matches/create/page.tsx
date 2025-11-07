'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchType, MATCH_TYPE_LABELS, MATCH_TYPE_DESCRIPTIONS } from '@/types/rating';
import { Feather } from 'lucide-react';

interface User {
  id: string;
  name: string;
  nickname: string;
  profileImage: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  points: number;
  feathers: number;
}

export default function CreateMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [matchType, setMatchType] = useState<MatchType>('MS');

  // Session creation cost (creator pays to create session)
  const [creationCurrency, setCreationCurrency] = useState<'points' | 'feathers'>('feathers');
  const creationCostPoints = 100; // Creation cost in points
  const creationCostFeathers = 10; // Creation cost in feathers (feathers are much more valuable)

  // Entry fee (fixed, different values for points and feathers)
  const entryFeePoints = 100; // Entry fee in points
  const entryFeeFeathers = 10; // Entry fee in feathers (feathers are much more valuable)

  // Betting state
  const [enableBetting, setEnableBetting] = useState(false);
  const [betCurrencyType, setBetCurrencyType] = useState<'points' | 'feathers'>('points');
  const [betAmount, setBetAmount] = useState(100);

  // Fixed values
  const winnerPoints = 100;
  const maxPlayersPerTeam = matchType === 'MS' || matchType === 'WS' ? 1 : 2;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/matches/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchType,
          creationCostPoints: creationCurrency === 'points' ? creationCostPoints : 0,
          creationCostFeathers: creationCurrency === 'feathers' ? creationCostFeathers : 0,
          entryFeePoints: entryFeePoints,
          entryFeeFeathers: entryFeeFeathers,
          winnerPoints: 100,
          betCurrencyType: enableBetting ? betCurrencyType.toUpperCase() : 'NONE',
          betAmountPerPlayer: enableBetting ? betAmount : 0
        })
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '매치 세션 생성 실패');
      }

      const session = await response.json();
      alert('매치 세션이 생성되었습니다!');
      router.push(`/matches/${session.id}`);
    } catch (error: any) {
      console.error('Failed to create match session:', error);
      alert(error.message || '매치 세션 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">매치 세션 생성</h1>
          <p className="text-gray-600">새로운 레이팅 매치를 생성하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Type */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              경기 종목 *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(MATCH_TYPE_LABELS) as MatchType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMatchType(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    matchType === type
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {MATCH_TYPE_LABELS[type]}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {MATCH_TYPE_DESCRIPTIONS[type]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Creation Cost */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              세션 생성 비용
            </label>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="points"
                    checked={creationCurrency === 'points'}
                    onChange={(e) => setCreationCurrency(e.target.value as 'points')}
                    className="mr-2"
                  />
                  <span className="text-sm">💎 포인트 ({creationCostPoints})</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="feathers"
                    checked={creationCurrency === 'feathers'}
                    onChange={(e) => setCreationCurrency(e.target.value as 'feathers')}
                    className="mr-2"
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Feather className="w-4 h-4" />
                    깃털 ({creationCostFeathers})
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-600">
                세션 생성 시 생성자가 지불합니다.
              </p>
            </div>
          </div>

          {/* Entry Fee Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              입장료
            </label>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💎 포인트:</strong> {entryFeePoints}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800 flex items-center gap-1">
                  <Feather className="w-4 h-4" />
                  <strong>깃털:</strong> {entryFeeFeathers}
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                참가자가 세션 참가 시 포인트 또는 깃털 중 선택하여 지불합니다.
              </p>
            </div>
          </div>

          {/* Betting System */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  🎲 내기 모드 (승자 독식)
                </label>
                <p className="text-xs text-gray-600">
                  각 플레이어가 동일 금액을 베팅하고, 승자 팀이 모든 베팅금을 나눠가집니다
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBetting}
                  onChange={(e) => setEnableBetting(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>

            {enableBetting && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    베팅 화폐 선택
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="points"
                        checked={betCurrencyType === 'points'}
                        onChange={(e) => setBetCurrencyType(e.target.value as 'points')}
                        className="mr-2"
                      />
                      <span className="text-sm">💎 포인트</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="feathers"
                        checked={betCurrencyType === 'feathers'}
                        onChange={(e) => setBetCurrencyType(e.target.value as 'feathers')}
                        className="mr-2"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Feather className="w-4 h-4" />
                        깃털
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    플레이어당 베팅 금액
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                    min="0"
                    step="10"
                    className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="베팅 금액"
                  />
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-800 flex items-center gap-1">
                      <strong>총 베팅 풀:</strong> {betAmount * maxPlayersPerTeam * 2}
                      {betCurrencyType === 'feathers' && <Feather className="w-3 h-3 inline" />}
                      {betCurrencyType === 'points' ? ' 포인트' : ' 깃털'}
                    </p>
                    <p className="text-xs text-yellow-800 mt-1 flex items-center gap-1">
                      <strong>승자 1인당 획득:</strong> {Math.floor(betAmount * maxPlayersPerTeam * 2 / maxPlayersPerTeam)}
                      {betCurrencyType === 'feathers' && <Feather className="w-3 h-3 inline" />}
                      {betCurrencyType === 'points' ? ' 포인트' : ' 깃털'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '매치 세션 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
