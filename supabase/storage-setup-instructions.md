# Supabase Storage Setup for Feedback Screenshots

## Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `feedback-screenshots`
   - **Public bucket**: ✅ **Yes** (Enable public access so screenshots can be viewed)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/*` (or specifically: `image/png`, `image/jpeg`, `image/jpg`)

## Storage Policies

After creating the bucket, set up the following policies:

### Policy 1: Allow authenticated users to upload

```sql
-- Allow authenticated users to upload their own screenshots
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow public read access

```sql
-- Allow anyone to view screenshots (for admin viewing)
CREATE POLICY "Public read access to feedback screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feedback-screenshots');
```

### Policy 3: Allow users to delete their own screenshots (optional)

```sql
-- Allow users to delete their own screenshots if needed
CREATE POLICY "Users can delete own feedback screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Quick Setup via SQL Editor

Alternatively, run this in the Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Add upload policy
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-screenshots'
);

-- Add read policy
CREATE POLICY "Public read access to feedback screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feedback-screenshots');
```

## Verify Setup

After setup, verify:

1. Bucket `feedback-screenshots` exists
2. Public access is enabled
3. Policies are active
4. Test by submitting feedback with a screenshot

## Notes

- Screenshots are stored with filename: `{user_id}-{timestamp}.{extension}`
- Public URLs are automatically generated and stored in the `screenshot_url` column
- Max file size: 5MB (enforced in FeedbackModal.tsx)
- Accepted formats: PNG, JPG, JPEG (enforced in FeedbackModal.tsx)
