-- Gamification System: Badges and Achievements
-- Comprehensive badge and achievement system to increase engagement

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Badge details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- milestone, achievement, special, seasonal, premium

  -- Visual
  icon_url TEXT,
  color VARCHAR(20),
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary

  -- Unlock criteria
  unlock_type VARCHAR(50) NOT NULL, -- auto, manual, achievement
  criteria JSONB DEFAULT '{}', -- Flexible criteria definition

  -- Rewards
  points_reward INTEGER DEFAULT 0,

  -- Availability
  enabled BOOLEAN DEFAULT TRUE,
  is_secret BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,

  -- Stats
  total_unlocked INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table (junction table)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,

  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT FALSE, -- Show on profile?

  -- Context
  progress_at_unlock JSONB DEFAULT '{}',

  UNIQUE(user_id, badge_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Achievement details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- activity, social, skill, exploration, mastery

  -- Difficulty
  difficulty VARCHAR(20) DEFAULT 'easy', -- easy, medium, hard, extreme

  -- Requirements
  requirement_type VARCHAR(50) NOT NULL, -- count, streak, milestone, custom
  requirement_target INTEGER,
  requirement_config JSONB DEFAULT '{}',

  -- Rewards
  points_reward INTEGER DEFAULT 0,
  badge_id UUID REFERENCES badges(id),

  -- Progress tracking
  track_progress BOOLEAN DEFAULT TRUE,

  -- Visibility
  enabled BOOLEAN DEFAULT TRUE,
  is_repeatable BOOLEAN DEFAULT FALSE,

  -- Stats
  total_completed INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

  -- Progress
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,

  -- Status
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, claimed

  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  progress_data JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

-- Create challenges table (time-limited achievements)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Challenge details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(50), -- daily, weekly, monthly, special_event

  -- Requirements
  requirement_type VARCHAR(50) NOT NULL,
  requirement_target INTEGER,
  requirement_config JSONB DEFAULT '{}',

  -- Duration
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Rewards
  points_reward INTEGER DEFAULT 0,
  badge_id UUID REFERENCES badges(id),
  additional_rewards JSONB DEFAULT '{}',

  -- Status
  enabled BOOLEAN DEFAULT TRUE,

  -- Stats
  total_participants INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,

  -- Progress
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, completed, failed, expired

  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  progress_data JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, challenge_id)
);

-- Create user_stats table for tracking various statistics
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity stats
  total_meetings_joined INTEGER DEFAULT 0,
  total_meetings_hosted INTEGER DEFAULT 0,
  total_meetings_completed INTEGER DEFAULT 0,

  -- Social stats
  total_posts_created INTEGER DEFAULT 0,
  total_comments_created INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  total_friends INTEGER DEFAULT 0,

  -- Engagement stats
  total_reviews_written INTEGER DEFAULT 0,
  total_gyms_visited INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,

  -- Streak stats
  current_login_streak INTEGER DEFAULT 0,
  longest_login_streak INTEGER DEFAULT 0,
  current_activity_streak INTEGER DEFAULT 0,
  longest_activity_streak INTEGER DEFAULT 0,

  -- Time stats
  total_playtime_hours DECIMAL(10,2) DEFAULT 0.00,
  avg_session_duration_minutes INTEGER DEFAULT 0,

  -- Geographic stats
  unique_regions_visited INTEGER DEFAULT 0,
  unique_gyms_visited INTEGER DEFAULT 0,

  -- Last activity
  last_login_date DATE,
  last_activity_date DATE,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_enabled ON badges(enabled);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_displayed ON user_badges(is_displayed);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_enabled ON achievements(enabled);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_status ON user_achievements(status);

CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- badges
CREATE POLICY "Anyone can view enabled badges"
  ON badges FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage badges"
  ON badges FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- user_badges
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view displayed badges"
  ON user_badges FOR SELECT
  USING (is_displayed = true);

CREATE POLICY "System can award badges"
  ON user_badges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their badge display settings"
  ON user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- achievements
CREATE POLICY "Anyone can view enabled achievements"
  ON achievements FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage achievements"
  ON achievements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update user achievements"
  ON user_achievements FOR UPDATE
  USING (true);

