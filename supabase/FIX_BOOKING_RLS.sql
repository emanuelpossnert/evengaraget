-- Fix RLS Policies for Booking Confirmation System
-- This allows CRM to confirm bookings and create tokens

-- 1. Enable RLS on bookings (if not already)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 2. Allow UPDATE status on bookings for authenticated users
DROP POLICY IF EXISTS "Allow UPDATE status for authenticated" ON bookings;
CREATE POLICY "Allow UPDATE status for authenticated"
  ON bookings
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Enable RLS on booking_tokens
ALTER TABLE booking_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Allow INSERT on booking_tokens for authenticated users
DROP POLICY IF EXISTS "Allow INSERT booking_tokens for authenticated" ON booking_tokens;
CREATE POLICY "Allow INSERT booking_tokens for authenticated"
  ON booking_tokens
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Allow SELECT on booking_tokens for authenticated users
DROP POLICY IF EXISTS "Allow SELECT booking_tokens for authenticated" ON booking_tokens;
CREATE POLICY "Allow SELECT booking_tokens for authenticated"
  ON booking_tokens
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. Enable RLS on booking_confirmations
ALTER TABLE booking_confirmations ENABLE ROW LEVEL SECURITY;

-- 7. Allow INSERT on booking_confirmations for authenticated users
DROP POLICY IF EXISTS "Allow INSERT booking_confirmations for authenticated" ON booking_confirmations;
CREATE POLICY "Allow INSERT booking_confirmations for authenticated"
  ON booking_confirmations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 8. Allow SELECT on booking_confirmations for authenticated users
DROP POLICY IF EXISTS "Allow SELECT booking_confirmations for authenticated" ON booking_confirmations;
CREATE POLICY "Allow SELECT booking_confirmations for authenticated"
  ON booking_confirmations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 9. Allow SELECT on bookings for authenticated users
DROP POLICY IF EXISTS "Allow SELECT bookings for authenticated" ON bookings;
CREATE POLICY "Allow SELECT bookings for authenticated"
  ON bookings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verify policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('bookings', 'booking_tokens', 'booking_confirmations')
ORDER BY tablename, policyname;
