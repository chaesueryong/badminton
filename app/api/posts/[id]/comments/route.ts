import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/posts/:id/comments - 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, authorId, parentId } = await request.json();

    if (!content || !authorId) {
      return NextResponse.json(
        { error: "내용과 작성자 정보는 필수입니다" },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        content,
        post_id: params.id,
        author_id: authorId,
        parent_id: parentId,
      })
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          nickname,
          profile_image
        )
      `)
      .single();

    if (error || !comment) {
      console.error("댓글 작성 실패:", error);
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다" },
        { status: 500 }
      );
    }

    // camelCase로 변환
    const formattedComment = {
      ...comment,
      postId: comment.post_id,
      authorId: comment.author_id,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
      author: comment.author ? {
        ...comment.author,
        profileImage: comment.author.profile_image,
      } : null,
    };

    return NextResponse.json(formattedComment, { status: 201 });
  } catch (error) {
    console.error("댓글 작성 실패:", error);
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다" },
      { status: 500 }
    );
  }
}
