-- EventGaraget Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  company_name VARCHAR(255),
  org_number VARCHAR(50),
  address TEXT,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  customer_type VARCHAR(50) DEFAULT 'private', -- private, business, vip
  status VARCHAR(50) DEFAULT 'active' -- active, inactive, blocked
);

-- Customer profiles (for CRM analytics)
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  lifetime_value DECIMAL(10, 2) DEFAULT 0,
  avg_order_value DECIMAL(10, 2) DEFAULT 0,
  booking_frequency DECIMAL(5, 2) DEFAULT 0, -- bookings per month
  preferred_products TEXT[], -- array of product names
  churn_risk_score DECIMAL(3, 2) DEFAULT 0, -- 0-1 scale
  sentiment_score DECIMAL(3, 2) DEFAULT 0, -- -1 to 1 scale
  last_sentiment_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending, confirmed, completed, cancelled
  delivery_date DATE,
  pickup_date DATE,
  delivery_address TEXT,
  delivery_postal_code VARCHAR(20),
  delivery_city VARCHAR(100),
  setup_required BOOLEAN DEFAULT false,
  total_amount DECIMAL(10, 2),
  deposit_amount DECIMAL(10, 2),
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid
  notes TEXT,
  internal_notes TEXT,
  contract_signed BOOLEAN DEFAULT false,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'ai_agent'
);

-- Booking products (line items)
CREATE TABLE IF NOT EXISTS booking_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations (email threads)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id VARCHAR(255) UNIQUE NOT NULL, -- Gmail thread ID
  customer_id UUID REFERENCES customers(id),
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, pending, escalated
  type VARCHAR(50) DEFAULT 'general', -- booking, support, quote, complaint
  sentiment DECIMAL(3, 2) DEFAULT 0, -- -1 to 1 scale
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  human_takeover BOOLEAN DEFAULT false,
  human_takeover_reason TEXT,
  assigned_to VARCHAR(255),
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Messages (individual emails in conversation)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id VARCHAR(255) UNIQUE NOT NULL, -- Gmail message ID
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,
  body_plain TEXT,
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  sentiment DECIMAL(3, 2),
  ai_classified_intent VARCHAR(100),
  ai_confidence DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactions (all customer touchpoints)
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  type VARCHAR(50) NOT NULL, -- email, phone, meeting, note
  direction VARCHAR(20), -- inbound, outbound
  subject VARCHAR(255),
  description TEXT,
  sentiment DECIMAL(3, 2),
  outcome VARCHAR(100), -- resolved, pending, escalated, follow_up_needed
  created_by VARCHAR(100) DEFAULT 'ai_agent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analytics (for tracking AI performance)
CREATE TABLE IF NOT EXISTS ai_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  classification VARCHAR(100),
  confidence DECIMAL(3, 2),
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_version VARCHAR(50),
  prompt_version VARCHAR(50),
  accuracy_feedback BOOLEAN, -- true if accurate, false if not
  human_corrected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-ups (scheduled actions)
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  booking_id UUID REFERENCES bookings(id),
  type VARCHAR(50) NOT NULL, -- email, phone, review_request, feedback
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, cancelled, failed
  message_template VARCHAR(100),
  custom_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_last_contact ON customers(last_contact_at DESC);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_delivery_date ON bookings(delivery_date);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_interactions_customer ON interactions(customer_id);
CREATE INDEX idx_follow_ups_scheduled ON follow_ups(scheduled_for) WHERE status = 'pending';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC Functions

-- Get weekly analytics
CREATE OR REPLACE FUNCTION get_weekly_analytics()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_conversations', COUNT(*),
    'resolved_conversations', COUNT(*) FILTER (WHERE status = 'resolved'),
    'avg_response_time_minutes', AVG(
      EXTRACT(EPOCH FROM (first_response_at - created_at))/60
    ),
    'avg_sentiment', AVG(sentiment),
    'bookings_created', COUNT(DISTINCT booking_id),
    'new_customers', COUNT(DISTINCT c.id) FILTER (
      WHERE c.created_at > NOW() - INTERVAL '7 days'
    ),
    'fully_automated', COUNT(*) FILTER (WHERE human_takeover = false),
    'human_takeovers', COUNT(*) FILTER (WHERE human_takeover = true)
  ) INTO result
  FROM conversations
  LEFT JOIN customers c ON conversations.customer_id = c.id
  WHERE conversations.created_at > NOW() - INTERVAL '7 days';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Calculate churn risk factors
CREATE OR REPLACE FUNCTION calculate_churn_factors(p_customer_id UUID)
RETURNS json AS $$
DECLARE
  factors json;
BEGIN
  WITH customer_metrics AS (
    SELECT
      c.id,
      EXTRACT(DAY FROM NOW() - MAX(i.created_at)) as days_since_contact,
      COUNT(b.id) FILTER (WHERE b.created_at > NOW() - INTERVAL '30 days') as recent_bookings,
      COUNT(b.id) FILTER (WHERE b.created_at > NOW() - INTERVAL '90 days') as quarter_bookings,
      AVG(i.sentiment) FILTER (WHERE i.created_at > NOW() - INTERVAL '30 days') as recent_sentiment
    FROM customers c
    LEFT JOIN interactions i ON c.id = i.customer_id
    LEFT JOIN bookings b ON c.id = b.customer_id
    WHERE c.id = p_customer_id
    GROUP BY c.id
  )
  SELECT json_build_object(
    'days_since_last_contact', COALESCE(days_since_contact, 999) / 100.0,
    'declining_order_frequency', 
      CASE 
        WHEN quarter_bookings = 0 THEN 1.0
        WHEN recent_bookings < quarter_bookings / 3.0 THEN 0.8
        ELSE 0.2
      END,
    'negative_sentiment_trend', 
      CASE 
        WHEN recent_sentiment < 0 THEN ABS(recent_sentiment)
        ELSE 0
      END,
    'unresolved_issues', (
      SELECT COUNT(*) * 0.1
      FROM conversations
      WHERE customer_id = p_customer_id
      AND status = 'pending'
      LIMIT 10
    )
  ) INTO factors
  FROM customer_metrics;
  
  RETURN factors;
END;
$$ LANGUAGE plpgsql;

-- Update conversation sentiment
CREATE OR REPLACE FUNCTION update_conversation_sentiment()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations
  SET sentiment = (
    SELECT AVG(sentiment)
    FROM messages
    WHERE conversation_id = NEW.conversation_id
    AND sentiment IS NOT NULL
  )
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_sentiment();

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Create policies (allow service role full access)
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('customers', 'customer_profiles', 'bookings', 'booking_products', 
                      'conversations', 'messages', 'interactions', 'ai_analytics', 'follow_ups')
  LOOP
    EXECUTE format('
      CREATE POLICY "Enable full access for service role" ON %I
      FOR ALL USING (true) WITH CHECK (true);
    ', table_name);
  END LOOP;
END $$;

