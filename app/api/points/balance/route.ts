import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Users can only view their own balance unless they're admin
    if (userId !== session.user.id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get user points
    const { data: userData, error } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      points: userData.points || 0,
      lifetimePoints: userData.points || 0, // For now, lifetime points = current points
    });
  } catch (error) {
    console.error('Error fetching points balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
