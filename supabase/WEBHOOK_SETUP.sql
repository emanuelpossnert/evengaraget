-- ============================================
-- WEBHOOK & NOTIFICATION SETUP
-- ============================================

-- 1. CREATE BOOKING_CONFIRMATIONS TABLE
CREATE TABLE IF NOT EXISTS public.booking_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.booking_confirmations ENABLE ROW LEVEL SECURITY;

-- 2. CREATE OUTGOING_EMAILS TABLE (for mail history)
CREATE TABLE IF NOT EXISTS public.outgoing_emails (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.outgoing_emails ENABLE ROW LEVEL SECURITY;

-- 3. WEBHOOK LOGS TABLE (for debugging)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(50), -- 'booking_confirmed', 'email_sent', 'booking_updated'
  data JSONB,
  response TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_booking_confirmations_booking ON booking_confirmations(booking_id);
CREATE INDEX idx_booking_confirmations_created ON booking_confirmations(created_at DESC);
CREATE INDEX idx_outgoing_emails_customer ON outgoing_emails(customer_id);
CREATE INDEX idx_outgoing_emails_booking ON outgoing_emails(booking_id);
CREATE INDEX idx_outgoing_emails_status ON outgoing_emails(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event ON webhook_logs(event_type);

-- ============================================
-- TRIGGERS FOR N8N WEBHOOKS
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
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Log the webhook call (in production, you'd call the actual n8n webhook)
    PERFORM log_webhook_call(
      'booking_confirmation',
      'booking_confirmed',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', NEW.booking_number,
        'customer_id', NEW.customer_id,
        'total_amount', NEW.total_amount,
        'event_date', NEW.event_date,
        'delivery_date', NEW.delivery_date
      )
    );

    -- Insert into booking_confirmations for tracking
    INSERT INTO booking_confirmations (booking_id)
    VALUES (NEW.id)
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking confirmation
DROP TRIGGER IF EXISTS trg_booking_confirmation ON bookings;
CREATE TRIGGER trg_booking_confirmation
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_booking_confirmation_webhook();

-- Function to log when email is sent from customer card
CREATE OR REPLACE FUNCTION trigger_email_sent_webhook()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND OLD.status IS NULL THEN
    PERFORM log_webhook_call(
      'send_email',
      'email_sent',
      jsonb_build_object(
        'email_id', NEW.id,
        'customer_id', NEW.customer_id,
        'recipient_email', NEW.recipient_email,
        'subject', NEW.subject,
        'email_type', NEW.email_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for email sent
DROP TRIGGER IF EXISTS trg_email_sent ON outgoing_emails;
CREATE TRIGGER trg_email_sent
AFTER INSERT ON outgoing_emails
FOR EACH ROW
EXECUTE FUNCTION trigger_email_sent_webhook();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'booking_confirmations' as table_name, COUNT(*) as count FROM public.booking_confirmations
UNION ALL
SELECT 'outgoing_emails', COUNT(*) FROM public.outgoing_emails
UNION ALL
SELECT 'webhook_logs', COUNT(*) FROM public.webhook_logs;

