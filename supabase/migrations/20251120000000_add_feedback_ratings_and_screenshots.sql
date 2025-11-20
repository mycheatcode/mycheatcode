-- Add rating columns and screenshot support to feedback table

-- Make message nullable since users can submit just ratings or screenshots
ALTER TABLE public.feedback
  ALTER COLUMN message DROP NOT NULL;

-- Add rating columns (1-10 scale)
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS rating_overall INTEGER CHECK (rating_overall >= 1 AND rating_overall <= 10),
  ADD COLUMN IF NOT EXISTS rating_coach_quality INTEGER CHECK (rating_coach_quality >= 1 AND rating_coach_quality <= 10),
  ADD COLUMN IF NOT EXISTS rating_ease_of_use INTEGER CHECK (rating_ease_of_use >= 1 AND rating_ease_of_use <= 10),
  ADD COLUMN IF NOT EXISTS rating_feature_value INTEGER CHECK (rating_feature_value >= 1 AND rating_feature_value <= 10);

-- Add screenshot URL column
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Add indexes for better query performance on ratings
CREATE INDEX IF NOT EXISTS idx_feedback_rating_overall ON public.feedback(rating_overall) WHERE rating_overall IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_has_screenshot ON public.feedback(screenshot_url) WHERE screenshot_url IS NOT NULL;

-- Add comment to document the table changes
COMMENT ON COLUMN public.feedback.rating_overall IS 'Overall experience rating (1-10)';
COMMENT ON COLUMN public.feedback.rating_coach_quality IS 'Coach quality rating (1-10)';
COMMENT ON COLUMN public.feedback.rating_ease_of_use IS 'Ease of use rating (1-10)';
COMMENT ON COLUMN public.feedback.rating_feature_value IS 'Feature value rating (1-10)';
COMMENT ON COLUMN public.feedback.screenshot_url IS 'URL to uploaded screenshot in Supabase Storage';
