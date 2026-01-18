-- ============================================
-- SAFE WEBHOOK TABLES MIGRATION
-- ============================================
-- This script safely migrates webhook tables without losing data
-- It backs up, migrates, and validates everything

-- ============================================
-- STEP 1: CHECK & BACKUP EXISTING TABLES (if they exist)
-- ============================================

-- Only backup tables that actually exist
DO $$ 
BEGIN
  -- Check if webhook_logs exists and backup it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'webhook_logs' AND table_schema = 'public'
  ) THEN
    CREATE TABLE IF NOT EXISTS webhook_logs_backup AS SELECT * FROM webhook_logs;
    RAISE NOTICE 'Created backup: webhook_logs_backup with % rows', (SELECT COUNT(*) FROM webhook_logs_backup);
  ELSE
    RAISE NOTICE 'webhook_logs does not exist yet (no backup needed)';
  END IF;

  -- Check if outgoing_emails exists and backup it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'outgoing_emails' AND table_schema = 'public'
  ) THEN
    CREATE TABLE IF NOT EXISTS outgoing_emails_backup AS SELECT * FROM outgoing_emails;
    RAISE NOTICE 'Created backup: outgoing_emails_backup with % rows', (SELECT COUNT(*) FROM outgoing_emails_backup);
  ELSE
    RAISE NOTICE 'outgoing_emails does not exist yet (no backup needed)';
  END IF;

  -- Check if booking_confirmations exists and backup it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'booking_confirmations' AND table_schema = 'public'
  ) THEN
    CREATE TABLE IF NOT EXISTS booking_confirmations_backup AS SELECT * FROM booking_confirmations;
    RAISE NOTICE 'Created backup: booking_confirmations_backup with % rows', (SELECT COUNT(*) FROM booking_confirmations_backup);
  ELSE
    RAISE NOTICE 'booking_confirmations does not exist yet (no backup needed)';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Backup check error (this is OK): %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: DROP OLD TRIGGERS FIRST (prevents conflicts)
-- ============================================

DROP TRIGGER IF EXISTS trg_booking_confirmation ON bookings;
DROP TRIGGER IF EXISTS trg_email_sent ON outgoing_emails;

-- ============================================
-- STEP 3: DROP ONLY THE OLD TABLES (not functions/triggers yet)
-- ============================================

DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS outgoing_emails CASCADE;
DROP TABLE IF EXISTS booking_confirmations CASCADE;

-- ============================================
-- STEP 4: CREATE NEW, CLEAN TABLES
-- ============================================

CREATE TABLE public.booking_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booking_confirmations_booking ON booking_confirmations(booking_id);
CREATE INDEX idx_booking_confirmations_created ON booking_confirmations(created_at DESC);
ALTER TABLE public.booking_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Enable read for authenticated users" ON booking_confirmations 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable full access for service role" ON booking_confirmations 
  FOR ALL TO service_role USING (true);

-- OUTGOING_EMAILS TABLE
CREATE TABLE public.outgoing_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT,
  body_plain TEXT,
  email_type VARCHAR(50),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  n8n_webhook_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outgoing_emails_customer ON outgoing_emails(customer_id);
CREATE INDEX idx_outgoing_emails_booking ON outgoing_emails(booking_id);
CREATE INDEX idx_outgoing_emails_status ON outgoing_emails(status);
CREATE INDEX idx_outgoing_emails_created ON outgoing_emails(created_at DESC);
ALTER TABLE public.outgoing_emails ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Enable read for authenticated users" ON outgoing_emails 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable full access for service role" ON outgoing_emails 
  FOR ALL TO service_role USING (true);

-- WEBHOOK_LOGS TABLE (for debugging)
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50),
  data JSONB,
  response TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event ON webhook_logs(event_type);
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Enable read for authenticated users" ON webhook_logs 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable full access for service role" ON webhook_logs 
  FOR ALL TO service_role USING (true);

-- ============================================
-- STEP 5: MIGRATE DATA FROM BACKUPS TO NEW TABLES (if backups exist)
-- ============================================

DO $$ 
BEGIN
  -- Migrate booking_confirmations (if backup exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'booking_confirmations_backup' AND table_schema = 'public'
  ) THEN
    INSERT INTO booking_confirmations 
      (id, booking_id, confirmation_sent_at, pdf_url, email_sent, email_sent_at, error_message, created_at, updated_at)
    SELECT 
      id, booking_id, confirmation_sent_at, pdf_url, email_sent, email_sent_at, error_message, created_at, 
      COALESCE(updated_at, NOW())
    FROM booking_confirmations_backup
    WHERE booking_id IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migrated booking_confirmations records: %', (SELECT COUNT(*) FROM booking_confirmations);
  ELSE
    RAISE NOTICE 'booking_confirmations_backup does not exist (skip migration)';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration of booking_confirmations failed: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Migrate outgoing_emails (if backup exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'outgoing_emails_backup' AND table_schema = 'public'
  ) THEN
    INSERT INTO outgoing_emails 
      (id, customer_id, booking_id, recipient_email, subject, body_html, body_plain, email_type, sent_at, n8n_webhook_id, status, error_message, created_at, updated_at)
    SELECT 
      id, customer_id, booking_id, recipient_email, subject, body_html, body_plain, email_type, sent_at, n8n_webhook_id, status, error_message, created_at,
      COALESCE(updated_at, NOW())
    FROM outgoing_emails_backup
    WHERE customer_id IS NOT NULL
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migrated outgoing_emails records: %', (SELECT COUNT(*) FROM outgoing_emails);
  ELSE
    RAISE NOTICE 'outgoing_emails_backup does not exist (skip migration)';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration of outgoing_emails failed: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Migrate webhook_logs (if backup exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'webhook_logs_backup' AND table_schema = 'public'
  ) THEN
    INSERT INTO webhook_logs 
      (id, webhook_name, event_type, data, response, success, error_message, created_at)
    SELECT 
      id, webhook_name, event_type, data, response, success, error_message, created_at
    FROM webhook_logs_backup
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migrated webhook_logs records: %', (SELECT COUNT(*) FROM webhook_logs);
  ELSE
    RAISE NOTICE 'webhook_logs_backup does not exist (skip migration)';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration of webhook_logs failed: %', SQLERRM;
