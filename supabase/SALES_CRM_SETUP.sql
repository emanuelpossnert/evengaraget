-- ============================================
-- SALES CRM TABLES - SETUP
-- ============================================

-- 1. CUSTOMER NOTES (Anteckningar)
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- 2. CUSTOMER TASKS (Uppgifter/Reminders)
CREATE TABLE IF NOT EXISTS public.customer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) DEFAULT 'call', -- 'call', 'email', 'meeting', 'follow-up', 'other'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_tasks ENABLE ROW LEVEL SECURITY;

-- 3. CUSTOMER TAGS (Taggar)
CREATE TABLE IF NOT EXISTS public.customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(50) DEFAULT 'bg-gray-100', -- Tailwind class
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

-- 4. CUSTOMER TAG ASSIGNMENTS (Tag-tilldelningar)
CREATE TABLE IF NOT EXISTS public.customer_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.customer_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, tag_id)
);

ALTER TABLE public.customer_tag_assignments ENABLE ROW LEVEL SECURITY;

-- 5. CUSTOMER CONTACTS (Kontaktpersoner)
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(100),
  role VARCHAR(50) DEFAULT 'general', -- 'main', 'technical', 'financial', 'general'
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

-- 6. CUSTOMER PIPELINE (Säljstatus)
CREATE TABLE IF NOT EXISTS public.customer_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL, -- 'prospect', 'lead', 'negotiation', 'customer', 'vip'
  value_estimation DECIMAL(10, 2),
  probability_percent INTEGER DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_pipeline ENABLE ROW LEVEL SECURITY;

-- 7. CUSTOMER CALL LOG (Samtallogg)
CREATE TABLE IF NOT EXISTS public.customer_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  call_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  call_type VARCHAR(50) DEFAULT 'outbound', -- 'inbound', 'outbound'
  contact_person VARCHAR(255),
  topic VARCHAR(255),
  outcome VARCHAR(50), -- 'positive', 'neutral', 'negative', 'no_answer'
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customer_call_log ENABLE ROW LEVEL SECURITY;

-- 8. UPDATE customers TABLE WITH NEW FIELDS
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_action_description TEXT,
ADD COLUMN IF NOT EXISTS sales_owner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_segment VARCHAR(50); -- 'enterprise', 'mid-market', 'smb', 'startup'

-- DEFAULT DATA - COMMON TAGS
INSERT INTO public.customer_tags (name, color, description) VALUES
  ('Högt värde', 'bg-red-100', 'Kunder med höga genomsnittliga ordervärden'),
  ('Återkommande', 'bg-green-100', 'Kunder som återkommer regelbundet'),
  ('Säsongskund', 'bg-blue-100', 'Kunder som bokar säsongvist'),
  ('Företag', 'bg-purple-100', 'B2B-kunder/företag'),
  ('Privat', 'bg-gray-100', 'Privatpersoner'),
  ('Väntande', 'bg-yellow-100', 'Kunder i försäljningsprocessen'),
  ('Inaktiv', 'bg-red-200', 'Kunder som inte varit aktiva på länge'),
  ('Vip', 'bg-pink-100', 'VIP-kunder')
ON CONFLICT (name) DO NOTHING;

-- VERIFY
SELECT 'Customer Notes Table' as table_name, COUNT(*) as count FROM public.customer_notes
UNION ALL
SELECT 'Customer Tasks', COUNT(*) FROM public.customer_tasks
UNION ALL
SELECT 'Customer Tags', COUNT(*) FROM public.customer_tags
UNION ALL
SELECT 'Customer Contacts', COUNT(*) FROM public.customer_contacts
UNION ALL
SELECT 'Customer Pipeline', COUNT(*) FROM public.customer_pipeline
UNION ALL
SELECT 'Customer Call Log', COUNT(*) FROM public.customer_call_log;

