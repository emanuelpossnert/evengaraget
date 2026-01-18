-- Additional tables for signature service and CRM enhancements
-- Run this AFTER schema.sql for Professional package

-- Signature logs (for legal compliance)
CREATE TABLE IF NOT EXISTS signature_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  document_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of signed document
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document storage metadata
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- contract, invoice, delivery_note
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  document_hash VARCHAR(64), -- SHA-256 for verification
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system'
);

-- Notes and tags for CRM
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- general, important, follow_up
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, tag)
);

-- Customer segments (for targeting)
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  criteria JSONB NOT NULL, -- Filter criteria
  auto_assign BOOLEAN DEFAULT false,
  color VARCHAR(7), -- Hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_segment_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by VARCHAR(100) DEFAULT 'system',
  UNIQUE(customer_id, segment_id)
);

-- Email templates (for automated responses)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_plain TEXT,
  template_type VARCHAR(50) NOT NULL, -- booking_confirmation, follow_up, retention, etc.
  variables JSONB, -- Available template variables
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings (for easy configuration)
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(100)
);

-- Create indexes for performance
CREATE INDEX idx_signature_logs_booking ON signature_logs(booking_id);
CREATE INDEX idx_signature_logs_signed_at ON signature_logs(signed_at DESC);
CREATE INDEX idx_documents_booking ON documents(booking_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created ON customer_notes(created_at DESC);
CREATE INDEX idx_customer_tags_customer ON customer_tags(customer_id);
CREATE INDEX idx_customer_tags_tag ON customer_tags(tag);
CREATE INDEX idx_segment_members_customer ON customer_segment_members(customer_id);
CREATE INDEX idx_segment_members_segment ON customer_segment_members(segment_id);

-- Apply updated_at triggers
CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON customer_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default segments
INSERT INTO customer_segments (name, description, criteria, auto_assign, color) VALUES
('VIP', 'High-value customers (>50,000 SEK/year)', '{"total_revenue": {"gt": 50000}}', true, '#FFD700'),
('Active', 'Customers with bookings in last 3 months', '{"last_booking_within_days": 90}', true, '#4CAF50'),
('At Risk', 'No contact in 6+ months', '{"days_since_contact": {"gt": 180}}', true, '#FF5722'),
('New', 'Customers with <3 bookings', '{"total_bookings": {"lt": 3}}', true, '#2196F3'),
('Seasonal', 'Only books during summer', '{"booking_pattern": "seasonal"}', false, '#FF9800');

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_html, template_type, variables) VALUES
(
  'booking_confirmation',
  'Bokningsbekräftelse #{booking_number}',
  '<h1>Tack för din bokning!</h1><p>Hej {customer_name},</p><p>Vi bekräftar din bokning {booking_number} för leverans {delivery_date}.</p>',
  'booking_confirmation',
  '{"customer_name": "string", "booking_number": "string", "delivery_date": "date"}'
),
(
  'signature_reminder',
  'Påminnelse: Signera din offert',
  '<p>Hej {customer_name},</p><p>Du har en offert som väntar på signering. Klicka här för att granska och signera: {signature_link}</p>',
  'reminder',
  '{"customer_name": "string", "signature_link": "url"}'
),
(
  'retention_campaign',
  'Vi saknar dig!',
  '<p>Hej {customer_name},</p><p>Det har varit ett tag sedan vi sågs! Vi har nya produkter och erbjudanden som vi tror du skulle uppskatta.</p>',
  'retention',
  '{"customer_name": "string", "last_booking_date": "date"}'
);

-- Insert default system settings
INSERT INTO system_settings (key, value, value_type, description, category) VALUES
('company_name', 'EventGaraget', 'string', 'Company name for emails and documents', 'general'),
('company_email', 'info@eventgaraget.se', 'string', 'Main contact email', 'general'),
('company_phone', '08-123 456 78', 'string', 'Main contact phone', 'general'),
('booking_confirmation_auto', 'true', 'boolean', 'Auto-send booking confirmations', 'automation'),
('signature_reminder_days', '3', 'number', 'Days before sending signature reminder', 'automation'),
('churn_risk_threshold', '0.7', 'number', 'Threshold for flagging at-risk customers', 'crm'),
('ai_confidence_threshold', '0.8', 'number', 'Minimum AI confidence for auto-response', 'ai'),
('weekly_report_recipients', '["team@eventgaraget.se"]', 'json', 'Email recipients for weekly reports', 'reporting');

-- RLS Policies for new tables
ALTER TABLE signature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('signature_logs', 'documents', 'customer_notes', 'customer_tags', 
                      'customer_segments', 'customer_segment_members', 'email_templates', 'system_settings')
  LOOP
    EXECUTE format('
      CREATE POLICY "Enable full access for service role" ON %I
      FOR ALL USING (true) WITH CHECK (true);
    ', table_name);
  END LOOP;
END $$;

-- Helper function to get customer segment
CREATE OR REPLACE FUNCTION get_customer_segment(p_customer_id UUID)
RETURNS TABLE (
  segment_name VARCHAR(100),
  segment_color VARCHAR(7)
) AS $$
BEGIN
  RETURN QUERY
  SELECT cs.name, cs.color
  FROM customer_segment_members csm
  JOIN customer_segments cs ON csm.segment_id = cs.id
  WHERE csm.customer_id = p_customer_id
  ORDER BY csm.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign segments
CREATE OR REPLACE FUNCTION auto_assign_customer_segments()
RETURNS void AS $$
DECLARE
  customer_record RECORD;
  segment_record RECORD;
BEGIN
  -- Clear existing auto-assigned segments
  DELETE FROM customer_segment_members 
  WHERE assigned_by = 'system';
  
  -- Assign VIP segment
  INSERT INTO customer_segment_members (customer_id, segment_id, assigned_by)
  SELECT c.id, cs.id, 'system'
  FROM customers c
  CROSS JOIN customer_segments cs
  WHERE cs.name = 'VIP'
  AND c.total_revenue > 50000;
  
  -- Assign Active segment
  INSERT INTO customer_segment_members (customer_id, segment_id, assigned_by)
  SELECT c.id, cs.id, 'system'
  FROM customers c
  CROSS JOIN customer_segments cs
  WHERE cs.name = 'Active'
  AND c.last_contact_at > NOW() - INTERVAL '90 days';
  
  -- Assign At Risk segment
  INSERT INTO customer_segment_members (customer_id, segment_id, assigned_by)
  SELECT c.id, cs.id, 'system'
  FROM customers c
  CROSS JOIN customer_segments cs
  WHERE cs.name = 'At Risk'
  AND (c.last_contact_at < NOW() - INTERVAL '180 days' OR c.last_contact_at IS NULL);
  
  -- Assign New segment
  INSERT INTO customer_segment_members (customer_id, segment_id, assigned_by)
  SELECT c.id, cs.id, 'system'
  FROM customers c
  CROSS JOIN customer_segments cs
  WHERE cs.name = 'New'
  AND c.total_bookings < 3;
  
END;
$$ LANGUAGE plpgsql;

-- Schedule auto-segmentation (would be called by n8n workflow)
COMMENT ON FUNCTION auto_assign_customer_segments IS 'Auto-assigns customer segments based on criteria. Should be called daily by n8n workflow.';

