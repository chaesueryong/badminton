import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    if (userId) {
      // Get user's badges
      let query = supabase
        .from('user_badges')
        .select(
          `
          *,
          badge:badges(*)
        `
        )
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      const { data: userBadges, error } = await query;

      if (error) {
        console.error('Error fetching user badges:', error);
        return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
      }

      return NextResponse.json({ badges: userBadges });
    } else {
      // Get all available badges
      let query = supabase
        .from('badges')
        .select('*')
        .eq('enabled', true)
        .order('rarity', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data: badges, error } = await query;

      if (error) {
        console.error('Error fetching badges:', error);
        return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
      }

      return NextResponse.json({ badges });
    }
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
