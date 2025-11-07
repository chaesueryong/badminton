import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/subscription/status
 * Get current user's subscription status for both Premium and VIP
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Get active Premium membership
    const { data: premiumMembership, error: premiumError } = await supabase
      .from('premium_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('end_date', now)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (premiumError && premiumError.code !== 'PGRST116') {
      console.error('Error fetching premium membership:', premiumError);
    }

    // Get active VIP membership
    const { data: vipMembership, error: vipError } = await supabase
      .from('vip_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('end_date', now)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (vipError && vipError.code !== 'PGRST116') {
      console.error('Error fetching VIP membership:', vipError);
    }

    // Calculate days remaining
    const calculateDaysRemaining = (endDate: string): number => {
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    };

    // Prepare response
    const response = {
      premium: {
        active: !!premiumMembership,
        membership: premiumMembership
          ? {
              id: premiumMembership.id,
              startDate: premiumMembership.start_date,
              endDate: premiumMembership.end_date,
              daysRemaining: calculateDaysRemaining(premiumMembership.end_date),
              purchasedWith: premiumMembership.purchased_with,
              amountPaid: premiumMembership.amount_paid,
            }
          : null,
      },
      vip: {
        active: !!vipMembership,
        membership: vipMembership
          ? {
              id: vipMembership.id,
              startDate: vipMembership.start_date,
              endDate: vipMembership.end_date,
              daysRemaining: calculateDaysRemaining(vipMembership.end_date),
              planType: vipMembership.plan_type,
              pricePaid: vipMembership.price_paid,
              currency: vipMembership.currency,
              autoRenew: vipMembership.auto_renew,
            }
          : null,
      },
      hasAnyActiveSubscription: !!premiumMembership || !!vipMembership,
      // Legacy compatibility
      isPremium: !!premiumMembership,
      subscription: premiumMembership || vipMembership || null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
