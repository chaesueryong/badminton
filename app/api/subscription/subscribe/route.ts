import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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
    const { planId, billingCycle = 'monthly', isTrial = false, couponCode } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('enabled', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate price based on billing cycle
    let price: number;
    switch (billingCycle) {
      case 'monthly':
        price = plan.price_monthly;
        break;
      case 'quarterly':
        price = plan.price_quarterly || plan.price_monthly * 3;
        break;
      case 'yearly':
        price = plan.price_yearly || plan.price_monthly * 12;
        break;
      default:
        price = plan.price_monthly;
    }

    // Apply coupon if provided
    let discountApplied = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('subscription_coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('enabled', true)
        .single();

      if (coupon) {
        // Check validity
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (now >= validFrom && (!validUntil || now <= validUntil)) {
          // Check redemption limit
          if (
            !coupon.max_redemptions ||
            coupon.current_redemptions < coupon.max_redemptions
          ) {
            // Apply discount
            if (coupon.discount_type === 'percentage') {
              discountApplied = Math.round((price * coupon.discount_value) / 100);
              price -= discountApplied;
            } else if (coupon.discount_type === 'fixed_amount') {
              discountApplied = coupon.discount_value;
              price = Math.max(0, price - discountApplied);
            }
          }
        }
      }
    }

    // Calculate period dates
    const now = new Date();
    let periodEnd = new Date(now);

    switch (billingCycle) {
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'quarterly':
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        break;
      case 'yearly':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
    }

    // Trial period
    let trialEndsAt = null;
    if (isTrial) {
      trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial
    }

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: isTrial ? 'trial' : 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        billing_cycle: billingCycle,
        price_paid: price,
        is_trial: isTrial,
        trial_ends_at: trialEndsAt?.toISOString(),
        next_payment_date: isTrial ? trialEndsAt?.toISOString() : periodEnd.toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Record coupon redemption if used
    if (couponCode && discountApplied > 0) {
      const { data: coupon } = await supabase
        .from('subscription_coupons')
        .select('id')
        .eq('code', couponCode)
        .single();

      if (coupon) {
        await supabase.from('coupon_redemptions').insert({
          coupon_id: coupon.id,
          user_id: user.id,
          subscription_id: subscription.id,
          discount_applied: discountApplied,
        });

        // Update redemption count
        await supabase.rpc('increment', {
          table_name: 'subscription_coupons',
          row_id: coupon.id,
          column_name: 'current_redemptions',
        });
      }
    }

    // Activate subscription
    await supabase.rpc('activate_subscription', {
      p_subscription_id: subscription.id,
    });

    return NextResponse.json({
      success: true,
      subscription,
      message: isTrial
        ? 'Trial started! Enjoy 7 days of premium features.'
        : 'Subscription activated!',
      amountToPay: price,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
