-- Add confirmation tracking fields to waitlist_signups table

ALTER TABLE waitlist_signups
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to have last_email_sent
UPDATE waitlist_signups
SET last_email_sent = created_at
WHERE last_email_sent IS NULL;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_status ON waitlist_signups(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_confirmed_at ON waitlist_signups(confirmed_at);