-- Points and Rewards System Migration
-- Gamification through points that users can earn and spend

-- Add points to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0;

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Transaction details
  amount INTEGER NOT NULL, -- positive for earning, negative for spending
  balance_after INTEGER NOT NULL,

  -- Type and source
  transaction_type VARCHAR(50) NOT NULL, -- earn, spend, expire, adjustment
  source_type VARCHAR(50) NOT NULL, -- meeting_join, post_create, comment_create, review, referral, daily_checkin, purchase, admin_adjustment
  source_id UUID, -- ID of the related entity (meeting, post, etc.)

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Expiration (points can expire)
  expires_at TIMESTAMP WITH TIME ZONE,
  expired BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points_config table for managing point rules
CREATE TABLE IF NOT EXISTS points_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  action_type VARCHAR(50) UNIQUE NOT NULL,
  points INTEGER NOT NULL,
  daily_limit INTEGER, -- max times per day, NULL for unlimited
  total_limit INTEGER, -- max times ever, NULL for unlimited

  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default points configuration
INSERT INTO points_config (action_type, points, daily_limit, total_limit, description) VALUES
  ('meeting_join', 50, NULL, NULL, 'Join a meeting'),
  ('meeting_complete', 100, NULL, NULL, 'Complete a meeting'),
  ('meeting_host', 200, NULL, NULL, 'Host a meeting'),
  ('post_create', 10, 5, NULL, 'Create a post'),
  ('comment_create', 5, 10, NULL, 'Write a comment'),
  ('review_write', 30, NULL, NULL, 'Write a review'),
  ('profile_complete', 50, 1, 1, 'Complete your profile'),
  ('daily_checkin', 5, 1, NULL, 'Daily check-in'),
  ('referral_signup', 100, NULL, NULL, 'Refer a friend who signs up'),
  ('referral_first_meeting', 200, NULL, NULL, 'Referred friend joins first meeting'),
  ('first_meeting', 100, 1, 1, 'Join your first meeting'),
  ('social_share', 10, 3, NULL, 'Share content on social media'),
  ('gym_review', 30, NULL, NULL, 'Review a gym'),
  ('win_match', 150, NULL, NULL, 'Win a ranked match'),
  ('achievement_unlock', 50, NULL, NULL, 'Unlock an achievement'),
  ('streak_7_days', 100, NULL, NULL, '7-day activity streak'),
  ('streak_30_days', 500, NULL, NULL, '30-day activity streak'),
  ('level_up', 200, NULL, NULL, 'Level up in skill rating')
ON CONFLICT (action_type) DO NOTHING;

-- Create rewards_catalog table
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reward details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,

  -- Type
  reward_type VARCHAR(50) NOT NULL, -- discount, badge, feature_unlock, gift, voucher

  -- Availability
  stock INTEGER, -- NULL for unlimited
  available_until TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT TRUE,

  -- Metadata (for various reward types)
  metadata JSONB DEFAULT '{}',

  -- Images
  image_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards_redemptions table
