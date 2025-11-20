# Screenshot Upload Feature - Setup Guide

## ✅ What's Been Implemented

### 1. Frontend Components Updated

**FeedbackModal.tsx** (`/components/FeedbackModal.tsx`)
- Added screenshot file upload with drag & drop UI
- Image preview before submission
- File validation (image types only, 5MB max)
- Remove screenshot button
- Integrated Supabase Storage upload
- Made feedback message optional (can submit ratings/screenshot only)

**Admin Feedback Page** (`/app/admin/feedback/page.tsx`)
- Added screenshot display in feedback items
- Click to view full-size in new tab
- Added `screenshot_url` to FeedbackItem interface

### 2. Database Migration Created

**File**: `/supabase/migrations/20251120000000_add_feedback_ratings_and_screenshots.sql`

This migration:
- Makes `message` column nullable
- Adds 4 rating columns (rating_overall, rating_coach_quality, rating_ease_of_use, rating_feature_value)
- Adds `screenshot_url` column
- Creates indexes for better performance
- Adds column comments for documentation

### 3. Storage Setup Instructions Created

**File**: `/supabase/storage-setup-instructions.md`

Complete guide for setting up the Supabase Storage bucket.

---

## 🚀 Next Steps (Required)

### Step 1: Run the Database Migration

Go to your Supabase Dashboard → SQL Editor and run:

```sql
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
```

### Step 2: Create Storage Bucket

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Storage** in left sidebar
2. Click **Create a new bucket**
3. Configure:
   - Name: `feedback-screenshots`
   - Public bucket: ✅ **Yes**
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`

#### Option B: Via SQL Editor

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Set Storage Policies

Run in SQL Editor:

```sql
-- Allow authenticated users to upload screenshots
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback-screenshots');

-- Allow public read access
CREATE POLICY "Public read access to feedback screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feedback-screenshots');
```

---

## 🧪 Testing the Feature

1. Open your app and click the feedback button
2. Fill out the rating sliders (or leave them blank)
3. Click "Click to upload image" in the screenshot section
4. Select an image (PNG/JPG, under 5MB)
5. Preview should appear with a red X button to remove
6. Submit the feedback
7. Go to `/admin/feedback` to view the submission with screenshot

---

## 📋 Feature Capabilities

Users can now submit feedback in 3 ways:
1. **Ratings only** - Quick 1-10 ratings without typing
2. **Screenshot only** - Visual bug reports without explanation
3. **Full feedback** - Ratings + message + screenshot combined
4. **Any combination** - Mix and match as needed

All fields are optional, but at least one must be provided (ratings, message, or screenshot).

---

## 🔒 Security Features

- ✅ Only authenticated users can upload screenshots
- ✅ File type validation (images only)
- ✅ File size limit (5MB max)
- ✅ Filenames include user ID for organization: `{userId}-{timestamp}.{ext}`
- ✅ Public bucket for admin viewing (no sensitive data in screenshots)
- ✅ Admin pages locked to authorized emails only

---

## 📁 Files Modified

1. `/components/FeedbackModal.tsx` - Added upload UI and logic
2. `/app/admin/feedback/page.tsx` - Added screenshot display
3. `/supabase/migrations/20251120000000_add_feedback_ratings_and_screenshots.sql` - New migration
4. `/supabase/storage-setup-instructions.md` - Setup guide

---

## ❓ Troubleshooting

**Screenshots not uploading?**
- Check that the `feedback-screenshots` bucket exists
- Verify bucket is set to public
- Check storage policies are active

**Can't view screenshots in admin?**
- Ensure public read policy is enabled
- Check the screenshot_url is stored in database
- Verify the URL is accessible (try opening in browser)

**File too large error?**
- Current limit is 5MB (enforced client-side)
- To change: update validation in `FeedbackModal.tsx` line 42

---

## 🎉 You're All Set!

Once you've completed Steps 1-3 above, the screenshot upload feature will be fully functional.
