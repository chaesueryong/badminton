import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 });
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards_catalog')
      .select('*')
      .eq('id', rewardId)
      .eq('enabled', true)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    // Check stock
    if (reward.stock !== null && reward.stock <= 0) {
      return NextResponse.json({ error: 'Reward out of stock' }, { status: 400 });
    }

    // Get user's current points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough points
    if (userData.points < reward.points_cost) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      );
    }

    // Spend points using the function
    const { data: spendResult, error: spendError } = await supabase.rpc('spend_points', {
      p_user_id: user.id,
      p_amount: reward.points_cost,
      p_source_type: 'reward_redemption',
      p_source_id: rewardId,
      p_description: `Redeemed: ${reward.name}`,
    });

    if (spendError || !spendResult) {
      console.error('Error spending points:', spendError);
      return NextResponse.json(
        { error: 'Failed to spend points' },
        { status: 500 }
      );
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('rewards_redemptions')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        points_spent: reward.points_cost,
        status: 'pending',
      })
      .select()
      .single();

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError);
      return NextResponse.json(
        { error: 'Failed to create redemption' },
        { status: 500 }
      );
    }

    // Update stock if applicable
    if (reward.stock !== null) {
      await supabase
        .from('rewards_catalog')
        .update({ stock: reward.stock - 1 })
        .eq('id', rewardId);
    }

    return NextResponse.json({
      success: true,
      redemption,
      message: 'Reward redeemed successfully!',
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
