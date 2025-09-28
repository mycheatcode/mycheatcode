-- Add position field and migrate from role field

-- Add the new position column
ALTER TABLE waitlist_signups
ADD COLUMN IF NOT EXISTS position TEXT;

-- Migrate existing role data to position (set all to Point Guard as default)
UPDATE waitlist_signups
SET position = 'Point Guard'
WHERE position IS NULL;

-- Make position required (NOT NULL)
ALTER TABLE waitlist_signups
ALTER COLUMN position SET NOT NULL;

-- Optional: Drop the old role column after migration (uncomment if you want to remove it)
-- ALTER TABLE waitlist_signups DROP COLUMN IF EXISTS role;