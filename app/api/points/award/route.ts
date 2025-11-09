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
    const { actionType, sourceId, description } = body as {
      actionType: string;
      sourceId?: string;
      description?: string;
    };

    if (!actionType) {
      return NextResponse.json({ error: 'Action type required' }, { status: 400 });
    }

    // Call the award_points function
    const { data, error } = await (supabase as any).rpc('award_points', {
      p_user_id: user.id,
      p_action_type: actionType,
      p_source_id: sourceId || null,
      p_description: description || null,
    });

    if (error) {
      console.error('Error awarding points:', error);
      return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
    }

    const pointsAwarded = data as number;

    if (pointsAwarded === 0) {
      return NextResponse.json({
        success: true,
        pointsAwarded: 0,
        message: 'No points awarded (limit reached or action disabled)',
      });
    }

    return NextResponse.json({
      success: true,
      pointsAwarded,
      message: `${pointsAwarded} points awarded!`,
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
