import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/clubs/[id]/join - 클럽 가입
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

    // 이미 가입되어 있는지 확인
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member' },
        { status: 400 }
      )
    }

    // 인원수 제한 확인 (max_members가 null이면 제한 없음)
    const { data: club } = await supabase
      .from('clubs')
      .select('max_members')
      .eq('id', params.id)
      .single()

    if (club?.max_members) {
      const { count } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', params.id)

      if (count && count >= club.max_members) {
        return NextResponse.json(
          { error: 'Club is full' },
          { status: 400 }
        )
      }
    }

    // 멤버로 추가
    const { data, error } = await supabase
      .from('club_members')
      .insert({
        club_id: params.id,
        user_id: session.user.id,
        role: 'member'
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

// DELETE /api/clubs/[id]/join - 클럽 탈퇴
export async function DELETE(
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

    // 멤버 정보 확인
    const { data: member } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    // 모임장은 탈퇴할 수 없음
    if (member?.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner cannot leave the club' },
        { status: 400 }
      )
    }

    // 탈퇴
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
