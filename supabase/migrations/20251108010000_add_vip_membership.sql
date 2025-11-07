-- Add VIP membership system
-- VIP membership is separate from Premium and provides different benefits:
-- - Ad-free experience
-- - Unlimited messaging (no point cost)
-- Premium membership focuses on meeting-related features

CREATE TABLE IF NOT EXISTS vip_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Membership details
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  -- Payment info
  plan_type VARCHAR(50) NOT NULL, -- monthly, quarterly, yearly
  price_paid INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'KRW',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),

  -- Billing
  auto_renew BOOLEAN DEFAULT FALSE,
  next_billing_date TIMESTAMP WITH TIME ZONE,

  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT vip_end_after_start CHECK (end_date > start_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vip_memberships_user ON vip_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_memberships_active ON vip_memberships(is_active);
CREATE INDEX IF NOT EXISTS idx_vip_memberships_dates ON vip_memberships(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vip_memberships_end_date ON vip_memberships(end_date);

-- Enable RLS
ALTER TABLE vip_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own VIP memberships"
  ON vip_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own VIP memberships"
  ON vip_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own VIP memberships"
  ON vip_memberships FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all VIP memberships"
  ON vip_memberships FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to check if user is VIP
CREATE OR REPLACE FUNCTION is_user_vip(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_vip BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM vip_memberships
    WHERE user_id = p_user_id
      AND is_active = true
      AND NOW() BETWEEN start_date AND end_date
  ) INTO v_is_vip;

  RETURN COALESCE(v_is_vip, false);
END;
$$ LANGUAGE plpgsql;

-- Function to activate VIP membership
CREATE OR REPLACE FUNCTION activate_vip_membership(
  p_user_id UUID,
  p_plan_type VARCHAR,
  p_price_paid INTEGER,
  p_duration_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_membership_id UUID;
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_date := NOW();
  v_end_date := v_start_date + (p_duration_days || ' days')::INTERVAL;

  -- Deactivate any existing active VIP memberships
  UPDATE vip_memberships
  SET is_active = false,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_active = true;

  -- Create new VIP membership
  INSERT INTO vip_memberships (
    user_id,
    start_date,
    end_date,
    plan_type,
    price_paid,
    is_active
  ) VALUES (
    p_user_id,
    v_start_date,
    v_end_date,
    p_plan_type,
    p_price_paid,
    true
  )
  RETURNING id INTO v_membership_id;

  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cancel VIP membership
CREATE OR REPLACE FUNCTION cancel_vip_membership(
  p_membership_id UUID,
  p_immediate BOOLEAN DEFAULT FALSE,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_immediate THEN
    -- Cancel immediately
    UPDATE vip_memberships
    SET
      is_active = false,
      cancelled_at = NOW(),
      cancellation_reason = p_reason,
      end_date = NOW(),
      updated_at = NOW()
    WHERE id = p_membership_id;
  ELSE
    -- Cancel at period end (keep active until end_date)
    UPDATE vip_memberships
    SET
      auto_renew = false,
      cancelled_at = NOW(),
      cancellation_reason = p_reason,
      updated_at = NOW()
    WHERE id = p_membership_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to extend VIP membership
CREATE OR REPLACE FUNCTION extend_vip_membership(
  p_membership_id UUID,
  p_additional_days INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE vip_memberships
  SET
    end_date = end_date + (p_additional_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_membership_id;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job function to auto-deactivate expired VIP memberships
CREATE OR REPLACE FUNCTION deactivate_expired_vip_memberships()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE vip_memberships
  SET
    is_active = false,
    updated_at = NOW()
  WHERE is_active = true
    AND end_date < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE vip_memberships IS 'VIP membership system for general features like ad-free and unlimited messaging';
COMMENT ON FUNCTION is_user_vip(UUID) IS 'Check if a user has an active VIP membership';
COMMENT ON FUNCTION activate_vip_membership(UUID, VARCHAR, INTEGER, INTEGER) IS 'Activate a new VIP membership for a user';
COMMENT ON FUNCTION cancel_vip_membership(UUID, BOOLEAN, TEXT) IS 'Cancel a VIP membership immediately or at period end';
COMMENT ON FUNCTION extend_vip_membership(UUID, INTEGER) IS 'Extend an existing VIP membership by additional days';
COMMENT ON FUNCTION deactivate_expired_vip_memberships() IS 'Deactivate expired VIP memberships (to be run by cron job)';
