import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
    const { badgeId, isDisplayed } = body;

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID required' }, { status: 400 });
    }

    // Update badge display setting
    const { error } = await supabase
      .from('user_badges')
      .update({ is_displayed: isDisplayed })
      .eq('user_id', user.id)
      .eq('badge_id', badgeId);

    if (error) {
      console.error('Error updating badge display:', error);
      return NextResponse.json({ error: 'Failed to update badge display' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: isDisplayed ? 'Badge displayed on profile' : 'Badge hidden from profile',
    });
  } catch (error) {
    console.error('Error updating badge display:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
