# EventGaraget - Supabase Schema v2.0

## Database Design Overview

This document defines the complete Supabase database schema for EventGaraget's booking and reception system.

---

## 📊 Entity Relationship Diagram

```
customers (1) ──→ (many) quotations
    │
    ├──→ (many) bookings
    │
    ├──→ (many) conversations
    │
    ├──→ (many) reminders
    │
    └──→ (many) escalations

conversations (1) ──→ (many) messages

bookings (1) ──→ (many) booking_items

products (1) ──→ (many) booking_items

quotations (1) ──→ (1) signatures

quotations (1) ──→ (many) quotation_items
```

---

## 🗂️ Table Definitions

### 1. customers

**Purpose:** Store all customer information

```sql
CREATE TABLE customers (
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
```

---

### 2. quotations

**Purpose:** Store generated quotations waiting for signature

```sql
CREATE TABLE quotations (
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
```

---

### 3. quotation_items

**Purpose:** Line items in quotations

```sql
CREATE TABLE quotation_items (
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
```

---

### 4. signatures

**Purpose:** Store digital signatures from customers

```sql
CREATE TABLE signatures (
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
```

---

### 5. bookings

**Purpose:** Confirmed bookings after signature

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES quotations(id),
  
  -- Booking Details
  booking_number VARCHAR(50) UNIQUE NOT NULL, -- Format: BK-2025-00001
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
  setup_time_slot VARCHAR(50), -- e.g., "10:00-12:00"
  
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
```

---

### 6. booking_items

**Purpose:** Line items in confirmed bookings

```sql
CREATE TABLE booking_items (
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
```

---

### 7. products

**Purpose:** Product catalog

```sql
CREATE TABLE products (
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
```

---

### 8. conversations

**Purpose:** Email thread management

```sql
CREATE TABLE conversations (
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
  sentiment DECIMAL(3, 2) DEFAULT 0, -- -1 to 1 scale
  
  -- Metadata
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_thread_id ON conversations(gmail_thread_id);
```

---

### 9. messages

**Purpose:** Individual messages in conversations

```sql
CREATE TABLE messages (
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
```

---

### 10. escalations

**Purpose:** Human escalations

```sql
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  booking_id UUID REFERENCES bookings(id),
  
  -- Escalation Details
  reason VARCHAR(255) NOT NULL, -- 'ai_confidence_low', 'complaint', 'custom_request', 'payment_issue'
  ai_confidence DECIMAL(3, 2), -- Original AI confidence
  
  -- Assignment
  assigned_to VARCHAR(255), -- Staff member email
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'closed'
  
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
```

---

### 11. reminders

**Purpose:** Scheduled reminders and follow-ups

```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  booking_id UUID REFERENCES bookings(id),
  quotation_id UUID REFERENCES quotations(id),
  
  -- Reminder Type
  type VARCHAR(50) NOT NULL, -- 'quotation_unsigned', 'delivery_soon', 'followup_survey', 'payment_overdue'
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  
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
```

---

### 12. ai_analytics

**Purpose:** Track AI performance and accuracy

```sql
CREATE TABLE ai_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- AI Request
  conversation_id UUID REFERENCES conversations(id),
  request_type VARCHAR(50), -- 'classification', 'quotation_generation', 'escalation_decision'
  
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
  accuracy_feedback BOOLEAN, -- true if correct, false if incorrect
  human_corrected BOOLEAN DEFAULT false,
  correction_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_analytics_conversation ON ai_analytics(conversation_id);
CREATE INDEX idx_ai_analytics_created ON ai_analytics(created_at DESC);
```

---

## 🔐 Row Level Security (RLS)

All tables should have RLS enabled with a service role policy:

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON customers FOR ALL TO service_role USING (true);
-- Repeat for all tables...
```

---

## ⏰ Triggers & Functions

### Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at 
  BEFORE UPDATE ON quotations FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ... (repeat for other tables)
```

---

## 📈 Sample Data Insert

```sql
-- Insert sample products
INSERT INTO products (name, category, description, base_price_per_day, quantity_total) VALUES
('Partytält 3x3m', 'tents', 'Small party tent for up to 15 people', 1200, 5),
('Partytält 4x4m', 'tents', 'Medium party tent for up to 25 people', 1800, 3),
('Partytält 4x8m', 'tents', 'Large party tent for up to 50 people', 2500, 4),
('Partytält 6x12m', 'tents', 'XL festival tent for up to 100 people', 5500, 2),
('Bord 180cm', 'furniture', 'Standard table, seats 6-8 people', 150, 20),
('Stol vit', 'furniture', 'White plastic chair', 45, 100),
('Golv trä (per kvm)', 'flooring', 'Wooden floor per square meter', 85, 200),
('Värmepump 9kW', 'heating', 'Heating pump for tents up to 50 sqm', 450, 8),
('Lysrör LED', 'lighting', 'LED lighting', 120, 30),
('Grillstation', 'equipment', 'Professional grill station', 800, 3);
```

---

## 🔄 Migration Guide

### From Old Schema to v2.0

1. **Backup existing data**
2. **Create new tables** (this schema)
3. **Migrate data:**
   - Map old `customers` → new `customers`
   - Map old `bookings` → new `bookings` + `booking_items`
   - Create new `quotations` table (empty initially)
   - Create new `conversations` table from email logs
4. **Enable triggers**
5. **Test all features**
6. **Drop old tables** (keep backup)

---

## 📚 Database Statistics

| Table | Estimated Rows | Index Count |
|-------|----------------|-------------|
| customers | 100-1000 | 2 |
| quotations | 50-500 | 3 |
| bookings | 50-500 | 3 |
| conversations | 200-2000 | 3 |
| messages | 1000-10000 | 2 |
| products | 10-50 | 2 |

---

## ✅ Validation Checklist

- [ ] All tables created
- [ ] All indexes created
- [ ] RLS policies enabled
- [ ] Triggers created
- [ ] Sample data inserted
- [ ] Foreign keys verified
- [ ] Timestamps working
- [ ] Tested CRUD operations
