import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/clubs/[id]/members - 클럽 멤버 목록 조회
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: members, error } = await supabase
      .from('club_members')
      .select(`
        id,
        role,
        joined_at,
        user:users (
          id,
          name,
          email,
          nickname,
          profile_image
        )
      `)
      .eq('club_id', params.id)
      .order('joined_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/clubs/[id]/members - 클럽에 멤버 추가
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, role = 'member' } = body

    // 요청자가 소유자 또는 매니저인지 확인
    const { data: requesterMember } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (!requesterMember || !['owner', 'manager'].includes(requesterMember.role)) {
      return NextResponse.json(
        { error: 'Only owners and managers can add members' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('club_members')
      .insert({
        club_id: params.id,
        user_id,
        role
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ member: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
