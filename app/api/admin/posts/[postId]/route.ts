import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth, logAdminAction, createNotification } from '@/lib/adminAuth';

// PATCH /api/admin/posts/[postId] - 게시글 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createClient();
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { postId } = params;
    const { status } = await request.json();

    const { data, error } = await supabase
      .from('Post')
      .update({ status })
      .eq('id', postId)
      .select('*, author:users!authorId(id)')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    await logAdminAction({
      adminId: user.id,
      action: status === 'hidden' ? 'hide_post' : 'update_post_status',
      targetType: 'post',
      targetId: postId,
      details: { status },
    });

    if (status === 'hidden' && data.author) {
      await createNotification({
        userId: data.author.id,
        type: 'post_removed',
        title: '게시글이 숨김 처리되었습니다',
        message: '귀하의 게시글이 관리자에 의해 숨김 처리되었습니다.',
        link: `/posts/${postId}`,
      });
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/posts/[postId] - 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = await createClient();
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { postId } = params;

    const { error } = await supabase
      .from('Post')
      .delete()
      .eq('id', postId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    await logAdminAction({
      adminId: user.id,
      action: 'delete_post',
      targetType: 'post',
      targetId: postId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
