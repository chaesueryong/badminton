"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// 임시 데이터
const mockPosts = [
  {
    id: "1",
    title: "초보자를 위한 배드민턴 기초 강습",
    content: "주말마다 강남에서 초보자 분들을 위한 무료 강습을 진행합니다!",
    category: "FREE",
    author: { name: "김코치", nickname: "배드킹" },
    views: 124,
    likes: 15,
    commentCount: 8,
    createdAt: "2025-10-28",
  },
  {
    id: "2",
    title: "[공지] 11월 배드민턴 대회 일정 안내",
    content: "11월 중순에 커뮤니티 배드민턴 대회가 열립니다.",
    category: "NOTICE",
    author: { name: "관리자", nickname: "admin" },
    views: 458,
    likes: 45,
    commentCount: 23,
    createdAt: "2025-10-27",
  },
  {
    id: "3",
    title: "요넥스 라켓 중고 판매합니다",
    content: "작년에 산 요넥스 나노플레어 800 판매해요. 상태 좋습니다.",
    category: "MARKET",
    author: { name: "이민수", nickname: "배민수" },
    views: 89,
    likes: 5,
    commentCount: 12,
    createdAt: "2025-10-26",
  },
  {
    id: "4",
    title: "배드민턴 동호회 가입 후기",
    content: "강남 배드민턴 동호회에 가입했는데 분위기가 정말 좋아요!",
    category: "REVIEW",
    author: { name: "박지혜", nickname: "배드킹덤" },
    views: 203,
    likes: 28,
    commentCount: 15,
    createdAt: "2025-10-25",
  },
  {
    id: "5",
    title: "백핸드 스매싱 질문있습니다",
    content: "백핸드로 스매싱할 때 자꾸 네트에 걸려요. 어떻게 해야 할까요?",
    category: "QNA",
    author: { name: "최민준", nickname: "새싹" },
    views: 156,
    likes: 12,
    commentCount: 19,
    createdAt: "2025-10-24",
  },
];

const categoryLabels: Record<string, string> = {
  FREE: "자유",
  NOTICE: "공지",
  REVIEW: "후기",
  QNA: "질문",
  MARKET: "거래",
  LESSON: "레슨",
  TOURNAMENT: "대회",
};

const categoryColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-800",
  NOTICE: "bg-red-100 text-red-800",
  REVIEW: "bg-green-100 text-green-800",
  QNA: "bg-blue-100 text-blue-800",
  MARKET: "bg-yellow-100 text-yellow-800",
  LESSON: "bg-purple-100 text-purple-800",
  TOURNAMENT: "bg-pink-100 text-pink-800",
};

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  author: { id?: string; name: string; nickname: string };
  views: number;
  likes: number;
  commentCount: number;
  createdAt: string;
}

export default function CommunityPage() {
  const supabase = createClientComponentClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    fetchPosts();
  }, [supabase, page, selectedCategory]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // 페이지네이션
      params.append("page", page.toString());
      params.append("limit", "12");

      // 필터
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.posts) {
          setPosts(data.posts);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setPosts(data);
        }
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('게시글 조회 실패:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">커뮤니티</h1>
            <p className="text-gray-600 mt-2">
              배드민턴 이야기를 나누는 공간
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/community/write"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              글쓰기
            </Link>
          )}
        </div>

        {/* 검색 바 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="제목 또는 내용으로 검색..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              검색
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedCategory("")}
            >
              전체
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedCategory === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className={`block p-6 hover:bg-gray-50 transition ${
                index !== mockPosts.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 제목과 카테고리 */}
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        categoryColors[post.category]
                      }`}
                    >
                      {categoryLabels[post.category]}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {post.title}
                    </h3>
                  </div>

                  {/* 내용 미리보기 */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{post.author.nickname || post.author.name}</span>
                    <span>•</span>
                    <span>{post.createdAt}</span>
                    <span>•</span>
                    <span>조회 {post.views}</span>
                    <span>•</span>
                    <span>댓글 {post.commentCount}</span>
                  </div>
                </div>

                {/* 좋아요 */}
                <div className="ml-4 text-center">
                  <div className="text-red-500 text-xl mb-1">❤️</div>
                  <div className="text-sm font-semibold">{post.likes}</div>
                </div>
              </div>
            </Link>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                이전
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
