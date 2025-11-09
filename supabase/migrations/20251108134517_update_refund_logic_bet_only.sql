-- Update refund function to only refund BET amounts, not ENTRY_FEE
-- Entry fees are NOT refundable
CREATE OR REPLACE FUNCTION refund_match_entry_fees(p_match_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
BEGIN
  -- Update match session status to CANCELLED
  UPDATE match_sessions
  SET status = 'CANCELLED',
      updated_at = NOW()
  WHERE id = p_match_session_id;

  -- Refund ONLY bets for this match session (NOT entry fees)
  FOR v_transaction IN
    SELECT
      user_id,
      amount,
      currency_type,
      transaction_type
    FROM match_entry_transactions
    WHERE match_session_id = p_match_session_id
      AND transaction_type = 'BET'  -- Only refund bets, NOT entry fees
  LOOP
    -- Refund to user's balance based on currency type
    IF v_transaction.currency_type = 'POINTS' THEN
      UPDATE users
      SET points = points + v_transaction.amount,
          updated_at = NOW()
      WHERE id = v_transaction.user_id;
    ELSIF v_transaction.currency_type = 'FEATHERS' THEN
      UPDATE users
      SET feathers = feathers + v_transaction.amount,
          updated_at = NOW()
      WHERE id = v_transaction.user_id;
    END IF;

    -- Record refund transaction
    INSERT INTO match_entry_transactions (
      match_session_id,
      user_id,
      amount,
      currency_type,
      transaction_type
    ) VALUES (
      p_match_session_id,
      v_transaction.user_id,
      v_transaction.amount,
      v_transaction.currency_type,
      'REFUND'
    );
  END LOOP;

END;
$$;
