-- Create function to refund all participants when session is deleted
CREATE OR REPLACE FUNCTION refund_session_participants(p_match_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_participant RECORD;
BEGIN
  -- Refund entry fees and betting amounts to all participants
  FOR v_participant IN
    SELECT
      user_id,
      entry_fee_points_paid,
      entry_fee_feathers_paid,
      bet_paid,
      bet_amount,
      bet_currency_type
    FROM match_participants
    WHERE match_session_id = p_match_session_id
  LOOP
    -- Refund entry fee - points
    IF v_participant.entry_fee_points_paid > 0 THEN
      UPDATE users
      SET points = points + v_participant.entry_fee_points_paid,
          updated_at = NOW()
      WHERE id = v_participant.user_id;
    END IF;

    -- Refund entry fee - feathers
    IF v_participant.entry_fee_feathers_paid > 0 THEN
      UPDATE users
      SET feathers = feathers + v_participant.entry_fee_feathers_paid,
          updated_at = NOW()
      WHERE id = v_participant.user_id;
    END IF;

    -- Refund betting amount
    IF v_participant.bet_paid AND v_participant.bet_amount > 0 THEN
      IF v_participant.bet_currency_type = 'POINTS' THEN
        UPDATE users
        SET points = points + v_participant.bet_amount,
            updated_at = NOW()
        WHERE id = v_participant.user_id;
      ELSIF v_participant.bet_currency_type = 'FEATHERS' THEN
        UPDATE users
        SET feathers = feathers + v_participant.bet_amount,
            updated_at = NOW()
        WHERE id = v_participant.user_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refund_session_participants(UUID) TO authenticated;
