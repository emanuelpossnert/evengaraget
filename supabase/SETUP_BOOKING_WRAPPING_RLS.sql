-- ============================================
-- BOOKING WRAPPING IMAGES - SUPABASE SETUP
-- ============================================

-- 1. Ensure RLS is enabled on booking_wrapping_images
ALTER TABLE booking_wrapping_images ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous to insert images" ON booking_wrapping_images;
DROP POLICY IF EXISTS "Allow all to read images" ON booking_wrapping_images;
DROP POLICY IF EXISTS "Allow all to update images" ON booking_wrapping_images;

-- 3. Create new policies (permissive for token-based access)
CREATE POLICY "Allow anonymous to insert images"
ON booking_wrapping_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all to read images"
ON booking_wrapping_images
FOR SELECT
USING (true);

CREATE POLICY "Allow all to update images"
ON booking_wrapping_images
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 4. Verify table structure
-- The table should have these columns:
-- - id (UUID, primary key)
-- - booking_id (UUID, foreign key)
-- - image_url (TEXT)
-- - file_name (VARCHAR)
-- - uploaded_by_email (VARCHAR)
-- - uploaded_at (TIMESTAMP)
-- - image_type (VARCHAR)
-- - notes (TEXT)
-- - status (VARCHAR, default: 'pending')

-- 5. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_wrapping_images_booking_id 
ON booking_wrapping_images(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_wrapping_images_status 
ON booking_wrapping_images(status);

-- 6. Verify booking_tokens table exists and has proper structure
-- The table should have:
-- - id (UUID, primary key)
-- - booking_id (UUID, foreign key)
-- - token (VARCHAR, unique)
-- - expires_at (TIMESTAMP, default: now() + 7 days)
-- - created_at (TIMESTAMP, default: now())
-- - used_at (TIMESTAMP, nullable)

CREATE INDEX IF NOT EXISTS idx_booking_tokens_token 
ON booking_tokens(token);

CREATE INDEX IF NOT EXISTS idx_booking_tokens_booking_id 
ON booking_tokens(booking_id);

-- Done!

