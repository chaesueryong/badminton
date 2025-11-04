"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Author {
  id: string;
  name: string;
  nickname: string;
  level?: string;
  profileImage?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author | null;
  replies?: Comment[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  createdAt: string;
  author: Author | null;
  comments: Comment[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // 현재 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 게시글 상세 정보 가져오기
        const response = await fetch(`/api/posts/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch post');

        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error("게시글 정보 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!commentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentContent,
          authorId: currentUser.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit comment');

      // 댓글 작성 성공 후 게시글 새로고침
      const postResponse = await fetch(`/api/posts/${params.id}`);
      const data = await postResponse.json();
      setPost(data);

      setCommentContent("");
      alert("댓글이 등록되었습니다!");
    } catch (error) {
      console.error("댓글 등록 실패:", error);
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!replyContent.trim()) {
      alert("답글 내용을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/posts/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          authorId: currentUser.id,
          parentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit reply');

      // 답글 작성 성공 후 게시글 새로고침
      const postResponse = await fetch(`/api/posts/${params.id}`);
      const data = await postResponse.json();
      setPost(data);

      setReplyContent("");
      setReplyingTo(null);
      alert("답글이 등록되었습니다!");
    } catch (error) {
      console.error("답글 등록 실패:", error);
      alert("답글 등록에 실패했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error('Failed to delete post');

      alert("게시글이 삭제되었습니다.");
      router.push("/community");
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      // 댓글 삭제 성공 후 게시글 새로고침
      const postResponse = await fetch(`/api/posts/${params.id}`);
      const data = await postResponse.json();
      setPost(data);

      alert("댓글이 삭제되었습니다.");
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
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

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">게시글을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push("/community")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 뒤로 가기 */}
        <button
          onClick={() => router.push("/community")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>

        {/* 게시글 내용 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b">
            <div className="flex justify-between items-start mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {post.category}
              </span>
              {currentUser && post.author && currentUser.id === post.author.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/community/${post.id}/edit`)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                    {post.author?.name?.[0] || '?'}
                  </div>
                  <span>{post.author?.name || '익명'}</span>
                </div>
                <span>{new Date(post.createdAt).toLocaleString('ko-KR')}</span>
              </div>
              <span>조회 {post.views}</span>
            </div>
          </div>

          <div className="p-6">
            <div className="prose max-w-none" style={{ whiteSpace: 'pre-wrap' }}>
              {post.content}
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">
            댓글 {post.comments.length}
          </h2>

          {/* 댓글 작성 폼 */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2"
              rows={3}
              placeholder="댓글을 입력하세요..."
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? "등록 중..." : "댓글 등록"}
              </button>
            </div>
          </form>

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                        {comment.author?.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{comment.author?.name || '익명'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        답글
                      </button>
                      {currentUser && comment.author && currentUser.id === comment.author.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 ml-10">{comment.content}</p>

                  {/* 답글 작성 폼 */}
                  {replyingTo === comment.id && (
                    <div className="ml-10 mt-3">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
                        rows={2}
                        placeholder="답글을 입력하세요..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          답글 등록
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 답글 목록 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-10 mt-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="border-l-2 border-gray-200 pl-4">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                                <span className="text-xs">{reply.author?.name?.[0] || '?'}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-xs">{reply.author?.name || '익명'}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleString('ko-KR')}
                                </p>
                              </div>
                            </div>
                            {currentUser && reply.author && currentUser.id === reply.author.id && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 ml-8">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