CREATE TABLE IF NOT EXISTS rewards_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards_catalog(id) ON DELETE CASCADE,

  points_spent INTEGER NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, fulfilled, cancelled

  -- Fulfillment
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfillment_details JSONB DEFAULT '{}',

  -- Metadata
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_checkins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INTEGER DEFAULT 5,

  -- Streak tracking
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, checkin_date)
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  referral_code VARCHAR(50),

  -- Status tracking
  signup_completed BOOLEAN DEFAULT TRUE,
  signup_points_awarded BOOLEAN DEFAULT FALSE,

  first_meeting_completed BOOLEAN DEFAULT FALSE,
  meeting_points_awarded BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(referred_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_source ON points_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_expires ON points_transactions(expires_at, expired);

CREATE INDEX IF NOT EXISTS idx_rewards_redemptions_user ON rewards_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_redemptions_reward ON rewards_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_rewards_redemptions_status ON rewards_redemptions(status);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(checkin_date);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

-- Enable RLS
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- points_transactions
CREATE POLICY "Users can view their own points transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points transactions"
  ON points_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all points transactions"
  ON points_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- points_config
CREATE POLICY "Anyone can view points config"
  ON points_config FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage points config"
  ON points_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- rewards_catalog
CREATE POLICY "Anyone can view enabled rewards"
  ON rewards_catalog FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage rewards catalog"
  ON rewards_catalog FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- rewards_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON rewards_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions"
  ON rewards_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redemptions"
  ON rewards_redemptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- daily_checkins
CREATE POLICY "Users can view their own checkins"
  ON daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create checkins"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- referrals
CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_action_type VARCHAR,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
  v_new_balance INTEGER;
  v_daily_limit INTEGER;
  v_total_limit INTEGER;
  v_daily_count INTEGER;
  v_total_count INTEGER;
  v_enabled BOOLEAN;
BEGIN
  -- Get points configuration
  SELECT points, daily_limit, total_limit, enabled
  INTO v_points, v_daily_limit, v_total_limit, v_enabled
  FROM points_config
  WHERE action_type = p_action_type;

  -- Check if action exists and is enabled
  IF NOT FOUND OR NOT v_enabled THEN
    RETURN 0;
  END IF;

  -- Check daily limit
  IF v_daily_limit IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_daily_count
    FROM points_transactions
    WHERE user_id = p_user_id
      AND source_type = p_action_type
      AND created_at >= CURRENT_DATE;

    IF v_daily_count >= v_daily_limit THEN
      RETURN 0;
    END IF;
  END IF;

  -- Check total limit
  IF v_total_limit IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_total_count
    FROM points_transactions
    WHERE user_id = p_user_id
      AND source_type = p_action_type;

    IF v_total_count >= v_total_limit THEN
      RETURN 0;
    END IF;
  END IF;

  -- Update user points
  UPDATE users
  SET
    points = points + v_points,
    lifetime_points = lifetime_points + v_points
  WHERE id = p_user_id
  RETURNING points INTO v_new_balance;

  -- Insert transaction
  INSERT INTO points_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    source_type,
    source_id,
    description
  ) VALUES (
    p_user_id,
    v_points,
    v_new_balance,
    'earn',
    p_action_type,
    p_source_id,
    COALESCE(p_description, (SELECT description FROM points_config WHERE action_type = p_action_type))
  );

  RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- Function to spend points
CREATE OR REPLACE FUNCTION spend_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type VARCHAR,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_points INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current points
  SELECT points INTO v_current_points
  FROM users
  WHERE id = p_user_id;

  -- Check if user has enough points
  IF v_current_points < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct points
  UPDATE users
  SET points = points - p_amount
  WHERE id = p_user_id
  RETURNING points INTO v_new_balance;

  -- Insert transaction
  INSERT INTO points_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    source_type,
    source_id,
    description
  ) VALUES (
    p_user_id,
    -p_amount,
    v_new_balance,
    'spend',
    p_source_type,
    p_source_id,
    p_description
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert some default rewards
INSERT INTO rewards_catalog (name, description, points_cost, reward_type, metadata) VALUES
  ('10% Meeting Fee Discount', 'Get 10% off your next meeting fee', 500, 'discount', '{"discount_percent": 10, "max_uses": 1}'),
  ('Premium Badge', 'Unlock a special premium badge for your profile', 1000, 'badge', '{"badge_id": "premium_supporter"}'),
  ('Ad-Free Week', 'Enjoy 7 days without ads', 300, 'feature_unlock', '{"duration_days": 7}'),
  ('VIP Profile Frame', 'Special golden frame for your profile picture', 2000, 'badge', '{"badge_id": "vip_frame"}'),
  ('5,000 KRW Voucher', 'Voucher for partner sports shops', 5000, 'voucher', '{"value": 5000, "currency": "KRW"}}')
ON CONFLICT DO NOTHING;
