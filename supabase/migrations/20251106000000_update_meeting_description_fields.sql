-- Update meetings table to separate description and detailed info
-- description: short intro (max 100 chars) for cards
-- detailed_info: detailed information (max 2000 chars) for meeting detail page

-- Add new column for detailed info
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS detailed_info TEXT;

-- Add constraints for description length (short intro for cards)
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_description_length;
ALTER TABLE meetings ADD CONSTRAINT meetings_description_length
  CHECK (char_length(description) <= 100);

-- Add constraints for detailed info length
ALTER TABLE meetings ADD CONSTRAINT meetings_detailed_info_length
  CHECK (detailed_info IS NULL OR char_length(detailed_info) <= 2000);

-- Add comment for clarity
COMMENT ON COLUMN meetings.description IS '짧은 소개 (최대 100자, 카드에 표시)';
COMMENT ON COLUMN meetings.detailed_info IS '상세 정보 (최대 2000자, 모임 상세 페이지에만 표시)';
