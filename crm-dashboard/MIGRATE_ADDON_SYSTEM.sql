-- ============================================
-- MIGRATE FROM OLD ADDON SYSTEM TO NEW
-- ============================================

-- Step 1: Check current schema
SELECT 'Current addons structure:' as step;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'addons' 
ORDER BY ordinal_position;

-- Step 2: Check if product_addons table exists
SELECT 'Checking product_addons table:' as step;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'product_addons'
) as "product_addons exists";

-- Step 3: Create new addons table without product_id dependency
SELECT 'Creating new addons structure...' as step;

-- Backup old addons
CREATE TABLE IF NOT EXISTS addons_backup AS SELECT * FROM addons;

-- Drop old addons and related constraints
ALTER TABLE IF EXISTS quotation_addons DROP CONSTRAINT IF EXISTS quotation_addons_addon_id_fkey;
ALTER TABLE IF EXISTS product_addons DROP CONSTRAINT IF EXISTS product_addons_addon_id_fkey;
DROP TABLE IF EXISTS addons CASCADE;

-- Create new addons table (standalone, no product_id)
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to addons" ON public.addons
  FOR ALL USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX idx_addons_name ON public.addons(name);

GRANT ALL PRIVILEGES ON public.addons TO service_role, authenticated, anon;

-- Step 4: Create product_addons linking table if not exists
CREATE TABLE IF NOT EXISTS public.product_addons (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);

-- Enable RLS
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to product_addons" ON public.product_addons
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON public.product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon_id ON public.product_addons(addon_id);

GRANT ALL PRIVILEGES ON public.product_addons TO service_role, authenticated, anon;

-- Step 5: Insert addons
SELECT 'Inserting addons...' as step;

INSERT INTO addons (name, price, category, is_active, description)
VALUES 
  ('Grillkol', 150.00, 'Tillbehör', TRUE, 'Högkvalitativt grillkol'),
  ('Värmefläkt', 200.00, 'Klimat', TRUE, 'Elektrisk värmefläkt'),
  ('LED-belysning', 250.00, 'Belysning', TRUE, 'Professionell LED-belysning')
ON CONFLICT (name) DO NOTHING;

-- Step 6: Link addons to Grillstation
SELECT 'Linking addons to products...' as step;

INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
SELECT 
  p.id,
  a.id,
  CASE a.name
    WHEN 'Grillkol' THEN 1
    WHEN 'Värmefläkt' THEN 2
    WHEN 'LED-belysning' THEN 3
  END as display_order,
  FALSE
FROM products p, addons a
WHERE p.name = 'Grillstation'
  AND a.name IN ('Grillkol', 'Värmefläkt', 'LED-belysning')
  AND NOT EXISTS (
    SELECT 1 FROM product_addons pa 
    WHERE pa.product_id = p.id AND pa.addon_id = a.id
  );

-- Step 7: Recreate quotation_addons with proper foreign key
ALTER TABLE IF EXISTS quotation_addons DROP CONSTRAINT IF EXISTS quotation_addons_addon_id_fkey;

ALTER TABLE quotation_addons 
ADD CONSTRAINT quotation_addons_addon_id_fkey 
FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE;

-- Step 8: Verify migration
SELECT 'Migration complete! Verification:' as step;

SELECT 'All addons:' as section;
SELECT id, name, price, category, is_active FROM addons ORDER BY name;

SELECT '' as space, 'Product-Addon links:' as section;
SELECT 
  p.name as product,
  a.name as addon,
  a.price,
  pa.display_order,
  pa.is_mandatory
FROM product_addons pa
JOIN products p ON pa.product_id = p.id
JOIN addons a ON pa.addon_id = a.id
ORDER BY p.name, pa.display_order;

SELECT '' as space, 'Total addons linked to Grillstation:' as section;
SELECT COUNT(*) as "Total"
FROM product_addons pa
WHERE pa.product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1);

