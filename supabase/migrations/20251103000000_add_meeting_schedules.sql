-- Create meeting_schedules table for regular meeting schedules
CREATE TABLE IF NOT EXISTS meeting_schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "meetingId" TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  location TEXT,
  address TEXT,
  "maxParticipants" INTEGER NOT NULL,
  "currentCount" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED')),
  fee INTEGER DEFAULT 0,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create schedule_participants table
CREATE TABLE IF NOT EXISTS schedule_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "scheduleId" TEXT NOT NULL REFERENCES meeting_schedules(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  "joinedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("scheduleId", "userId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_meeting ON meeting_schedules("meetingId");
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_date ON meeting_schedules(date);
CREATE INDEX IF NOT EXISTS idx_meeting_schedules_status ON meeting_schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedule_participants_schedule ON schedule_participants("scheduleId");
CREATE INDEX IF NOT EXISTS idx_schedule_participants_user ON schedule_participants("userId");
