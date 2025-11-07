-- Add user_purchased_features table for individual feature purchases
-- This allows users to purchase specific features separately from premium membership

CREATE TABLE IF NOT EXISTS user_purchased_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,

  -- Purchase details
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Payment info
  price_paid INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'KRW',
  payment_method VARCHAR(50),

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_purchased_features_user ON user_purchased_features(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchased_features_feature ON user_purchased_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_user_purchased_features_active ON user_purchased_features(is_active);
CREATE INDEX IF NOT EXISTS idx_user_purchased_features_expires ON user_purchased_features(expires_at);

-- Enable RLS
ALTER TABLE user_purchased_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own purchased features"
  ON user_purchased_features FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased features"
  ON user_purchased_features FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all purchased features"
  ON user_purchased_features FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to check if user has a specific purchased feature
CREATE OR REPLACE FUNCTION has_purchased_feature(
  p_user_id UUID,
  p_feature_key VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_feature BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM user_purchased_features
    WHERE user_id = p_user_id
      AND feature_key = p_feature_key
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_feature;

  RETURN COALESCE(v_has_feature, false);
END;
$$ LANGUAGE plpgsql;

-- Function to activate purchased feature
CREATE OR REPLACE FUNCTION activate_purchased_feature(
  p_user_id UUID,
  p_feature_key VARCHAR,
  p_duration_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_feature_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration date if duration is specified
  IF p_duration_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  END IF;

  -- Insert purchased feature
  INSERT INTO user_purchased_features (
    user_id,
    feature_key,
    expires_at,
    price_paid
  ) VALUES (
    p_user_id,
    p_feature_key,
    v_expires_at,
    0 -- Will be updated by payment system
  )
  RETURNING id INTO v_feature_id;

  RETURN v_feature_id;
END;
$$ LANGUAGE plpgsql;
