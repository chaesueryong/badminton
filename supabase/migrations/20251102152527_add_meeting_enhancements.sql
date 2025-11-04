-- Add meeting images, tags, and enhanced features

-- Add image fields to meetings table
ALTER TABLE meetings
  ADD COLUMN "thumbnailImage" TEXT,
  ADD COLUMN "images" TEXT[],
  ADD COLUMN "tags" TEXT[],
  ADD COLUMN "isRegular" BOOLEAN DEFAULT false,
  ADD COLUMN "regularSchedule" TEXT,
  ADD COLUMN "categoryType" TEXT CHECK ("categoryType" IN ('REGULAR', 'ONE_TIME', 'TOURNAMENT', 'LESSON', 'SOCIAL')),
  ADD COLUMN "requiredGender" TEXT CHECK ("requiredGender" IN ('MALE', 'FEMALE', 'ANY')),
  ADD COLUMN "ageMin" INTEGER,
  ADD COLUMN "ageMax" INTEGER,
  ADD COLUMN "chatRoomId" TEXT,
  ADD COLUMN "views" INTEGER DEFAULT 0;

-- Create meeting_tags table for better tag management
CREATE TABLE IF NOT EXISTS meeting_tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  "usageCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create meeting_images table
CREATE TABLE IF NOT EXISTS meeting_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "meetingId" TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  "imageUrl" TEXT NOT NULL,
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create meeting_views table for tracking views
CREATE TABLE IF NOT EXISTS meeting_views (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "meetingId" TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  "viewedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("meetingId", "userId")
);

-- Add waiting list support
ALTER TABLE meeting_participants
  ADD COLUMN "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "isWaitingList" BOOLEAN DEFAULT false,
  ADD COLUMN "waitingOrder" INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_region ON meetings(region);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_category ON meetings("categoryType");
CREATE INDEX IF NOT EXISTS idx_meeting_views_meeting ON meeting_views("meetingId");
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants("meetingId");
CREATE INDEX IF NOT EXISTS idx_meeting_participants_waiting ON meeting_participants("isWaitingList");
