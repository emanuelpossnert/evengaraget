-- EventGaraget Database Schema v2.0
-- Execute this file in Supabase SQL Editor
-- Run all statements in order

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- UPDATE FUNCTION (used by multiple triggers)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 1. CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact Information
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Company Information
  company_name VARCHAR(255),
  org_number VARCHAR(50),
  
  -- Address
  address TEXT,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  
  -- Customer Profile
  customer_type VARCHAR(50) DEFAULT 'private', -- 'private', 'business', 'vip'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'blocked'
  
  -- Statistics
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  lifetime_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  preferred_products TEXT[], -- Array of product names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON customers FOR ALL TO service_role USING (true);

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product Info
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100), -- 'tents', 'furniture', 'flooring', 'heating', 'lighting', 'equipment'
  description TEXT,
  
  -- Pricing
  base_price_per_day DECIMAL(10, 2) NOT NULL,
  min_rental_days INTEGER DEFAULT 1,
  
  -- Inventory
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  
  -- Services
  requires_setup BOOLEAN DEFAULT false,
  setup_cost DECIMAL(10, 2) DEFAULT 0,
  
  can_be_wrapped BOOLEAN DEFAULT false,
  wrapping_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Media
  image_url TEXT,
  specifications JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON products FOR ALL TO service_role USING (true);
CREATE POLICY "Public can read products" ON products FOR SELECT TO anon USING (true);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. QUOTATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Quotation Details
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Signature Token
  signature_token UUID UNIQUE NOT NULL,
  signature_link VARCHAR(500),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending_signature', -- 'pending_signature', 'signed', 'expired', 'rejected'
  
  -- Dates
  valid_until DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Terms
  terms_and_conditions TEXT,
  
  -- Metadata
  notes TEXT,
  created_by VARCHAR(100) DEFAULT 'ai_agent'
);

CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_token ON quotations(signature_token);
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON quotations FOR ALL TO service_role USING (true);

-- =============================================
-- 4. QUOTATION_ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Item Details
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Optional Add-ons
  can_be_wrapped BOOLEAN DEFAULT false,
  is_wrapped BOOLEAN DEFAULT false,
  wrapping_cost DECIMAL(10, 2) DEFAULT 0,
  
  requires_setup BOOLEAN DEFAULT false,
  setup_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON quotation_items FOR ALL TO service_role USING (true);

-- =============================================
-- 5. SIGNATURES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL UNIQUE REFERENCES quotations(id) ON DELETE CASCADE,
  
  -- Signer Information
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255),
  company_name VARCHAR(255),
  
  -- Signature Data
  signature_image_url TEXT NOT NULL, -- URL to signed image
  signature_data JSONB, -- Full signature canvas data
  
  -- IP & Device Info
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Consent
  accepted_terms BOOLEAN DEFAULT true
);

CREATE INDEX idx_signatures_quotation ON signatures(quotation_id);
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON signatures FOR ALL TO service_role USING (true);

-- =============================================
-- 6. BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES quotations(id),
  
  -- Booking Details
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'confirmed', 'completed', 'cancelled'
  
  -- Dates
  delivery_date DATE NOT NULL,
  pickup_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Delivery Address
  delivery_address TEXT,
  delivery_postal_code VARCHAR(20),
  delivery_city VARCHAR(100),
  delivery_instructions TEXT,
  
  -- Costs
  total_amount DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2),
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  payment_method VARCHAR(50), -- 'bank_transfer', 'card', 'invoice'
  
  -- Services
  requires_setup BOOLEAN DEFAULT false,
  setup_date DATE,
  setup_time_slot VARCHAR(50),
  
  requires_delivery BOOLEAN DEFAULT true,
  delivery_time_slot VARCHAR(50),
  
  -- Contract
  contract_signed BOOLEAN DEFAULT false,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  internal_notes TEXT,
  customer_notes TEXT
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_delivery_date ON bookings(delivery_date);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON bookings FOR ALL TO service_role USING (true);

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. BOOKING_ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS booking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Item Details
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Wrapping
  is_wrapped BOOLEAN DEFAULT false,
  wrapping_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'shipped', 'delivered', 'damaged'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON booking_items FOR ALL TO service_role USING (true);

