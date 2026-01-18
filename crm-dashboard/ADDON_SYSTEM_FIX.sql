-- ============================================
-- EventGaraget Addon System - Fix Script
-- ============================================
-- Run this to fix the addons table structure

-- Step 1: Add missing columns to addons table
ALTER TABLE addons ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE addons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Step 2: Create product_addons table
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon_id ON product_addons(addon_id);

-- Step 4: Disable RLS
ALTER TABLE product_addons DISABLE ROW LEVEL SECURITY;

-- Step 5: Update existing addons with category
UPDATE addons SET category = 'addon' WHERE category IS NULL;

-- Step 6: Insert new addons (if not already present)
INSERT INTO addons (name, description, price, category, is_active)
VALUES 
  ('Grillkol', 'Högkvalitativt grillkol för optimal eldning', 100, 'addon', TRUE),
  ('LED-belysning', 'Professionell LED-belysning för kvälls-events', 400, 'addon', TRUE),
  ('Värmefläkt', 'Elektrisk värmefläkt för behaglig temperatur', 250, 'addon', TRUE),
  ('Folierung', 'Professionell folieringsservice för branding', 3500, 'wrapping', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Step 7: Link addons to Grillstation (if product exists)
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
ON CONFLICT (product_id, addon_id) DO NOTHING;

-- Step 8: Verify the setup
SELECT 'Setup Complete!' as status;

SELECT 'All addons:' as info;
SELECT id, name, price, category FROM addons ORDER BY name;

SELECT 'Product-Addon links:' as info;
SELECT 
  p.name as product,
  a.name as addon,
  a.price,
  pa.display_order
FROM product_addons pa
JOIN products p ON pa.product_id = p.id
JOIN addons a ON pa.addon_id = a.id
ORDER BY p.name, pa.display_order;

