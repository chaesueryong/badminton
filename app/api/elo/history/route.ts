import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Users can only view their own history unless they're admin
    if (userId !== user.id) {
      const { data: userData } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Fetch ELO history
    const { data: history, error } = await supabase
      .from('elo_history')
      .select(
        `
        *,
        match_result:match_results(
          id,
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          result,
          match_date,
          match_type
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching ELO history:', error);
      return NextResponse.json({ error: 'Failed to fetch ELO history' }, { status: 500 });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching ELO history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
