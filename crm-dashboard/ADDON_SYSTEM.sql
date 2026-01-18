-- ============================================
-- EventGaraget Addon System - Supabase Setup
-- ============================================
-- Run this script in Supabase SQL Editor
-- Copy & paste each section separately if needed

-- Step 1: Create product_addons table
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon_id ON product_addons(addon_id);

-- Step 3: Disable RLS (enable later for security)
ALTER TABLE product_addons DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify addons table exists with correct structure
-- (should already exist from earlier setup)
-- If addons table doesn't exist, uncomment below:
/*
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Step 5: Insert example addons (if table is empty)
INSERT INTO addons (name, description, price, category, is_active)
VALUES 
  ('Grillkol', 'Högkvalitativt grillkol för optimal eldning', 100, 'addon', TRUE),
  ('LED-belysning', 'Professionell LED-belysning för kvälls-events', 400, 'addon', TRUE),
  ('Värmefläkt', 'Elektrisk värmefläkt för behaglig temperatur', 250, 'addon', TRUE),
  ('Folierung', 'Professionell folieringsservice för branding', 3500, 'wrapping', TRUE)
ON CONFLICT DO NOTHING;

-- Step 6: Link addons to Grillstation (if product exists)
-- First, get the Grillstation product and addons
WITH grillstation AS (
  SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1
),
addons_to_link AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as ord
  FROM addons 
  WHERE name IN ('Grillkol', 'LED-belysning', 'Värmefläkt')
)
INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
SELECT grillstation.id, addons_to_link.id, addons_to_link.ord, FALSE
FROM grillstation, addons_to_link
WHERE grillstation.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 7: Verify the setup
SELECT 'Addons created:' as info;
SELECT COUNT(*) as total_addons FROM addons;

SELECT 'Product-Addon links created:' as info;
SELECT COUNT(*) as total_links FROM product_addons;

SELECT 'Example: Grillstation addons:' as info;
SELECT 
  p.name as product,
  a.name as addon,
  a.price,
  pa.display_order
FROM product_addons pa
JOIN products p ON pa.product_id = p.id
JOIN addons a ON pa.addon_id = a.id
ORDER BY p.name, pa.display_order;

