"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";

interface OtherUser {
  id: string;
  name: string;
  nickname: string;
  profileImage?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  sender?: OtherUser;
  receiver?: OtherUser;
}

interface Conversation {
  otherUser: OtherUser;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/messages?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to load conversations');

      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("대화 목록 로딩 실패:", error);
    }
  }, []);

  const loadMessages = useCallback(async (userId: string, otherUserId: string) => {
    try {
      const response = await fetch(`/api/messages?userId=${userId}&otherUserId=${otherUserId}`);
      if (!response.ok) throw new Error('Failed to load messages');

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("메시지 로딩 실패:", error);
    }
  }, []);

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
      } else {
        setUser(session.user);
        loadConversations(session.user.id);

        // URL 파라미터에서 userId 확인
        const searchParams = new URLSearchParams(window.location.search);
        const userIdParam = searchParams.get('userId');
        if (userIdParam) {
          setSelectedUserId(userIdParam);
        }
      }
      setLoading(false);
    };

    initUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, loadConversations]);

  useEffect(() => {
    if (user && selectedUserId) {
      loadMessages(user.id, selectedUserId);
      // 5초마다 메시지 새로고침
      const interval = setInterval(() => {
        loadMessages(user.id, selectedUserId);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, selectedUserId, loadMessages]);

  const handleSendMessage = async () => {
    if (!user || !selectedUserId || !messageText.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedUserId,
          content: messageText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setMessageText("");
      loadMessages(user.id, selectedUserId);
      loadConversations(user.id);
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert(error instanceof Error ? error.message : "메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedConv = conversations.find((c) => c.otherUser.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-center">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            💬 메시지
          </span>
        </h1>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* 대화 목록 */}
            <div className="border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="검색..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.otherUser.id}
                      onClick={() => setSelectedUserId(conv.otherUser.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition border-b border-gray-200 ${
                        selectedUserId === conv.otherUser.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {conv.otherUser.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold">{conv.otherUser.name}</p>
                            <p className="text-sm text-gray-600">{conv.otherUser.nickname}</p>
                          </div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.lastMessage.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>메시지가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 대화 내용 */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConv ? (
                <>
                  {/* 대화 상대 헤더 */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {selectedConv.otherUser.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedConv.otherUser.name}</p>
                        <p className="text-sm text-gray-600">{selectedConv.otherUser.nickname}</p>
                      </div>
                    </div>
                  </div>

                  {/* 메시지 영역 */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.length > 0 ? (
                        messages.map((message) => {
                          const isMine = message.senderId === user.id;
                          return (
                            <div key={message.id} className={`flex ${isMine ? 'justify-end' : ''}`}>
                              <div className={`rounded-2xl px-4 py-3 max-w-xs shadow-md ${
                                isMine
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p>{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  isMine ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <p>메시지가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 메시지 입력 */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !sending) {
                            handleSendMessage();
                          }
                        }}
                        disabled={sending}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || !messageText.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {sending ? "전송 중..." : "전송"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-4xl mb-4">💬</p>
                    <p>대화를 선택하세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
