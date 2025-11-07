-- Add betting system to match sessions
-- Players can bet points or feathers, winner takes all

-- Add betting columns to match_sessions
ALTER TABLE match_sessions
ADD COLUMN IF NOT EXISTS bet_currency_type TEXT DEFAULT 'NONE' CHECK (bet_currency_type IN ('NONE', 'POINTS', 'FEATHERS')),
ADD COLUMN IF NOT EXISTS bet_amount_per_player INTEGER DEFAULT 0;

-- Add betting columns to match_participants to track individual bets
ALTER TABLE match_participants
ADD COLUMN IF NOT EXISTS bet_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bet_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bet_currency_type TEXT DEFAULT 'NONE' CHECK (bet_currency_type IN ('NONE', 'POINTS', 'FEATHERS'));

-- Create function to handle betting payment when joining match
CREATE OR REPLACE FUNCTION pay_match_bet(
  p_match_session_id TEXT,
  p_user_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_participant RECORD;
  v_user_balance RECORD;
  v_result JSON;
BEGIN
  -- Get match session info
  SELECT * INTO v_session
  FROM match_sessions
  WHERE id = p_match_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match session not found';
  END IF;

  -- Get participant info
  SELECT * INTO v_participant
  FROM match_participants
  WHERE match_session_id = p_match_session_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  -- Check if bet is already paid
  IF v_participant.bet_paid THEN
    RAISE EXCEPTION 'Bet already paid';
  END IF;

  -- Skip if no betting
  IF v_session.bet_currency_type = 'NONE' OR v_session.bet_amount_per_player = 0 THEN
    UPDATE match_participants
    SET bet_paid = true
    WHERE match_session_id = p_match_session_id AND user_id = p_user_id;

    RETURN json_build_object('success', true, 'message', 'No bet required');
  END IF;

  -- Get user balance
  SELECT points, feathers INTO v_user_balance
  FROM users
  WHERE id = p_user_id;

  -- Check balance
  IF v_session.bet_currency_type = 'POINTS' THEN
    IF v_user_balance.points < v_session.bet_amount_per_player THEN
      RAISE EXCEPTION 'Insufficient points balance';
    END IF;

    -- Deduct points
    UPDATE users
    SET points = points - v_session.bet_amount_per_player
    WHERE id = p_user_id;

  ELSIF v_session.bet_currency_type = 'FEATHERS' THEN
    IF v_user_balance.feathers < v_session.bet_amount_per_player THEN
      RAISE EXCEPTION 'Insufficient feathers balance';
    END IF;

    -- Deduct feathers
    UPDATE users
    SET feathers = feathers - v_session.bet_amount_per_player
    WHERE id = p_user_id;
  END IF;

  -- Mark bet as paid
  UPDATE match_participants
  SET
    bet_paid = true,
    bet_amount = v_session.bet_amount_per_player,
    bet_currency_type = v_session.bet_currency_type
  WHERE match_session_id = p_match_session_id AND user_id = p_user_id;

  -- Record transaction
  INSERT INTO match_entry_transactions (
    user_id,
    match_session_id,
    transaction_type,
    currency_type,
    amount
  ) VALUES (
    p_user_id,
    p_match_session_id,
    'BET',
    v_session.bet_currency_type,
    -v_session.bet_amount_per_player
  );

  RETURN json_build_object(
    'success', true,
    'bet_amount', v_session.bet_amount_per_player,
    'currency_type', v_session.bet_currency_type
  );
END;
$$ LANGUAGE plpgsql;

-- Update complete_match_session function to distribute betting winnings
CREATE OR REPLACE FUNCTION complete_match_session(
  p_match_session_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_participant RECORD;
  v_winner_team INTEGER;
  v_total_bet_pool INTEGER;
  v_winner_count INTEGER;
  v_bet_winnings_per_winner INTEGER;
BEGIN
  -- Get match session
  SELECT * INTO v_session
  FROM match_sessions
  WHERE id = p_match_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match session not found';
  END IF;

  IF v_session.status != 'IN_PROGRESS' THEN
    RAISE EXCEPTION 'Match is not in progress';
  END IF;

  IF v_session.result IS NULL THEN
    RAISE EXCEPTION 'Match result not set';
  END IF;

  -- Determine winner team
  IF v_session.result IN ('PLAYER1_WIN', 'TEAM1_WIN') THEN
    v_winner_team := 1;
  ELSIF v_session.result IN ('PLAYER2_WIN', 'TEAM2_WIN') THEN
    v_winner_team := 2;
  ELSE
    RAISE EXCEPTION 'Invalid match result';
  END IF;

  -- Calculate total bet pool
  SELECT COALESCE(SUM(bet_amount), 0) INTO v_total_bet_pool
  FROM match_participants
  WHERE match_session_id = p_match_session_id AND bet_paid = true;

  -- Count winners
  SELECT COUNT(*) INTO v_winner_count
  FROM match_participants
  WHERE match_session_id = p_match_session_id AND team = v_winner_team;

  -- Calculate winnings per winner
  IF v_winner_count > 0 AND v_total_bet_pool > 0 THEN
    v_bet_winnings_per_winner := v_total_bet_pool / v_winner_count;
  ELSE
    v_bet_winnings_per_winner := 0;
  END IF;

  -- Process each participant
  FOR v_participant IN
    SELECT * FROM match_participants
    WHERE match_session_id = p_match_session_id
  LOOP
    DECLARE
      v_opponent_avg_rating INTEGER;
      v_team_avg_rating INTEGER;
      v_is_winner BOOLEAN;
      v_rating_change INTEGER;
      v_new_rating INTEGER;
      v_rating_column TEXT;
    BEGIN
      -- Determine if participant is winner
      v_is_winner := v_participant.team = v_winner_team;

      -- Get opponent team average rating
      SELECT
        CASE v_session.match_type
          WHEN 'MS' THEN COALESCE(AVG(rating_ms), 1500)
          WHEN 'WS' THEN COALESCE(AVG(rating_ws), 1500)
          WHEN 'MD' THEN COALESCE(AVG(rating_md), 1500)
          WHEN 'WD' THEN COALESCE(AVG(rating_wd), 1500)
          WHEN 'XD' THEN COALESCE(AVG(rating_xd), 1500)
        END INTO v_opponent_avg_rating
      FROM match_participants mp
      INNER JOIN users u ON mp.user_id = u.id
      WHERE mp.match_session_id = p_match_session_id
        AND mp.team != v_participant.team;

      -- Get user's team average rating
      SELECT
        CASE v_session.match_type
          WHEN 'MS' THEN COALESCE(AVG(rating_ms), 1500)
          WHEN 'WS' THEN COALESCE(AVG(rating_ws), 1500)
          WHEN 'MD' THEN COALESCE(AVG(rating_md), 1500)
          WHEN 'WD' THEN COALESCE(AVG(rating_wd), 1500)
          WHEN 'XD' THEN COALESCE(AVG(rating_xd), 1500)
        END INTO v_team_avg_rating
      FROM match_participants mp
      INNER JOIN users u ON mp.user_id = u.id
      WHERE mp.match_session_id = p_match_session_id
        AND mp.team = v_participant.team;

      -- Calculate rating change
      v_rating_change := calculate_rating_change(
        v_team_avg_rating,
        v_opponent_avg_rating,
        v_is_winner
      );

      -- Get current rating and calculate new rating
      EXECUTE format('SELECT %I FROM users WHERE id = $1',
        'rating_' || LOWER(v_session.match_type))
      INTO v_new_rating
      USING v_participant.user_id;

      v_new_rating := GREATEST(0, v_new_rating + v_rating_change);

      -- Update user rating
      v_rating_column := 'rating_' || LOWER(v_session.match_type);
      EXECUTE format('UPDATE users SET %I = $1 WHERE id = $2', v_rating_column)
      USING v_new_rating, v_participant.user_id;

      -- Update participant record with rating changes
      UPDATE match_participants
      SET
        rating_before = v_new_rating - v_rating_change,
        rating_after = v_new_rating,
        rating_change = v_rating_change
      WHERE id = v_participant.id;

      -- Distribute betting winnings to winners
      IF v_is_winner AND v_bet_winnings_per_winner > 0 THEN
        IF v_session.bet_currency_type = 'POINTS' THEN
          UPDATE users
          SET points = points + v_bet_winnings_per_winner
          WHERE id = v_participant.user_id;

          -- Record winnings transaction
          INSERT INTO match_entry_transactions (
            user_id,
            match_session_id,
            transaction_type,
            currency_type,
            amount
          ) VALUES (
            v_participant.user_id,
            p_match_session_id,
            'BET_WINNINGS',
            'POINTS',
            v_bet_winnings_per_winner
          );

        ELSIF v_session.bet_currency_type = 'FEATHERS' THEN
          UPDATE users
          SET feathers = feathers + v_bet_winnings_per_winner
          WHERE id = v_participant.user_id;

          -- Record winnings transaction
          INSERT INTO match_entry_transactions (
            user_id,
            match_session_id,
            transaction_type,
            currency_type,
            amount
          ) VALUES (
            v_participant.user_id,
            p_match_session_id,
            'BET_WINNINGS',
            'FEATHERS',
            v_bet_winnings_per_winner
          );
        END IF;
      END IF;

      -- Award winner points (existing reward system)
      IF v_is_winner AND v_session.winner_points > 0 THEN
        UPDATE users
        SET points = points + v_session.winner_points
        WHERE id = v_participant.user_id;

        UPDATE match_participants
        SET points_earned = v_session.winner_points
        WHERE id = v_participant.id;
      END IF;

    END;
  END LOOP;

  -- Update session status
  UPDATE match_sessions
  SET
    status = 'COMPLETED',
    completed_at = NOW()
  WHERE id = p_match_session_id;

  RETURN json_build_object(
    'success', true,
    'winner_team', v_winner_team,
    'total_bet_pool', v_total_bet_pool,
    'bet_winnings_per_winner', v_bet_winnings_per_winner
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON COLUMN match_sessions.bet_currency_type IS '베팅 화폐 타입 (NONE: 베팅 없음, POINTS: 포인트, FEATHERS: 깃털)';
COMMENT ON COLUMN match_sessions.bet_amount_per_player IS '플레이어당 베팅 금액 (승자가 모든 베팅금을 나눠가짐)';
COMMENT ON COLUMN match_participants.bet_paid IS '베팅금 지불 여부';
COMMENT ON COLUMN match_participants.bet_amount IS '플레이어가 지불한 베팅 금액';
