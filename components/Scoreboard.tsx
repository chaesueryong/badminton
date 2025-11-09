'use client';

import { useState, useEffect } from 'react';
import { Trophy, RotateCcw, X, ArrowLeftRight } from 'lucide-react';

interface Team {
  name: string;
  players: string[];
  score: number;
  gamesWon: number;
  color: string;
}

interface ScoreboardProps {
  sessionId: string;
  matchType: 'MS' | 'WS' | 'MD' | 'WD' | 'XD';
  teamA: {
    players: string[];
  };
  teamB: {
    players: string[];
  };
  onGameEnd: (winner: 'A' | 'B', scoreA: number, scoreB: number) => Promise<void>;
  onClose: () => void;
  isCreator: boolean;
}

export default function Scoreboard({ sessionId, matchType, teamA, teamB, onGameEnd, onClose, isCreator }: ScoreboardProps) {
  // Generate a unique key for this match session using sessionId
  const sessionKey = `scoreboard_${sessionId}`;

  // Load saved state from localStorage
  const loadSavedState = () => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(sessionKey);
    return saved ? JSON.parse(saved) : null;
  };

  const savedState = loadSavedState();

  const [teams, setTeams] = useState<{ A: Team; B: Team }>(savedState?.teams || {
    A: {
      name: '팀 A',
      players: teamA.players,
      score: 0,
      gamesWon: 0,
      color: 'bg-blue-600'
    },
    B: {
      name: '팀 B',
      players: teamB.players,
      score: 0,
      gamesWon: 0,
      color: 'bg-red-600'
    }
  });

  const [servingTeam, setServingTeam] = useState<'A' | 'B'>(savedState?.servingTeam || 'A');
  const [matchEnded, setMatchEnded] = useState(false);
  const [swapped, setSwapped] = useState(savedState?.swapped || false);

  const MAX_SCORE = 99; // Max 99 points

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      sessionId,
      matchType,
      teams,
      servingTeam,
      swapped,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(sessionKey, JSON.stringify(state));
  }, [teams, servingTeam, swapped, sessionKey, sessionId, matchType]);

  // Warn before page reload/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!matchEnded && (teams.A.score > 0 || teams.B.score > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [matchEnded, teams.A.score, teams.B.score]);

  const addScore = (team: 'A' | 'B') => {
    if (matchEnded) return;

    setTeams(prev => {
      const newTeams = { ...prev };

      // Don't allow score to go above MAX_SCORE
      if (newTeams[team].score >= MAX_SCORE) {
        return prev;
      }

      newTeams[team] = { ...newTeams[team], score: newTeams[team].score + 1 };

      // Change serve
      setServingTeam(team);

      return newTeams;
    });
  };

  const subtractScore = (team: 'A' | 'B') => {
    if (matchEnded) return;

    setTeams(prev => {
      const newTeams = { ...prev };
      if (newTeams[team].score > 0) {
        newTeams[team].score -= 1;
      }
      return newTeams;
    });
  };

  const resetGame = () => {
    if (window.confirm('점수를 초기화하시겠습니까?')) {
      setTeams(prev => ({
        A: { ...prev.A, score: 0, gamesWon: 0 },
        B: { ...prev.B, score: 0, gamesWon: 0 }
      }));
      setServingTeam('A');
      setMatchEnded(false);
    }
  };

  const handleEndGame = async () => {
    const winner = teams.A.score > teams.B.score ? 'A' : 'B';

    // Call parent handler and wait for result
    try {
      await onGameEnd(winner, teams.A.score, teams.B.score);
      // Only set matchEnded and clear localStorage if successful
      setMatchEnded(true);
      localStorage.removeItem(sessionKey);
    } catch (error) {
      // If error occurs, don't set matchEnded
      console.error('Failed to end game:', error);
    }
  };

  const handleSwapSides = () => {
    setSwapped(!swapped);
  };

  // Determine which team to display on left/right based on swap state
  const leftTeam = swapped ? 'B' : 'A';
  const rightTeam = swapped ? 'A' : 'B';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="text-white">
          <p className="text-lg font-semibold">점수판</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSwapSides}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm flex items-center gap-1"
            title="좌우 스위칭"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="hidden sm:inline">스위칭</span>
          </button>
          {isCreator && !matchEnded && (
            <>
              <button
                onClick={resetGame}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">초기화</span>
              </button>
              <button
                onClick={handleEndGame}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors text-sm font-semibold"
              >
                게임 종료
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Match Ended Overlay */}
      {matchEnded && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-4xl font-bold mb-2">게임 종료!</h2>
            <p className="text-2xl mb-4">
              {teams.A.score > teams.B.score ? teams.A.name : teams.B.name} 승리!
            </p>
            <p className="text-3xl font-bold mb-2">
              {teams.A.score} - {teams.B.score}
            </p>
            {isCreator && (
              <button
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                확인
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="flex-1 flex">
        {/* Left Side */}
        <div
          className={`flex-1 ${teams[leftTeam].color} flex flex-col items-center justify-center cursor-pointer ${leftTeam === 'A' ? 'active:bg-blue-700' : 'active:bg-red-700'} transition-colors relative`}
          onClick={() => addScore(leftTeam)}
        >
          {/* Serving indicator */}
          {servingTeam === leftTeam && !matchEnded && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
            </div>
          )}

          <div className="text-center px-4">
            <h3 className="text-white text-xl md:text-2xl font-bold mb-3">{teams[leftTeam].name}</h3>
            <div className="text-white/80 text-sm md:text-base mb-6">
              {teams[leftTeam].players.map((player, idx) => (
                <p key={idx} className="mb-1">{player}</p>
              ))}
            </div>
            <div className="text-white text-6xl md:text-8xl font-bold tabular-nums mt-4">
              {teams[leftTeam].score}
            </div>
          </div>

          {/* Subtract button */}
          {isCreator && !matchEnded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                subtractScore(leftTeam);
              }}
              className="absolute bottom-8 right-8 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
              <span className="text-2xl">-</span>
            </button>
          )}
        </div>

        {/* Center Divider */}
        <div className="w-1 bg-white/20"></div>

        {/* Right Side */}
        <div
          className={`flex-1 ${teams[rightTeam].color} flex flex-col items-center justify-center cursor-pointer ${rightTeam === 'A' ? 'active:bg-blue-700' : 'active:bg-red-700'} transition-colors relative`}
          onClick={() => addScore(rightTeam)}
        >
          {/* Serving indicator */}
          {servingTeam === rightTeam && !matchEnded && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
            </div>
          )}

          <div className="text-center px-4">
            <h3 className="text-white text-xl md:text-2xl font-bold mb-3">{teams[rightTeam].name}</h3>
            <div className="text-white/80 text-sm md:text-base mb-6">
              {teams[rightTeam].players.map((player, idx) => (
                <p key={idx} className="mb-1">{player}</p>
              ))}
            </div>
            <div className="text-white text-6xl md:text-8xl font-bold tabular-nums mt-4">
              {teams[rightTeam].score}
            </div>
          </div>

          {/* Subtract button */}
          {isCreator && !matchEnded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                subtractScore(rightTeam);
              }}
              className="absolute bottom-8 left-8 p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
              <span className="text-2xl">-</span>
            </button>
          )}
        </div>
      </div>

      {/* Game Rules Info */}
      <div className="bg-black/30 backdrop-blur-sm p-3 text-center text-white/60 text-xs">
        <p>화면을 터치하여 점수를 추가하세요 • 최대 {MAX_SCORE}점</p>
      </div>
    </div>
  );
}
