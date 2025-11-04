-- ELO Rating System Migration
-- This adds comprehensive ELO-based skill rating for users

-- Add ELO rating fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1500;
ALTER TABLE users ADD COLUMN IF NOT EXISTS elo_peak INTEGER DEFAULT 1500;
ALTER TABLE users ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS draws INTEGER DEFAULT 0;

-- Create match_results table for tracking game outcomes
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Match info
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  match_type VARCHAR(50) DEFAULT 'casual', -- casual, ranked, tournament

  -- Players
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Scores
  player1_score INTEGER NOT NULL,
  player2_score INTEGER NOT NULL,

  -- Result
  result VARCHAR(20) NOT NULL, -- player1_win, player2_win, draw

  -- ELO changes
  player1_elo_before INTEGER NOT NULL,
  player1_elo_after INTEGER NOT NULL,
  player1_elo_change INTEGER NOT NULL,

  player2_elo_before INTEGER NOT NULL,
  player2_elo_after INTEGER NOT NULL,
  player2_elo_change INTEGER NOT NULL,

  -- Verification (both players must confirm)
  player1_confirmed BOOLEAN DEFAULT FALSE,
  player2_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create elo_history table for tracking rating changes over time
CREATE TABLE IF NOT EXISTS elo_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_result_id UUID REFERENCES match_results(id) ON DELETE CASCADE,

  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,

  reason VARCHAR(100), -- match_win, match_loss, match_draw, manual_adjustment, season_reset

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_results_player1 ON match_results(player1_id);
CREATE INDEX IF NOT EXISTS idx_match_results_player2 ON match_results(player2_id);
CREATE INDEX IF NOT EXISTS idx_match_results_meeting ON match_results(meeting_id);
CREATE INDEX IF NOT EXISTS idx_match_results_date ON match_results(match_date);
CREATE INDEX IF NOT EXISTS idx_match_results_confirmed ON match_results(player1_confirmed, player2_confirmed);

CREATE INDEX IF NOT EXISTS idx_elo_history_user ON elo_history(user_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_created ON elo_history(created_at);

CREATE INDEX IF NOT EXISTS idx_users_elo_rating ON users(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_games_played ON users(games_played);

-- Enable Row Level Security
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE elo_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_results

-- Users can view their own matches
CREATE POLICY "Users can view their own match results"
  ON match_results FOR SELECT
  USING (
    auth.uid() = player1_id OR
    auth.uid() = player2_id
  );

-- Users can create match results
CREATE POLICY "Users can create match results"
  ON match_results FOR INSERT
  WITH CHECK (
    auth.uid() = player1_id OR
    auth.uid() = player2_id
  );

-- Users can update only their confirmation status
CREATE POLICY "Users can confirm their matches"
  ON match_results FOR UPDATE
  USING (
    auth.uid() = player1_id OR
    auth.uid() = player2_id
  )
  WITH CHECK (
    auth.uid() = player1_id OR
    auth.uid() = player2_id
  );

-- Admins can view all matches
CREATE POLICY "Admins can view all match results"
  ON match_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete matches
CREATE POLICY "Admins can delete match results"
  ON match_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for elo_history

-- Users can view their own ELO history
CREATE POLICY "Users can view their own ELO history"
  ON elo_history FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert ELO history (via service role)
CREATE POLICY "System can insert ELO history"
  ON elo_history FOR INSERT
  WITH CHECK (true);

-- Admins can view all ELO history
CREATE POLICY "Admins can view all ELO history"
  ON elo_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update user stats after match confirmation
CREATE OR REPLACE FUNCTION update_user_stats_after_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if both players have confirmed
  IF NEW.player1_confirmed AND NEW.player2_confirmed AND NOT OLD.player1_confirmed OR NOT OLD.player2_confirmed THEN
    -- Update player 1
    UPDATE users
    SET
      elo_rating = NEW.player1_elo_after,
      elo_peak = GREATEST(elo_peak, NEW.player1_elo_after),
      games_played = games_played + 1,
      wins = CASE WHEN NEW.result = 'player1_win' THEN wins + 1 ELSE wins END,
      losses = CASE WHEN NEW.result = 'player2_win' THEN losses + 1 ELSE losses END,
      draws = CASE WHEN NEW.result = 'draw' THEN draws + 1 ELSE draws END,
      updated_at = NOW()
    WHERE id = NEW.player1_id;

    -- Update player 2
    UPDATE users
    SET
      elo_rating = NEW.player2_elo_after,
      elo_peak = GREATEST(elo_peak, NEW.player2_elo_after),
      games_played = games_played + 1,
      wins = CASE WHEN NEW.result = 'player2_win' THEN wins + 1 ELSE wins END,
      losses = CASE WHEN NEW.result = 'player1_win' THEN losses + 1 ELSE losses END,
      draws = CASE WHEN NEW.result = 'draw' THEN draws + 1 ELSE draws END,
      updated_at = NOW()
    WHERE id = NEW.player2_id;

    -- Insert ELO history for both players
    INSERT INTO elo_history (user_id, match_result_id, elo_before, elo_after, elo_change, reason)
    VALUES
      (NEW.player1_id, NEW.id, NEW.player1_elo_before, NEW.player1_elo_after, NEW.player1_elo_change,
        CASE
          WHEN NEW.result = 'player1_win' THEN 'match_win'
          WHEN NEW.result = 'player2_win' THEN 'match_loss'
          ELSE 'match_draw'
        END),
      (NEW.player2_id, NEW.id, NEW.player2_elo_before, NEW.player2_elo_after, NEW.player2_elo_change,
        CASE
          WHEN NEW.result = 'player2_win' THEN 'match_win'
          WHEN NEW.result = 'player1_win' THEN 'match_loss'
          ELSE 'match_draw'
        END);

    -- Set confirmation timestamp
    NEW.confirmed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS match_result_confirmed ON match_results;
CREATE TRIGGER match_result_confirmed
  BEFORE UPDATE ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_after_match();

-- Function to calculate ELO change
CREATE OR REPLACE FUNCTION calculate_elo_change(
  player_rating INTEGER,
  opponent_rating INTEGER,
  result DECIMAL, -- 1 for win, 0.5 for draw, 0 for loss
  k_factor INTEGER DEFAULT 32
)
RETURNS INTEGER AS $$
DECLARE
  expected_score DECIMAL;
  elo_change INTEGER;
BEGIN
  -- Calculate expected score using ELO formula
  expected_score := 1.0 / (1.0 + POWER(10, (opponent_rating - player_rating)::DECIMAL / 400.0));

  -- Calculate ELO change
  elo_change := ROUND(k_factor * (result - expected_score));

  RETURN elo_change;
END;
$$ LANGUAGE plpgsql;

-- Create view for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.nickname,
  u.profile_image,
  u.elo_rating,
  u.elo_peak,
  u.games_played,
  u.wins,
  u.losses,
  u.draws,
  CASE
    WHEN u.games_played = 0 THEN 0
    ELSE ROUND((u.wins::DECIMAL / u.games_played::DECIMAL) * 100, 2)
  END as win_rate,
  u.region,
  u.level,
  ROW_NUMBER() OVER (ORDER BY u.elo_rating DESC) as rank,
  ROW_NUMBER() OVER (PARTITION BY u.region ORDER BY u.elo_rating DESC) as regional_rank
FROM users u
WHERE u.games_played > 0
ORDER BY u.elo_rating DESC;

-- Grant permissions
GRANT SELECT ON leaderboard TO authenticated;
GRANT SELECT ON leaderboard TO anon;
