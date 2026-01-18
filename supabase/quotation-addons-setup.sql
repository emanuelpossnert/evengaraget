-- ================================================
-- QUOTATION & SIGNATURE SYSTEM - DATABASE SETUP
-- ================================================
-- NOTE: products tabell antas redan existera!

-- 1. CREATE ADDONS TABLE
-- ================================================
DROP TABLE IF EXISTS public.addons CASCADE;

CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to addons" ON public.addons
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_addons_product_id ON public.addons(product_id);

GRANT ALL PRIVILEGES ON public.addons TO service_role, authenticated, anon;


-- 2. CREATE QUOTATION_ADDONS TABLE
-- ================================================
DROP TABLE IF EXISTS public.quotation_addons CASCADE;

CREATE TABLE public.quotation_addons (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quotation_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to quotation_addons" ON public.quotation_addons
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_quotation_addons_quotation_id ON public.quotation_addons(quotation_id);
CREATE INDEX idx_quotation_addons_addon_id ON public.quotation_addons(addon_id);

GRANT ALL PRIVILEGES ON public.quotation_addons TO service_role, authenticated, anon;


-- 3. UPDATE QUOTATIONS TABLE - Add missing columns
-- ================================================
ALTER TABLE IF EXISTS public.quotations
ADD COLUMN IF NOT EXISTS signing_token VARCHAR(255) UNIQUE;

ALTER TABLE IF EXISTS public.quotations
ADD COLUMN IF NOT EXISTS signature_url TEXT;

ALTER TABLE IF EXISTS public.quotations
ADD COLUMN IF NOT EXISTS customer_signature BYTEA;

ALTER TABLE IF EXISTS public.quotations
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS public.quotations
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE IF EXISTS public.quotations
ADD COLUMN IF NOT EXISTS addon_notes TEXT;


-- 4. INSERT SAMPLE ADDONS
-- ================================================
-- Get all products and add example addons
-- Grillkol (för produkter som innehåller "grill")
INSERT INTO public.addons (product_id, name, price, description)
SELECT 
  id,
  'Grillkol' as name,
  350.00 as price,
  'Högkvalitativt grillkol för optimal eldning' as description
FROM public.products 
WHERE LOWER(name) LIKE '%grill%'
  AND NOT EXISTS (
    SELECT 1 FROM public.addons 
    WHERE product_id = products.id AND name = 'Grillkol'
  );

-- Värmefläkt (för tält)
INSERT INTO public.addons (product_id, name, price, description)
SELECT 
  id,
  'Värmefläkt' as name,
  250.00 as price,
  'Elektrisk värmefläkt för behaglig temperatur' as description
FROM public.products 
WHERE LOWER(name) LIKE '%tält%' 
  AND NOT EXISTS (
    SELECT 1 FROM public.addons 
    WHERE product_id = products.id AND name = 'Värmefläkt'
  )
LIMIT 1;

-- LED-belysning (för tält)
INSERT INTO public.addons (product_id, name, price, description)
SELECT 
  id,
  'LED-belysning Pro' as name,
  400.00 as price,
  'Professionell LED-belysning för kvälls-events' as description
FROM public.products 
WHERE LOWER(name) LIKE '%tält%'
  AND NOT EXISTS (
    SELECT 1 FROM public.addons 
    WHERE product_id = products.id AND name = 'LED-belysning Pro'
  )
LIMIT 1;


-- 5. VERIFY SETUP
-- ================================================
SELECT '=== PRODUCTS ===' as info;
SELECT id, name, category, base_price_per_day FROM public.products LIMIT 10;

SELECT '' as info, '=== ADDONS ===' as info;
SELECT a.id, p.name as product_name, a.name as addon_name, a.price 
FROM public.addons a 
JOIN public.products p ON a.product_id = p.id;

SELECT '' as info, '=== QUOTATIONS COLUMNS ===' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'quotations'
ORDER BY ordinal_position;
