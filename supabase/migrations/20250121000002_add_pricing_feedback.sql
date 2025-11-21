-- Add pricing feedback columns to feedback table

ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS willing_to_pay TEXT CHECK (willing_to_pay IN ('yes', 'no', 'maybe')),
ADD COLUMN IF NOT EXISTS suggested_price TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN feedback.willing_to_pay IS 'User response to whether they would pay $7.99/month: yes, no, or maybe';
COMMENT ON COLUMN feedback.suggested_price IS 'User-suggested price point if willing_to_pay is no or maybe';
