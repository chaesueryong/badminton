import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
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
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from('user_achievements')
      .select(
        `
        *,
        achievement:achievements(*)
      `
      )
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: userAchievements, error } = await query;

    if (error) {
      console.error('Error fetching achievements:', error);
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }

    // Filter by category if needed
    let filtered = userAchievements;
    if (category) {
      filtered = userAchievements?.filter(
        (ua: any) => ua.achievement?.category === category
      );
    }

    return NextResponse.json({ achievements: filtered });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
