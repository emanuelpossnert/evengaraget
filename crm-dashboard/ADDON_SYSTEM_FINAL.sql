-- ============================================
-- EventGaraget Addon System - Final Setup
-- ============================================
-- This script fixes all issues and sets up addons

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

-- Step 5: Update existing addons with category (no constraint needed)
UPDATE addons SET category = 'addon' WHERE category IS NULL;

-- Step 6: Delete duplicates if they exist
DELETE FROM addons WHERE name IN ('Grillkol', 'LED-belysning', 'Värmefläkt', 'Folierung')
  AND id NOT IN (
    SELECT MIN(id) FROM addons 
    WHERE name IN ('Grillkol', 'LED-belysning', 'Värmefläkt', 'Folierung')
    GROUP BY name
  );

-- Step 7: Insert addons (simple INSERT without conflicts)
INSERT INTO addons (name, description, price, category, is_active)
VALUES 
  ('Grillkol', 'Högkvalitativt grillkol för optimal eldning', 100, 'addon', TRUE),
  ('LED-belysning', 'Professionell LED-belysning för kvälls-events', 400, 'addon', TRUE),
  ('Värmefläkt', 'Elektrisk värmefläkt för behaglig temperatur', 250, 'addon', TRUE),
  ('Folierung', 'Professionell folieringsservice för branding', 3500, 'wrapping', TRUE)
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name IN ('Grillkol', 'LED-belysning', 'Värmefläkt', 'Folierung'));

-- Step 8: Link addons to Grillstation (if product exists)
WITH grillstation AS (
  SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1
),
addons_to_link AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as ord
  FROM addons 
  WHERE name IN ('Grillkol', 'LED-belysning', 'Värmefläkt')
),
final AS (
  SELECT grillstation.id as product_id, addons_to_link.id as addon_id, addons_to_link.ord
  FROM grillstation, addons_to_link
  WHERE grillstation.id IS NOT NULL
)
INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
SELECT product_id, addon_id, ord, FALSE FROM final
WHERE NOT EXISTS (
  SELECT 1 FROM product_addons pa 
  WHERE pa.product_id = final.product_id AND pa.addon_id = final.addon_id
);

-- Step 9: Verify the setup
SELECT 'Setup Complete!' as "✅ Status";

SELECT COUNT(*) as "Total Addons" FROM addons;

SELECT 
  COUNT(*) as "Grillstation Addons"
FROM product_addons pa
WHERE pa.product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1);

-- Step 10: Show all addons
SELECT '=== ALL ADDONS ===' as info;
SELECT id, name, price, category, is_active FROM addons ORDER BY name;

-- Step 11: Show Grillstation with its addons
SELECT '=== GRILLSTATION ADDONS ===' as info;
SELECT 
  p.name as product,
  a.name as addon,
  a.price,
  pa.display_order
FROM product_addons pa
JOIN products p ON pa.product_id = p.id
JOIN addons a ON pa.addon_id = a.id
WHERE p.name = 'Grillstation'
ORDER BY pa.display_order;

