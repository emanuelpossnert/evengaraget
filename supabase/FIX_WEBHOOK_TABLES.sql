-- ============================================
-- FIX WEBHOOK TABLES - CLEAN SETUP
-- ============================================

-- 1. DROP EXISTING TRIGGERS FIRST (avoid errors)
DROP TRIGGER IF EXISTS trg_booking_confirmation ON bookings;
DROP TRIGGER IF EXISTS trg_email_sent ON outgoing_emails;

-- 2. DROP EXISTING FUNCTIONS
DROP FUNCTION IF EXISTS trigger_booking_confirmation_webhook();
DROP FUNCTION IF EXISTS trigger_email_sent_webhook();
DROP FUNCTION IF EXISTS log_webhook_call(VARCHAR, VARCHAR, JSONB);

-- 3. DROP EXISTING TABLES
DROP TABLE IF EXISTS webhook_logs;
DROP TABLE IF EXISTS outgoing_emails;
DROP TABLE IF EXISTS booking_confirmations;

-- ============================================
-- CREATE CLEAN TABLES
-- ============================================

-- BOOKING_CONFIRMATIONS TABLE
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
CREATE POLICY "Enable read for authenticated users" ON booking_confirmations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable full access for service role" ON booking_confirmations FOR ALL TO service_role USING (true);

-- OUTGOING_EMAILS TABLE
CREATE TABLE public.outgoing_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT,
  body_plain TEXT,
  email_type VARCHAR(50), -- 'booking_confirmation', 'custom_message', 'reminder'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  n8n_webhook_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
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
CREATE POLICY "Enable read for authenticated users" ON outgoing_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable full access for service role" ON outgoing_emails FOR ALL TO service_role USING (true);

-- WEBHOOK_LOGS TABLE (for debugging)
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50), -- 'booking_confirmed', 'email_sent', 'booking_updated'
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
CREATE POLICY "Enable read for authenticated users" ON webhook_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable full access for service role" ON webhook_logs FOR ALL TO service_role USING (true);

-- ============================================
-- CREATE TRIGGER FUNCTIONS
-- ============================================

-- Function to log webhooks
CREATE OR REPLACE FUNCTION log_webhook_call(
  p_webhook_name VARCHAR,
  p_event_type VARCHAR,
  p_data JSONB
) RETURNS void AS $$
BEGIN
  INSERT INTO webhook_logs (webhook_name, event_type, data)
  VALUES (p_webhook_name, p_event_type, p_data);
END;
$$ LANGUAGE plpgsql;

-- Function to call n8n webhook when booking is confirmed
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
    ON CONFLICT (booking_id) DO NOTHING;

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

-- Function to log when email is sent from customer card
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
-- CREATE TRIGGERS
-- ============================================

-- Trigger for booking confirmation
CREATE TRIGGER trg_booking_confirmation
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_booking_confirmation_webhook();

-- Trigger for email sent
CREATE TRIGGER trg_email_sent
AFTER INSERT ON outgoing_emails
FOR EACH ROW
EXECUTE FUNCTION trigger_email_sent_webhook();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'WEBHOOK TABLES SETUP COMPLETE!' as status;

-- Check tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('booking_confirmations', 'outgoing_emails', 'webhook_logs')
AND table_schema = 'public';

-- Check triggers exist
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trg_booking_confirmation', 'trg_email_sent')
AND trigger_schema = 'public';

