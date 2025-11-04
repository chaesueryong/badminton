-- Premium Subscription System Migration
-- Comprehensive subscription management for monetization

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plan details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  plan_type VARCHAR(50) NOT NULL, -- individual, club_small, club_medium, club_large

  -- Pricing
  price_monthly INTEGER NOT NULL,
  price_quarterly INTEGER,
  price_yearly INTEGER,

  -- Billing cycle
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly

  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '{}',

  -- Limits
  message_limit INTEGER, -- NULL for unlimited
  search_limit INTEGER,
  priority_boost INTEGER DEFAULT 0,

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, trial, paused

  -- Billing
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,

  -- Pricing
  price_paid INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'KRW',

  -- Trial
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,

  -- Payment
  payment_method VARCHAR(50),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_history table (for tracking changes)
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Change details
  event_type VARCHAR(50) NOT NULL, -- created, renewed, cancelled, upgraded, downgraded, expired, trial_started, trial_ended
  previous_status VARCHAR(50),
  new_status VARCHAR(50),

  -- Financial
  amount INTEGER,
  currency VARCHAR(10) DEFAULT 'KRW',

  -- Context
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_features table (for granular feature control)
CREATE TABLE IF NOT EXISTS subscription_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  feature_key VARCHAR(100) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- messaging, search, analytics, social, events

  -- Default limits
  free_limit INTEGER, -- NULL for not available
  premium_limit INTEGER, -- NULL for unlimited

  enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature_usage table (track usage against limits)
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL REFERENCES subscription_features(feature_key),

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  usage_period VARCHAR(20) DEFAULT 'monthly', -- daily, weekly, monthly
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, feature_key, period_start)
);

-- Create subscription_coupons table
CREATE TABLE IF NOT EXISTS subscription_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Discount
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount, trial_extension
  discount_value INTEGER NOT NULL,

  -- Applicability
  applicable_plans UUID[], -- NULL for all plans

  -- Limits
  max_redemptions INTEGER, -- NULL for unlimited
  current_redemptions INTEGER DEFAULT 0,

  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Status
  enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon_redemptions table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES subscription_coupons(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),

  discount_applied INTEGER NOT NULL,

  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(coupon_id, user_id)
);

-- Add premium status to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_since TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event ON subscription_history(event_type);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON feature_usage(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_coupons_code ON subscription_coupons(code);
CREATE INDEX IF NOT EXISTS idx_subscription_coupons_valid ON subscription_coupons(valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);

CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- subscription_plans
CREATE POLICY "Anyone can view enabled plans"
  ON subscription_plans FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- subscription_history
CREATE POLICY "Users can view their subscription history"
  ON subscription_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE id = subscription_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (true);

-- subscription_features
CREATE POLICY "Anyone can view enabled features"
  ON subscription_features FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage features"
  ON subscription_features FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- feature_usage
CREATE POLICY "Users can view their own usage"
  ON feature_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage usage"
  ON feature_usage FOR ALL
  USING (true);

-- subscription_coupons
CREATE POLICY "Anyone can view valid coupons"
  ON subscription_coupons FOR SELECT
  USING (
    enabled = true AND
    NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '100 years')
  );

CREATE POLICY "Admins can manage coupons"
  ON subscription_coupons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- coupon_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem coupons"
  ON coupon_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT
    CASE
      WHEN is_premium AND premium_until > NOW() THEN true
      ELSE false
    END
  INTO v_is_premium
  FROM users
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_premium, false);
END;
$$ LANGUAGE plpgsql;

