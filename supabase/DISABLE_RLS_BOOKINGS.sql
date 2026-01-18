-- DISABLE RLS ON BOOKINGS TABLE
-- This allows n8n to insert bookings without RLS policy restrictions

ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Verify that RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'bookings';
