-- ============================================================================
-- Migration: Fix Subscription Expiration System
-- Description: Add RLS, auto-expiration functions, and scheduled cleanup
-- ============================================================================

-- ============================================================================
-- Part 1: Enable RLS on premium_memberships
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE premium_memberships ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own premium memberships
CREATE POLICY "Users can view own premium memberships"
  ON premium_memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own premium memberships (for purchase)
CREATE POLICY "Users can insert own premium memberships"
  ON premium_memberships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only allow updates to own memberships
CREATE POLICY "Users can update own premium memberships"
  ON premium_memberships
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Part 2: Create function to deactivate expired premium memberships
-- ============================================================================

CREATE OR REPLACE FUNCTION deactivate_expired_premium_memberships()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE premium_memberships
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true AND end_date < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Part 3: Update VIP expiration function (already exists, just ensure it's correct)
-- ============================================================================

CREATE OR REPLACE FUNCTION deactivate_expired_vip_memberships()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE vip_memberships
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true AND end_date < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Part 4: Create combined function to clean up all expired subscriptions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS TABLE(premium_count INTEGER, vip_count INTEGER) AS $$
DECLARE
  v_premium_count INTEGER;
  v_vip_count INTEGER;
BEGIN
  -- Deactivate expired premium memberships
  v_premium_count := deactivate_expired_premium_memberships();

  -- Deactivate expired VIP memberships
  v_vip_count := deactivate_expired_vip_memberships();

  -- Return counts
  RETURN QUERY SELECT v_premium_count, v_vip_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Part 5: Enable pg_cron extension and schedule cleanup job
-- ============================================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup to run every day at 1 AM
-- This will automatically deactivate expired subscriptions
SELECT cron.schedule(
  'cleanup-expired-subscriptions',
  '0 1 * * *', -- Every day at 1 AM
  $$SELECT cleanup_expired_subscriptions();$$
);

-- ============================================================================
-- Part 6: Add trigger to check expiration on each query (optional backup)
-- ============================================================================

-- This trigger ensures that if a record is selected that's expired,
-- it gets marked as inactive immediately
CREATE OR REPLACE FUNCTION check_subscription_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND NEW.end_date < NOW() THEN
    NEW.is_active := false;
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to premium_memberships
DROP TRIGGER IF EXISTS premium_expiration_check ON premium_memberships;
CREATE TRIGGER premium_expiration_check
  BEFORE UPDATE ON premium_memberships
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiration();

-- Apply trigger to vip_memberships
DROP TRIGGER IF EXISTS vip_expiration_check ON vip_memberships;
CREATE TRIGGER vip_expiration_check
  BEFORE UPDATE ON vip_memberships
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiration();

-- ============================================================================
-- Part 7: Add indexes for better query performance
-- ============================================================================

-- Index on user_id and active status for faster lookups
CREATE INDEX IF NOT EXISTS idx_premium_memberships_user_active
  ON premium_memberships(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_premium_memberships_end_date
  ON premium_memberships(end_date)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vip_memberships_user_active
  ON vip_memberships(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vip_memberships_end_date
  ON vip_memberships(end_date)
  WHERE is_active = true;

-- ============================================================================
-- Part 8: Create view for active subscriptions only
-- ============================================================================

CREATE OR REPLACE VIEW active_premium_memberships AS
SELECT *
FROM premium_memberships
WHERE is_active = true AND end_date >= NOW();

CREATE OR REPLACE VIEW active_vip_memberships AS
SELECT *
FROM vip_memberships
WHERE is_active = true AND end_date >= NOW();

-- ============================================================================
-- Part 9: Grant necessary permissions
-- ============================================================================

-- Grant access to views
GRANT SELECT ON active_premium_memberships TO authenticated;
GRANT SELECT ON active_vip_memberships TO authenticated;

-- ============================================================================
-- Part 10: Add helpful comments
-- ============================================================================

COMMENT ON FUNCTION deactivate_expired_premium_memberships() IS
  'Deactivates premium memberships that have passed their end_date. Returns count of deactivated memberships.';

COMMENT ON FUNCTION deactivate_expired_vip_memberships() IS
  'Deactivates VIP memberships that have passed their end_date. Returns count of deactivated memberships.';

COMMENT ON FUNCTION cleanup_expired_subscriptions() IS
  'Runs both premium and VIP expiration cleanup. Scheduled to run daily at 1 AM via pg_cron.';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Run initial cleanup to mark any currently expired subscriptions
SELECT cleanup_expired_subscriptions();
