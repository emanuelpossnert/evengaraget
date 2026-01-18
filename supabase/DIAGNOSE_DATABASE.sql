-- ============================================
-- SUPABASE DATABASE DIAGNOSTIC
-- ============================================
-- Kör denna query för att se alla tabeller och deras kolumner

-- 1. LISTA ALLA TABELLER
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- 2. DETALJER OM BOOKING_CONFIRMATIONS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'booking_confirmations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. DETALJER OM OUTGOING_EMAILS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'outgoing_emails'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. DETALJER OM WEBHOOK_LOGS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'webhook_logs'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. ALLA TRIGGERS
SELECT 
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. ANTAL RADER I VARJE WEBHOOK-TABELL
SELECT 'booking_confirmations' as table_name, COUNT(*) as row_count FROM booking_confirmations
UNION ALL
SELECT 'outgoing_emails', COUNT(*) FROM outgoing_emails
UNION ALL
SELECT 'webhook_logs', COUNT(*) FROM webhook_logs;

-- 7. SENASTE WEBHOOK LOG-ENTRIES (för debugging)
SELECT 
  id,
  webhook_name,
  event_type,
  created_at,
  success,
  data,
  error_message
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;

-- 8. OUTGOING EMAILS STATUS
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM outgoing_emails
GROUP BY status
ORDER BY count DESC;

-- 9. BOOKING CONFIRMATIONS STATUS
SELECT 
  email_sent,
  COUNT(*) as count
FROM booking_confirmations
GROUP BY email_sent;

-- 10. KOLLA BOOKINGS TABELLEN
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
AND table_schema = 'public'
ORDER BY ordinal_position;

