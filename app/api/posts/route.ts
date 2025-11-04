import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/posts - 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:users!authorId (
          id,
          name,
          nickname,
          level,
          profileImage
        )
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // 필터 적용
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: posts, error, count: total } = await query;

    if (error) {
      console.error("게시글 목록 조회 실패:", error);
      return NextResponse.json(
        { error: "게시글 목록 조회에 실패했습니다" },
        { status: 500 }
      );
    }

    // 각 게시글의 댓글 수 조회
    const postsWithCount = await Promise.all(
      (posts || []).map(async (post) => {
        const { count } = await supabaseAdmin
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('postId', post.id);

        return {
          ...post,
          commentCount: count || 0,
        };
      })
    );

    return NextResponse.json({
      posts: postsWithCount,
      pagination: {
        total: total || 0,
        page,
        limit,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("게시글 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "게시글 목록 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/posts - 게시글 작성
export async function POST(request: NextRequest) {
  try {
    // 세션에서 사용자 확인
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { title, content, category, images } = await request.json();

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "필수 필드를 모두 입력해주세요" },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        title,
        content,
        category,
        authorId: session.user.id,
        images: images || [],
      })
      .select(`
        *,
        author:users!authorId (
          id,
          name,
          nickname,
          level,
          profileImage
        )
      `)
      .single();

    if (error || !post) {
      console.error("게시글 작성 실패:", error);
      return NextResponse.json(
        { error: "게시글 작성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("게시글 작성 실패:", error);
    return NextResponse.json(
      { error: "게시글 작성에 실패했습니다" },
      { status: 500 }
    );
  }
}
