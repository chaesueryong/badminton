-- Remove unused fields from meetings table
ALTER TABLE meetings
DROP COLUMN IF EXISTS "isRegular",
DROP COLUMN IF EXISTS "regularSchedule",
DROP COLUMN IF EXISTS "categoryType",
DROP COLUMN IF EXISTS tags;
