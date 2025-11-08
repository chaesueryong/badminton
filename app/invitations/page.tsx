'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FloatingActionButton from '@/components/FloatingActionButton';
import { MATCH_TYPE_LABELS, MatchType } from '@/types/rating';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  match_session_id: string;
  team: 1 | 2;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  message: string | null;
  created_at: string;
  expires_at: string;
  inviter: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
  };
  invitee: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
  };
  session: {
    id: string;
    match_type: MatchType;
    entry_fee_points: number;
    entry_fee_feathers: number;
    winner_points: number;
    location: string | null;
    status: string;
  };
}

export default function InvitationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [activeTab]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations?type=${activeTab}&status=PENDING`);
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      setProcessing(invitationId);
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '초대 응답 실패');
      }

      toast.success(action === 'accept' ? '초대를 수락했습니다!' : '초대를 거절했습니다.');
      fetchInvitations();
    } catch (error: any) {
      console.error('Failed to respond to invitation:', error);
      toast.error(error.message || '초대 응답에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    if (!confirm('초대를 취소하시겠습니까?')) return;

    try {
      setProcessing(invitationId);
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '초대 취소 실패');
      }

      toast.success('초대가 취소되었습니다.');
      fetchInvitations();
    } catch (error: any) {
      console.error('Failed to cancel invitation:', error);
      toast.error(error.message || '초대 취소에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff < 0) return '만료됨';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    }
    return `${minutes}분 남음`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">매치 초대</h1>
          <p className="text-gray-600">받은 초대를 확인하고 응답하세요</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              받은 초대
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              보낸 초대
            </button>
          </div>
        </div>

        {/* Invitations List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">초대 목록을 불러오는 중...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <p>
              {activeTab === 'received'
                ? '받은 초대가 없습니다.'
                : '보낸 초대가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const expired = isExpired(invitation.expires_at);
              const otherUser =
                activeTab === 'received' ? invitation.inviter : invitation.invitee;

              return (
                <div
                  key={invitation.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* User Avatar */}
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {otherUser.profileImage ? (
                          <img
                            src={otherUser.profileImage}
                            alt={otherUser.nickname}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            {otherUser.nickname?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Invitation Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {otherUser.nickname || otherUser.name}
                          </h3>
                          {activeTab === 'received' ? (
                            <span className="text-sm text-gray-500">님이 초대했습니다</span>
                          ) : (
                            <span className="text-sm text-gray-500">에게 초대를 보냈습니다</span>
                          )}
                        </div>

                        {/* Match Info */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">
                              {MATCH_TYPE_LABELS[invitation.session.match_type]}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>
                              팀 {invitation.team}
                            </span>
                            {invitation.session.location && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span>{invitation.session.location}</span>
                              </>
                            )}
                          </div>

                          {/* Entry Fee */}
                          {(invitation.session.entry_fee_points > 0 ||
                            invitation.session.entry_fee_feathers > 0) && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">입장료:</span>
                              {invitation.session.entry_fee_points > 0 && (
                                <span className="text-blue-600 font-medium">
                                  {invitation.session.entry_fee_points} 포인트
                                </span>
                              )}
                              {invitation.session.entry_fee_feathers > 0 && (
                                <span className="text-purple-600 font-medium">
                                  {invitation.session.entry_fee_feathers} 깃털
                                </span>
                              )}
                            </div>
                          )}

                          {/* Winner Points */}
                          {invitation.session.winner_points > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">승자 보상:</span>
                              <span className="text-green-600 font-medium">
                                {invitation.session.winner_points} 포인트
                              </span>
                            </div>
                          )}

                          {/* Message */}
                          {invitation.message && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{invitation.message}</p>
                            </div>
                          )}

                          {/* Time Remaining */}
                          <div className="mt-2">
                            <span
                              className={`text-xs font-medium ${
                                expired ? 'text-red-600' : 'text-gray-500'
                              }`}
                            >
                              {formatTimeRemaining(invitation.expires_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {activeTab === 'received' ? (
                        <>
                          <button
                            onClick={() => handleRespond(invitation.id, 'accept')}
                            disabled={expired || processing === invitation.id}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === invitation.id ? '처리 중...' : '수락'}
                          </button>
                          <button
                            onClick={() => handleRespond(invitation.id, 'decline')}
                            disabled={expired || processing === invitation.id}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            거절
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCancel(invitation.id)}
                            disabled={expired || processing === invitation.id}
                            className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === invitation.id ? '처리 중...' : '취소'}
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/matches/${invitation.match_session_id}`)
                            }
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            매치 보기
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">초대 시스템 안내</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 초대는 24시간 후 자동으로 만료됩니다</li>
            <li>• 초대를 수락하면 자동으로 매치에 참가됩니다</li>
            <li>• 입장료는 초대 수락 후 별도로 지불해야 합니다</li>
            <li>• 매치 시작 전까지는 참가를 취소할 수 있습니다</li>
          </ul>
        </div>
      </div>

      <FloatingActionButton />
    </div>
  );
}