-- Function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature_key VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_free_limit INTEGER;
  v_premium_limit INTEGER;
  v_usage_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Check if user is premium
  v_is_premium := is_user_premium(p_user_id);

  -- Get feature limits
  SELECT free_limit, premium_limit
  INTO v_free_limit, v_premium_limit
  FROM subscription_features
  WHERE feature_key = p_feature_key AND enabled = true;

  -- If feature doesn't exist or is disabled
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Set applicable limit
  v_limit := CASE WHEN v_is_premium THEN v_premium_limit ELSE v_free_limit END;

  -- NULL means unlimited or not available
  IF v_limit IS NULL THEN
    RETURN v_is_premium; -- Available only to premium if free_limit is NULL
  END IF;

  -- Get current usage for this period
  SELECT COALESCE(usage_count, 0)
  INTO v_usage_count
  FROM feature_usage
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND NOW() BETWEEN period_start AND period_end;

  -- Check if under limit
  RETURN COALESCE(v_usage_count, 0) < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_user_id UUID,
  p_feature_key VARCHAR,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate current period (monthly)
  v_period_start := date_trunc('month', NOW());
  v_period_end := v_period_start + INTERVAL '1 month';

  -- Insert or update usage
  INSERT INTO feature_usage (user_id, feature_key, usage_count, period_start, period_end)
  VALUES (p_user_id, p_feature_key, p_increment, v_period_start, v_period_end)
  ON CONFLICT (user_id, feature_key, period_start)
  DO UPDATE SET
    usage_count = feature_usage.usage_count + p_increment,
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to activate subscription
CREATE OR REPLACE FUNCTION activate_subscription(
  p_subscription_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get subscription details
  SELECT user_id, current_period_end
  INTO v_user_id, v_period_end
  FROM subscriptions
  WHERE id = p_subscription_id;

  -- Update user premium status
  UPDATE users
  SET
    is_premium = true,
    premium_since = COALESCE(premium_since, NOW()),
    premium_until = v_period_end,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Log event
  INSERT INTO subscription_history (subscription_id, event_type, new_status)
  VALUES (p_subscription_id, 'activated', 'active');
END;
$$ LANGUAGE plpgsql;

-- Function to cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_subscription_id UUID,
  p_immediate BOOLEAN DEFAULT FALSE,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID
  SELECT user_id INTO v_user_id
  FROM subscriptions
  WHERE id = p_subscription_id;

  IF p_immediate THEN
    -- Cancel immediately
    UPDATE subscriptions
    SET
      status = 'cancelled',
      cancelled_at = NOW(),
      cancellation_reason = p_reason,
      cancel_at_period_end = false
    WHERE id = p_subscription_id;

    -- Remove premium status
    UPDATE users
    SET
      is_premium = false,
      premium_until = NOW()
    WHERE id = v_user_id;

    -- Log event
    INSERT INTO subscription_history (subscription_id, event_type, previous_status, new_status, notes)
    VALUES (p_subscription_id, 'cancelled', 'active', 'cancelled', p_reason);
  ELSE
    -- Cancel at period end
    UPDATE subscriptions
    SET
      cancel_at_period_end = true,
      cancellation_reason = p_reason
    WHERE id = p_subscription_id;

    -- Log event
    INSERT INTO subscription_history (subscription_id, event_type, notes)
    VALUES (p_subscription_id, 'scheduled_cancellation', p_reason);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, plan_type, price_monthly, price_quarterly, price_yearly, features, is_popular) VALUES
  (
    'Premium Individual',
    'Full access to all premium features',
    'individual',
    9900,
    27000,
    99000,
    '{
      "priority_matching": true,
      "unlimited_messages": true,
      "advanced_search": true,
      "detailed_stats": true,
      "exclusive_badges": true,
      "profile_customization": true,
      "monthly_points": 500,
      "ad_free": true,
      "premium_tournaments": true,
      "elo_history": true
    }'::jsonb,
    true
  ),
  (
    'Club Small',
    'For clubs with up to 10 members',
    'club_small',
    49000,
    135000,
    490000,
    '{
      "max_members": 10,
      "club_analytics": true,
      "event_management": true,
      "priority_support": true,
      "custom_branding": false
    }'::jsonb,
    false
  ),
  (
    'Club Medium',
    'For clubs with 11-30 members',
    'club_medium',
    99000,
    270000,
    990000,
    '{
      "max_members": 30,
      "club_analytics": true,
      "event_management": true,
      "priority_support": true,
      "custom_branding": true,
      "dedicated_page": true
    }'::jsonb,
    false
  ),
  (
    'Club Large',
    'For clubs with 31+ members',
    'club_large',
    199000,
    540000,
    1990000,
    '{
      "max_members": null,
      "club_analytics": true,
      "event_management": true,
      "priority_support": true,
      "custom_branding": true,
      "dedicated_page": true,
      "api_access": true,
      "white_label": true
    }'::jsonb,
    false
  )
ON CONFLICT DO NOTHING;

-- Insert default subscription features
INSERT INTO subscription_features (feature_key, feature_name, description, category, free_limit, premium_limit) VALUES
  ('messages_monthly', 'Monthly Messages', 'Number of direct messages per month', 'messaging', 20, NULL),
  ('advanced_search', 'Advanced Search', 'Access to advanced search filters', 'search', 0, NULL),
  ('meeting_priority', 'Priority Meeting Matching', 'Higher priority in meeting recommendations', 'events', 0, NULL),
  ('detailed_analytics', 'Detailed Analytics', 'Access to detailed performance analytics', 'analytics', 0, NULL),
  ('profile_themes', 'Profile Themes', 'Custom profile themes and colors', 'social', 0, NULL),
  ('elo_history', 'ELO History', 'View detailed ELO rating history', 'analytics', 0, NULL),
  ('ad_free', 'Ad-Free Experience', 'Browse without advertisements', 'general', 0, NULL)
ON CONFLICT DO NOTHING;

-- Insert sample coupons
INSERT INTO subscription_coupons (code, description, discount_type, discount_value, max_redemptions) VALUES
  ('WELCOME50', 'Welcome discount - 50% off first month', 'percentage', 50, 1000),
  ('FRIEND100', 'Friend referral - 1 month free', 'trial_extension', 30, NULL),
  ('EARLY2025', 'Early adopter special - 20% off', 'percentage', 20, 500)
ON CONFLICT DO NOTHING;
