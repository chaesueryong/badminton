import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'

// PATCH /api/clubs/[id]/members/[memberId] - 멤버 역할 변경 (매니저 임명/해임)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = body

    if (!['owner', 'manager', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 요청자가 소유자인지 확인 (소유자만 역할 변경 가능)
    const { data: requesterMember } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (!requesterMember || requesterMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only club owners can change member roles' },
        { status: 403 }
      )
    }

    // 소유자 역할은 변경할 수 없음
    if (role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot assign owner role' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('club_members')
      .update({ role })
      .eq('id', params.memberId)
      .eq('club_id', params.id)
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

// DELETE /api/clubs/[id]/members/[memberId] - 멤버 제거
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청자가 소유자 또는 매니저인지 확인
    const { data: requesterMember } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (!requesterMember || !['owner', 'manager'].includes(requesterMember.role)) {
      return NextResponse.json(
        { error: 'Only owners and managers can remove members' },
        { status: 403 }
      )
    }

    // 제거하려는 멤버 정보 확인
    const { data: targetMember } = await supabase
      .from('club_members')
      .select('role')
      .eq('id', params.memberId)
      .single()

    // 소유자는 제거할 수 없음
    if (targetMember?.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove club owner' },
        { status: 400 }
      )
    }

    // 매니저는 다른 매니저를 제거할 수 없음 (소유자만 가능)
    if (targetMember?.role === 'manager' && requesterMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can remove managers' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('id', params.memberId)
      .eq('club_id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