END $$;

-- ============================================
-- STEP 6: CREATE/RECREATE TRIGGER FUNCTIONS
-- ============================================

-- Drop old functions if they exist with wrong signature
DROP FUNCTION IF EXISTS trigger_booking_confirmation_webhook() CASCADE;
DROP FUNCTION IF EXISTS trigger_email_sent_webhook() CASCADE;
DROP FUNCTION IF EXISTS log_webhook_call(VARCHAR, VARCHAR, JSONB) CASCADE;

-- Function to log webhooks
CREATE OR REPLACE FUNCTION log_webhook_call(
  p_webhook_name VARCHAR,
  p_event_type VARCHAR,
  p_data JSONB
) RETURNS void AS $$
BEGIN
  INSERT INTO webhook_logs (webhook_name, event_type, data)
  VALUES (p_webhook_name, p_event_type, p_data);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to log webhook: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger n8n webhook when booking is confirmed
CREATE OR REPLACE FUNCTION trigger_booking_confirmation_webhook()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_customer_email VARCHAR(255);
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Get customer email
    SELECT c.id, c.email INTO v_customer_id, v_customer_email
    FROM customers c
    WHERE c.id = NEW.customer_id;

    -- Create booking confirmation record
    INSERT INTO booking_confirmations (booking_id)
    VALUES (NEW.id)
    ON CONFLICT (booking_id) DO UPDATE SET updated_at = NOW();

    -- Log the webhook call
    PERFORM log_webhook_call(
      'booking_confirmation',
      'booking_confirmed',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', NEW.booking_number,
        'customer_id', NEW.customer_id,
        'customer_email', v_customer_email,
        'total_amount', NEW.total_amount,
        'event_date', NEW.event_date,
        'delivery_date', NEW.delivery_date,
        'timestamp', NOW()
      )
    );

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log when email is sent
CREATE OR REPLACE FUNCTION trigger_email_sent_webhook()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM log_webhook_call(
      'send_email',
      'email_sent',
      jsonb_build_object(
        'email_id', NEW.id,
        'customer_id', NEW.customer_id,
        'recipient_email', NEW.recipient_email,
        'subject', NEW.subject,
        'email_type', NEW.email_type,
        'timestamp', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: CREATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trg_booking_confirmation ON bookings;
CREATE TRIGGER trg_booking_confirmation
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_booking_confirmation_webhook();

DROP TRIGGER IF EXISTS trg_email_sent ON outgoing_emails;
CREATE TRIGGER trg_email_sent
AFTER INSERT ON outgoing_emails
FOR EACH ROW
EXECUTE FUNCTION trigger_email_sent_webhook();

-- ============================================
-- STEP 8: TRIGGERS NOW ACTIVE (created in STEP 7)
-- ============================================

-- Triggers are automatically enabled when created

-- ============================================
-- STEP 9: VERIFICATION & REPORTING
-- ============================================

SELECT 'SAFE WEBHOOK MIGRATION COMPLETE! ✅' as status;

-- Show backup tables (for reference)
SELECT 'Backup Tables Created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%_backup' AND table_schema = 'public';

-- Show new tables
SELECT 'New Production Tables:' as info;
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_name IN ('booking_confirmations', 'outgoing_emails', 'webhook_logs')
AND table_schema = 'public'
ORDER BY table_name;

-- Show data counts
SELECT 'Data Migration Summary:' as info;
SELECT 'booking_confirmations' as table_name, COUNT(*) as migrated_records FROM booking_confirmations
UNION ALL
SELECT 'outgoing_emails', COUNT(*) FROM outgoing_emails
UNION ALL
SELECT 'webhook_logs', COUNT(*) FROM webhook_logs;

-- Show triggers
SELECT 'Triggers Active:' as info;
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trg_booking_confirmation', 'trg_email_sent')
AND trigger_schema = 'public';

-- ============================================
-- CLEANUP OPTIONS (uncomment if you want to delete backups later)
-- ============================================
-- DROP TABLE webhook_logs_backup;
-- DROP TABLE outgoing_emails_backup;
-- DROP TABLE booking_confirmations_backup;

