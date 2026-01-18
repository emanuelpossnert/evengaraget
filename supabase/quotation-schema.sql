-- ============================================
-- QUOTATION SYSTEM SCHEMA UPDATES
-- ============================================
-- Run this in Supabase SQL Editor to add quotation functionality

-- 1. CREATE QUOTATIONS TABLE FIRST (without booking_id reference initially)
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- Quotation Content
  items JSONB NOT NULL,
  addons JSONB,
  wrapping_selections JSONB,
  
  -- Pricing
  subtotal NUMERIC(10,2),
  total_addons NUMERIC(10,2),
  total_wrapping NUMERIC(10,2),
  grand_total NUMERIC(10,2),
  
  -- Customer Info (at time of quote)
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  customer_postal_code VARCHAR(10),
  customer_city VARCHAR(100),
  delivery_instructions TEXT,
  
  -- Signature
  signature_token VARCHAR(255) UNIQUE,
  signature_image TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on customer_id for faster queries
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_signature_token ON public.quotations(signature_token);

-- 2. ADD COLUMNS TO BOOKINGS TABLE
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS event_end_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS products_requested JSONB;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS wrapping_selected JSONB;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_status VARCHAR(50) DEFAULT 'pending_quotation';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_estimated_price NUMERIC(10,2);

-- 3. ADD BOOKING_ID COLUMN TO QUOTATIONS TABLE (now that bookings table exists)
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_quotations_booking_id ON public.quotations(booking_id);

-- 4. CREATE ADDONS TABLE
CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE INCOMING_EMAILS TABLE (for audit trail)
CREATE TABLE IF NOT EXISTS public.incoming_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,
  is_booking_request BOOLEAN DEFAULT false,
  booking_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incoming_emails_conversation_id ON public.incoming_emails(conversation_id);
CREATE INDEX IF NOT EXISTS idx_incoming_emails_customer_id ON public.incoming_emails(customer_id);

-- 6. CREATE OUTGOING_EMAILS TABLE (for audit trail)
CREATE TABLE IF NOT EXISTS public.outgoing_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,
  is_booking_request BOOLEAN DEFAULT false,
  booking_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outgoing_emails_conversation_id ON public.outgoing_emails(conversation_id);
CREATE INDEX IF NOT EXISTS idx_outgoing_emails_customer_id ON public.outgoing_emails(customer_id);

-- 7. SAMPLE ADDONS DATA
INSERT INTO public.addons (name, description, price, category, available) VALUES
  ('Setup & Assembly', 'Professional setup and assembly of all equipment', 1500.00, 'setup', true),
  ('Extended Rental (Extra Day)', 'Additional day rental for all booked items', 2000.00, 'extension', true),
  ('Early Pickup Service', 'Pick up items one day before event', 800.00, 'logistics', true),
  ('Late Return Service', 'Return items one day after event', 800.00, 'logistics', true),
  ('Insurance Coverage', 'Full insurance coverage for booked items', 500.00, 'insurance', true),
  ('Delivery & Setup', 'Professional delivery and setup at venue', 2500.00, 'delivery', true)
ON CONFLICT DO NOTHING;

-- 8. DISABLE RLS FOR NEW TABLES (if needed for development)
-- ALTER TABLE public.quotations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.addons DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.incoming_emails DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.outgoing_emails DISABLE ROW LEVEL SECURITY;

-- 9. VERIFY TABLES CREATED
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('quotations', 'addons', 'incoming_emails', 'outgoing_emails')
ORDER BY tablename;

-- ✅ SUCCESS MESSAGE
-- If you see 4 rows above (quotations, addons, incoming_emails, outgoing_emails), 
-- the schema has been created successfully!
