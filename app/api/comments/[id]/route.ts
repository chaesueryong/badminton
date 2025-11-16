import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// PATCH /api/comments/:id - 댓글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "내용을 입력해주세요" },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', params.id)
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
      console.error("댓글 수정 실패:", error);
      return NextResponse.json(
        { error: "댓글 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...comment,
      postId: comment.post_id,
      authorId: comment.author_id,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
      author: comment.author ? {
        ...comment.author,
        profileImage: comment.author.profile_image,
      } : null,
    });
  } catch (error) {
    console.error("댓글 수정 실패:", error);
    return NextResponse.json(
      { error: "댓글 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/:id - 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error("댓글 삭제 실패:", error);
      return NextResponse.json(
        { error: "댓글 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("댓글 삭제 실패:", error);
    return NextResponse.json(
      { error: "댓글 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