-- challenges
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (
    enabled = true AND
    NOW() BETWEEN starts_at AND ends_at
  );

CREATE POLICY "Admins can manage challenges"
  ON challenges FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- user_challenges
CREATE POLICY "Users can view their own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update user challenges"
  ON user_challenges FOR UPDATE
  USING (true);

-- user_stats
CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public stats"
  ON user_stats FOR SELECT
  USING (true);

CREATE POLICY "System can update user stats"
  ON user_stats FOR ALL
  USING (true);

-- Function to award badge
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_points_reward INTEGER;
  v_badge_exists BOOLEAN;
BEGIN
  -- Check if badge exists and is enabled
  SELECT enabled, points_reward
  INTO v_badge_exists, v_points_reward
  FROM badges
  WHERE id = p_badge_id;

  IF NOT v_badge_exists THEN
    RETURN FALSE;
  END IF;

  -- Check if user already has this badge
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN FALSE;
  END IF;

  -- Award badge
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id);

  -- Update badge stats
  UPDATE badges
  SET total_unlocked = total_unlocked + 1
  WHERE id = p_badge_id;

  -- Award points if applicable
  IF v_points_reward > 0 THEN
    PERFORM award_points(p_user_id, 'achievement_unlock', p_badge_id, 'Badge unlocked: ' || (SELECT name FROM badges WHERE id = p_badge_id));
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress(
  p_user_id UUID,
  p_achievement_id UUID,
  p_progress_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_target INTEGER;
  v_new_progress INTEGER;
  v_completed BOOLEAN := FALSE;
BEGIN
  -- Get or create user achievement
  INSERT INTO user_achievements (user_id, achievement_id, target_progress)
  SELECT p_user_id, p_achievement_id, requirement_target
  FROM achievements
  WHERE id = p_achievement_id
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  -- Update progress
  UPDATE user_achievements
  SET
    current_progress = current_progress + p_progress_increment,
    progress_percentage = LEAST(((current_progress + p_progress_increment)::DECIMAL / target_progress::DECIMAL) * 100, 100),
    updated_at = NOW()
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  RETURNING current_progress >= target_progress, target_progress, current_progress + p_progress_increment
  INTO v_completed, v_target, v_new_progress;

  -- If completed, mark as completed and award badge if applicable
  IF v_completed AND v_new_progress = v_target THEN
    UPDATE user_achievements
    SET
      status = 'completed',
      completed_at = NOW()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;

    -- Update achievement stats
    UPDATE achievements
    SET total_completed = total_completed + 1
    WHERE id = p_achievement_id;

    -- Award badge if linked
    PERFORM award_badge(p_user_id, badge_id)
    FROM achievements
    WHERE id = p_achievement_id AND badge_id IS NOT NULL;

    -- Award points
    PERFORM award_points(
      p_user_id,
      'achievement_unlock',
      p_achievement_id,
      'Achievement completed: ' || (SELECT name FROM achievements WHERE id = p_achievement_id)
    );
  END IF;

  RETURN v_completed;
END;
$$ LANGUAGE plpgsql;

-- Insert default badges
INSERT INTO badges (name, description, category, icon_url, color, rarity, unlock_type, criteria, points_reward) VALUES
  ('🏅 Newcomer', 'Welcome to the community!', 'milestone', NULL, 'blue', 'common', 'auto', '{"type": "signup"}', 0),
  ('🏸 First Match', 'Played your first match', 'milestone', NULL, 'green', 'common', 'achievement', '{"achievement": "first_meeting"}', 50),
  ('⭐ Regular Player', 'Joined 10 meetings', 'milestone', NULL, 'yellow', 'rare', 'achievement', '{"achievement": "meetings_10"}', 100),
  ('👑 Veteran', 'Joined 50 meetings', 'milestone', NULL, 'purple', 'epic', 'achievement', '{"achievement": "meetings_50"}', 200),
  ('💎 Legend', 'Joined 100 meetings', 'milestone', NULL, 'diamond', 'legendary', 'achievement', '{"achievement": "meetings_100"}', 500),
  ('📝 Blogger', 'Created 10 posts', 'achievement', NULL, 'orange', 'rare', 'achievement', '{"achievement": "posts_10"}', 100),
  ('💬 Socialite', 'Posted 100 comments', 'achievement', NULL, 'pink', 'rare', 'achievement', '{"achievement": "comments_100"}', 100),
  ('🎯 Sharpshooter', '70% win rate with 20+ games', 'achievement', NULL, 'red', 'epic', 'achievement', '{"achievement": "win_rate_70"}', 300),
  ('🔥 On Fire', '7-day login streak', 'achievement', NULL, 'orange', 'rare', 'achievement', '{"achievement": "streak_7"}', 100),
  ('⚡ Unstoppable', '30-day login streak', 'achievement', NULL, 'gold', 'epic', 'achievement', '{"achievement": "streak_30"}', 500),
  ('🌟 Rising Star', 'Reached 1600 ELO', 'achievement', NULL, 'cyan', 'rare', 'auto', '{"type": "elo", "value": 1600}', 200),
  ('🏆 Champion', 'Reached 1800 ELO', 'achievement', NULL, 'gold', 'epic', 'auto', '{"type": "elo", "value": 1800}', 500),
  ('👥 Connector', 'Referred 5 friends', 'social', NULL, 'purple', 'rare', 'achievement', '{"achievement": "referrals_5"}', 250),
  ('🎁 Premium Supporter', 'Subscribed to Premium', 'premium', NULL, 'gold', 'epic', 'auto', '{"type": "subscription"}', 0),
  ('🌈 Profile Perfect', 'Completed profile 100%', 'milestone', NULL, 'rainbow', 'common', 'auto', '{"type": "profile_complete"}', 50)
ON CONFLICT DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (name, description, category, requirement_type, requirement_target, points_reward, difficulty) VALUES
  ('First Steps', 'Join your first meeting', 'activity', 'count', 1, 100, 'easy'),
  ('Getting Started', 'Join 5 meetings', 'activity', 'count', 5, 50, 'easy'),
  ('Regular Player', 'Join 10 meetings', 'activity', 'count', 10, 100, 'medium'),
  ('Dedicated Player', 'Join 25 meetings', 'activity', 'count', 25, 200, 'medium'),
  ('Veteran', 'Join 50 meetings', 'activity', 'count', 50, 300, 'hard'),
  ('Legend', 'Join 100 meetings', 'activity', 'count', 100, 500, 'extreme'),

  ('First Post', 'Create your first post', 'social', 'count', 1, 10, 'easy'),
  ('Content Creator', 'Create 10 posts', 'social', 'count', 10, 100, 'medium'),
  ('Prolific Writer', 'Create 50 posts', 'social', 'count', 50, 300, 'hard'),

  ('Commentator', 'Post 10 comments', 'social', 'count', 10, 50, 'easy'),
  ('Discussion Master', 'Post 100 comments', 'social', 'count', 100, 200, 'medium'),

  ('First Win', 'Win your first match', 'skill', 'count', 1, 150, 'easy'),
  ('Winning Streak', 'Win 5 matches in a row', 'skill', 'streak', 5, 300, 'hard'),
  ('Dominant', 'Achieve 70% win rate (min 20 games)', 'skill', 'custom', 20, 500, 'extreme'),

  ('Week Warrior', '7-day activity streak', 'activity', 'streak', 7, 100, 'medium'),
  ('Month Master', '30-day activity streak', 'activity', 'streak', 30, 500, 'hard'),

  ('Explorer', 'Visit 5 different gyms', 'exploration', 'count', 5, 100, 'medium'),
  ('Gym Enthusiast', 'Review 10 gyms', 'exploration', 'count', 10, 200, 'medium'),

  ('Social Butterfly', 'Add 10 friends', 'social', 'count', 10, 100, 'easy'),
  ('Networker', 'Add 50 friends', 'social', 'count', 50, 300, 'hard'),

  ('Referral Master', 'Refer 5 friends', 'social', 'count', 5, 500, 'hard')
ON CONFLICT DO NOTHING;

-- Create user stats for all existing users
INSERT INTO user_stats (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
