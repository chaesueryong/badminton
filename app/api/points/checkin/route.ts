import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];

    const { data: existingCheckin } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .single();

    if (existingCheckin) {
      return NextResponse.json({
        success: false,
        message: 'Already checked in today',
        checkin: existingCheckin,
      });
    }

    // Get yesterday's checkin to calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const { data: yesterdayCheckin } = await supabase
      .from('daily_checkins')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .eq('checkin_date', yesterdayDate)
      .single();

    let currentStreak = 1;
    let longestStreak = 1;

    if (yesterdayCheckin) {
      // Continue streak
      currentStreak = yesterdayCheckin.current_streak + 1;
      longestStreak = Math.max(currentStreak, yesterdayCheckin.longest_streak);
    } else {
      // Check if there's any previous checkin to get longest_streak
      const { data: previousCheckin } = await supabase
        .from('daily_checkins')
        .select('longest_streak')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(1)
        .single();

      if (previousCheckin) {
        longestStreak = previousCheckin.longest_streak;
      }
    }

    // Create checkin record
    const { data: checkin, error } = await supabase
      .from('daily_checkins')
      .insert({
        user_id: user.id,
        checkin_date: today,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating checkin:', error);
      return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
    }

    // Award points for daily checkin
    await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_action_type: 'daily_checkin',
      p_source_id: checkin.id,
    });

    // Check for streak milestones and award bonus points
    if (currentStreak === 7) {
      await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_action_type: 'streak_7_days',
        p_source_id: checkin.id,
      });
    } else if (currentStreak === 30) {
      await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_action_type: 'streak_30_days',
        p_source_id: checkin.id,
      });
    }

    return NextResponse.json({
      success: true,
      checkin,
      currentStreak,
      longestStreak,
      message: `Check-in successful! Current streak: ${currentStreak} days`,
    });
  } catch (error) {
    console.error('Error processing checkin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get latest checkin
    const { data: checkin, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('checkin_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is okay
      console.error('Error fetching checkin:', error);
      return NextResponse.json({ error: 'Failed to fetch checkin' }, { status: 500 });
    }

    // Check if checked in today
    const today = new Date().toISOString().split('T')[0];
    const checkedInToday = checkin?.checkin_date === today;

    return NextResponse.json({
      checkedInToday,
      currentStreak: checkin?.current_streak || 0,
      longestStreak: checkin?.longest_streak || 0,
      lastCheckin: checkin?.checkin_date || null,
    });
  } catch (error) {
    console.error('Error fetching checkin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
