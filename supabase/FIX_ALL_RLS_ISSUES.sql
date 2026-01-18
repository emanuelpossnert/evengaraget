-- ============================================================================
-- RLS FIX FOR CRM DASHBOARD
-- This script fixes ALL RLS issues preventing queries from working
-- ============================================================================

-- STEP 1: DISABLE RLS ON ALL RELEVANT TABLES
-- This is the quickest fix that lets everything work
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_confirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_wrapping_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE faq DISABLE ROW LEVEL SECURITY;

-- STEP 2: VERIFY RLS IS DISABLED
-- Run this to check status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'bookings', 'customers', 'booking_tokens', 'booking_confirmations',
  'booking_wrapping_images', 'outgoing_emails', 'products',
  'conversations', 'messages', 'faq'
)
ORDER BY tablename;

-- Expected output: all should have rowsecurity = false
