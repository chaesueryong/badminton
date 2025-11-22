-- Add onboarding_completed column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users who have nickname to have completed onboarding
UPDATE users
SET onboarding_completed = TRUE
WHERE nickname IS NOT NULL AND nickname != '';

-- Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Indicates whether the user has completed the onboarding process';