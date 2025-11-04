import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/posts/:id - 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 게시글과 작성자 정보 조회
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          nickname,
          level,
          profile_image
        )
      `)
      .eq('id', params.id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 최상위 댓글과 작성자 정보 조회
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          nickname,
          profile_image
        )
      `)
      .eq('post_id', params.id)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    // 답글과 작성자 정보 조회 (parent_id가 있는 댓글들)
    const { data: replies } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          nickname,
          profile_image
        )
      `)
      .eq('post_id', params.id)
      .not('parent_id', 'is', null);

    // 답글을 부모 댓글에 매핑
    const commentsWithReplies = comments?.map(comment => ({
      ...comment,
      authorId: comment.author_id,
      postId: comment.post_id,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
      author: comment.author ? {
        ...comment.author,
        profileImage: comment.author.profile_image,
      } : null,
      replies: replies?.filter(reply => reply.parent_id === comment.id).map(reply => ({
        ...reply,
        authorId: reply.author_id,
        postId: reply.post_id,
        parentId: reply.parent_id,
        createdAt: reply.created_at,
        author: reply.author ? {
          ...reply.author,
          profileImage: reply.author.profile_image,
        } : null,
      })) || [],
    })) || [];

    // 조회수 증가
    await supabaseAdmin.rpc('increment_post_views', { post_id: params.id });

    return NextResponse.json({
      ...post,
      authorId: post.author_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.author ? {
        ...post.author,
        profileImage: post.author.profile_image,
      } : null,
      comments: commentsWithReplies,
    });
  } catch (error) {
    console.error("게시글 상세 조회 실패:", error);
    return NextResponse.json(
      { error: "게시글 상세 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/:id - 게시글 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // camelCase를 snake_case로 변환
    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.content) updateData.content = body.content;
    if (body.category) updateData.category = body.category;
    if (body.images) updateData.images = body.images;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          nickname
        )
      `)
      .single();

    if (error || !post) {
      console.error("게시글 수정 실패:", error);
      return NextResponse.json(
        { error: "게시글 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...post,
      authorId: post.author_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      author: post.author,
    });
  } catch (error) {
    console.error("게시글 수정 실패:", error);
    return NextResponse.json(
      { error: "게시글 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/:id - 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error("게시글 삭제 실패:", error);
      return NextResponse.json(
        { error: "게시글 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("게시글 삭제 실패:", error);
    return NextResponse.json(
      { error: "게시글 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
