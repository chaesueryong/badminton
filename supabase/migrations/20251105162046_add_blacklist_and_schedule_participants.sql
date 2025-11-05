-- Create meeting_blacklist table
CREATE TABLE IF NOT EXISTS meeting_blacklist (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "meetingId" TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  "blacklistedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "blacklistedBy" TEXT NOT NULL REFERENCES users(id),
  UNIQUE("meetingId", "userId")
);

-- Create schedule_participants table
CREATE TABLE IF NOT EXISTS schedule_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "scheduleId" TEXT NOT NULL REFERENCES meeting_schedules(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("scheduleId", "userId")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_blacklist_meeting ON meeting_blacklist("meetingId");
CREATE INDEX IF NOT EXISTS idx_blacklist_user ON meeting_blacklist("userId");
CREATE INDEX IF NOT EXISTS idx_schedule_participants_schedule ON schedule_participants("scheduleId");
CREATE INDEX IF NOT EXISTS idx_schedule_participants_user ON schedule_participants("userId");

-- Add RLS policies
ALTER TABLE meeting_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_participants ENABLE ROW LEVEL SECURITY;

-- Blacklist policies
CREATE POLICY "Anyone can view blacklist for their meetings"
  ON meeting_blacklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_blacklist."meetingId"
      AND (m."hostId" = auth.uid() OR EXISTS (
        SELECT 1 FROM meeting_participants mp
        WHERE mp."meetingId" = m.id
        AND mp."userId" = auth.uid()
        AND mp.role = 'MANAGER'
      ))
    )
  );

CREATE POLICY "Only hosts and managers can add to blacklist"
  ON meeting_blacklist FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_blacklist."meetingId"
      AND (m."hostId" = auth.uid() OR EXISTS (
        SELECT 1 FROM meeting_participants mp
        WHERE mp."meetingId" = m.id
        AND mp."userId" = auth.uid()
        AND mp.role = 'MANAGER'
      ))
    )
  );

CREATE POLICY "Only hosts and managers can remove from blacklist"
  ON meeting_blacklist FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_blacklist."meetingId"
      AND (m."hostId" = auth.uid() OR EXISTS (
        SELECT 1 FROM meeting_participants mp
        WHERE mp."meetingId" = m.id
        AND mp."userId" = auth.uid()
        AND mp.role = 'MANAGER'
      ))
    )
  );

-- Schedule participants policies
CREATE POLICY "Anyone can view schedule participants"
  ON schedule_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join schedules"
  ON schedule_participants FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can leave their own schedules"
  ON schedule_participants FOR DELETE
  USING (auth.uid() = "userId");

-- Function to check if user is blacklisted
CREATE OR REPLACE FUNCTION is_user_blacklisted(p_meeting_id TEXT, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM meeting_blacklist
    WHERE "meetingId" = p_meeting_id
    AND "userId" = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
