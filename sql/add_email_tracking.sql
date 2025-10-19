-- Add email tracking fields to waitlist_signups table

ALTER TABLE waitlist_signups
ADD COLUMN IF NOT EXISTS email_sent_successfully BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_error TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_send_attempts INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email_sent ON waitlist_signups(email_sent_successfully);

COMMENT ON COLUMN waitlist_signups.email_sent_successfully IS 'Whether the last email was sent successfully (NULL = never attempted, TRUE = success, FALSE = failed)';
COMMENT ON COLUMN waitlist_signups.email_error IS 'Last email error message if send failed';
COMMENT ON COLUMN waitlist_signups.email_send_attempts IS 'Number of times we attempted to send email';
