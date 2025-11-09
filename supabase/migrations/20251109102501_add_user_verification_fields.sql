-- Add verification fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS verified_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS verification_ci TEXT,
ADD COLUMN IF NOT EXISTS verification_di TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for verification lookup
CREATE INDEX IF NOT EXISTS idx_users_verification_ci ON users(verification_ci);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