-- =============================================
-- 8. CONVERSATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  
  -- Gmail Integration
  gmail_thread_id VARCHAR(255) UNIQUE,
  
  -- Content
  subject VARCHAR(500),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'pending', 'escalated'
  type VARCHAR(50) DEFAULT 'general', -- 'booking', 'support', 'complaint', 'followup'
  
  -- Assignment
  assigned_to VARCHAR(255), -- Staff member email or 'ai_agent'
  human_required BOOLEAN DEFAULT false,
  human_takeover_reason TEXT,
  
  -- Related Records
  booking_id UUID REFERENCES bookings(id),
  quotation_id UUID REFERENCES quotations(id),
  
  -- Sentiment
  sentiment DECIMAL(3, 2) DEFAULT 0,
  
  -- Metadata
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_thread_id ON conversations(gmail_thread_id);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON conversations FOR ALL TO service_role USING (true);

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Gmail Integration
  gmail_message_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Message Content
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,
  body_plain TEXT,
  
  -- Metadata
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
  sender_type VARCHAR(50), -- 'customer', 'ai_agent', 'human_staff'
  
  -- Analysis
  sentiment DECIMAL(3, 2),
  ai_classified_intent VARCHAR(100),
  ai_confidence DECIMAL(3, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON messages FOR ALL TO service_role USING (true);

-- =============================================
-- 10. ESCALATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  booking_id UUID REFERENCES bookings(id),
  
  -- Escalation Details
  reason VARCHAR(255) NOT NULL,
  ai_confidence DECIMAL(3, 2),
  
  -- Assignment
  assigned_to VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Feedback
  ai_learned BOOLEAN DEFAULT false,
  feedback_for_ai JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalations_customer ON escalations(customer_id);
CREATE INDEX idx_escalations_status ON escalations(status);
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON escalations FOR ALL TO service_role USING (true);

CREATE TRIGGER update_escalations_updated_at BEFORE UPDATE ON escalations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. REMINDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  booking_id UUID REFERENCES bookings(id),
  quotation_id UUID REFERENCES quotations(id),
  
  -- Reminder Type
  type VARCHAR(50) NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Content
  message_template VARCHAR(100),
  custom_message TEXT,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_reminders_customer ON reminders(customer_id);
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON reminders FOR ALL TO service_role USING (true);

-- =============================================
-- 12. AI_ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ai_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- AI Request
  conversation_id UUID REFERENCES conversations(id),
  request_type VARCHAR(50),
  
  -- Result
  classification VARCHAR(100),
  confidence DECIMAL(3, 2),
  
  -- Performance
  response_time_ms INTEGER,
  tokens_used INTEGER,
  
  -- Model Info
  model_version VARCHAR(50),
  prompt_version VARCHAR(50),
  temperature DECIMAL(3, 2),
  
  -- Accuracy
  accuracy_feedback BOOLEAN,
  human_corrected BOOLEAN DEFAULT false,
  correction_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_analytics_conversation ON ai_analytics(conversation_id);
CREATE INDEX idx_ai_analytics_created ON ai_analytics(created_at DESC);
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON ai_analytics FOR ALL TO service_role USING (true);

-- =============================================
-- SAMPLE DATA - Products
-- =============================================
INSERT INTO products (name, category, description, base_price_per_day, quantity_total, can_be_wrapped, wrapping_cost) VALUES
('Partytält 3x3m', 'tents', 'Mindre partytält perfekt för upp till 15 personer', 1200, 5, false, 0),
('Partytält 4x4m', 'tents', 'Mellanstort tält för upp till 25 personer', 1800, 3, false, 0),
('Partytält 4x8m', 'tents', 'Större tält för upp till 50 personer', 2500, 4, false, 0),
('Partytält 6x12m', 'tents', 'Stort festtält för upp till 100 personer', 5500, 2, false, 0),
('Bord 180cm', 'furniture', 'Standardbord, plats för 6-8 personer', 150, 20, false, 0),
('Stol vit', 'furniture', 'Vit plaststol', 45, 100, false, 0),
('Golv trä (per kvm)', 'flooring', 'Trägolv för tält', 85, 200, false, 0),
('Värmepump 9kW', 'heating', 'Värmepump för tält upp till 50 kvm', 450, 8, true, 2500),
('Lysrör LED', 'lighting', 'LED-belysning', 120, 30, false, 0),
('Grillstation', 'equipment', 'Professionell grillstation', 800, 3, true, 3500)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SCHEMA COMPLETE
-- =============================================
-- All 12 tables created with:
-- ✅ Proper indexes
-- ✅ RLS policies enabled
-- ✅ Foreign key constraints
-- ✅ Timestamp triggers
-- ✅ Sample products inserted

-- Next steps:
-- 1. Verify all tables: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- 2. Check sample data: SELECT * FROM products;
-- 3. Begin n8n workflow setup
