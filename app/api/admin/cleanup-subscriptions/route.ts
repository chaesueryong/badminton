import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/cleanup-subscriptions
 * Manually trigger cleanup of expired subscriptions
 * This endpoint can be called manually or by a cron job
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (optional: add admin check)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the database function to cleanup expired subscriptions
    const { data, error } = await supabase.rpc('cleanup_expired_subscriptions');

    if (error) {
      console.error('Error cleaning up subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to cleanup subscriptions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cleanup completed',
      result: data,
    });
  } catch (error) {
    console.error('Error in cleanup-subscriptions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup-subscriptions
 * Get information about expired subscriptions without cleaning them up
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get expired premium memberships count
    const { count: expiredPremiumCount } = await supabase
      .from('premium_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lt('end_date', new Date().toISOString());

    // Get expired VIP memberships count
    const { count: expiredVipCount } = await supabase
      .from('vip_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lt('end_date', new Date().toISOString());

    return NextResponse.json({
      success: true,
      expiredPremiumCount: expiredPremiumCount || 0,
      expiredVipCount: expiredVipCount || 0,
      message: 'Use POST method to cleanup these expired subscriptions',
    });
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
