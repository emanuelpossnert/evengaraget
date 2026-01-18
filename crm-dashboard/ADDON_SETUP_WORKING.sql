-- ============================================
-- EventGaraget Addon System - Working Setup
-- ============================================
-- Simple, straightforward SQL that works

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

-- Step 6: Insert addons one by one (simple and safe)
INSERT INTO addons (name, description, price, category, is_active)
SELECT 'Grillkol', 'Högkvalitativt grillkol för optimal eldning', 100, 'addon', TRUE
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name = 'Grillkol');

INSERT INTO addons (name, description, price, category, is_active)
SELECT 'LED-belysning', 'Professionell LED-belysning för kvälls-events', 400, 'addon', TRUE
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name = 'LED-belysning');

INSERT INTO addons (name, description, price, category, is_active)
SELECT 'Värmefläkt', 'Elektrisk värmefläkt för behaglig temperatur', 250, 'addon', TRUE
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name = 'Värmefläkt');

INSERT INTO addons (name, description, price, category, is_active)
SELECT 'Folierung', 'Professionell folieringsservice för branding', 3500, 'wrapping', TRUE
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name = 'Folierung');

-- Step 7: Get IDs for linking
WITH grillstation_id AS (
  SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1
),
grillkol_id AS (
  SELECT id FROM addons WHERE name = 'Grillkol' LIMIT 1
),
led_id AS (
  SELECT id FROM addons WHERE name = 'LED-belysning' LIMIT 1
),
varmefläkt_id AS (
  SELECT id FROM addons WHERE name = 'Värmefläkt' LIMIT 1
)
INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
SELECT (SELECT id FROM grillstation_id), (SELECT id FROM grillkol_id), 1, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM product_addons 
  WHERE product_id = (SELECT id FROM grillstation_id)
    AND addon_id = (SELECT id FROM grillkol_id)
);

INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
SELECT (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1), 
       (SELECT id FROM addons WHERE name = 'LED-belysning' LIMIT 1), 2, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM product_addons 
  WHERE product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1)
    AND addon_id = (SELECT id FROM addons WHERE name = 'LED-belysning' LIMIT 1)
);

INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
SELECT (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1), 
       (SELECT id FROM addons WHERE name = 'Värmefläkt' LIMIT 1), 3, FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM product_addons 
  WHERE product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1)
    AND addon_id = (SELECT id FROM addons WHERE name = 'Värmefläkt' LIMIT 1)
);

-- Step 8: Verify - Show all addons
SELECT '✅ ALL ADDONS:' as info;
SELECT id, name, price, category FROM addons ORDER BY name;

-- Step 9: Verify - Count
SELECT COUNT(*) as "Total Addons" FROM addons;

-- Step 10: Verify - Show Grillstation with addons
SELECT '✅ GRILLSTATION ADDONS:' as info;
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

SELECT '✅ Setup Complete!' as "Final Status";

