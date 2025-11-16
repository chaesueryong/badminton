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

    const body = await request.json();
    const { achievementId } = body;

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID required' }, { status: 400 });
    }

    // Get user achievement
    const { data: userAchievement, error: fetchError } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (fetchError || !userAchievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Check if already claimed
    if ((userAchievement as any).status === 'claimed') {
      return NextResponse.json({ error: 'Achievement already claimed' }, { status: 400 });
    }

    // Check if completed
    if ((userAchievement as any).status !== 'completed') {
      return NextResponse.json({ error: 'Achievement not yet completed' }, { status: 400 });
    }

    // Mark as claimed
    const { error: updateError } = await supabase
      .from('user_achievements')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId);

    if (updateError) {
      console.error('Error claiming achievement:', updateError);
      return NextResponse.json({ error: 'Failed to claim achievement' }, { status: 500 });
    }

    // Award points (already awarded on completion, but you can add bonus here)
    // Award badge if linked
    if ((userAchievement as any).achievement.badge_id) {
      await supabase.rpc('award_badge', {
        p_user_id: user.id,
        p_badge_id: (userAchievement as any).achievement.badge_id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Achievement claimed!',
      pointsAwarded: (userAchievement as any).achievement.points_reward,
    });
  } catch (error) {
    console.error('Error claiming achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
