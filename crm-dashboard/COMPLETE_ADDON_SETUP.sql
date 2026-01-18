-- ============================================
-- Complete Addon System Setup
-- ============================================

-- STEP 1: Verify/Create addons if missing
-- Only insert if they don't already exist
INSERT INTO addons (name, price, category, is_active)
SELECT 'Grillkol', 150.00, 'Tillbehör', TRUE
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name = 'Grillkol')
UNION ALL
SELECT 'Värmefläkt', 200.00, 'Klimat', TRUE
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name = 'Värmefläkt')
UNION ALL
SELECT 'LED-belysning', 250.00, 'Belysning', TRUE
WHERE NOT EXISTS (SELECT 1 FROM addons WHERE name = 'LED-belysning');

-- STEP 2: Get IDs
SELECT 'Step 1: Getting IDs...' as step;
WITH ids AS (
  SELECT 
    (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1) as grillstation_id,
    (SELECT id FROM addons WHERE name = 'Grillkol' LIMIT 1) as grillkol_id,
    (SELECT id FROM addons WHERE name = 'Värmefläkt' LIMIT 1) as varmeflaekt_id,
    (SELECT id FROM addons WHERE name = 'LED-belysning' LIMIT 1) as led_id
)
SELECT grillstation_id, grillkol_id, varmeflaekt_id, led_id FROM ids;

-- STEP 3: Link addons to Grillstation
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

-- STEP 4: Verify all is working
SELECT 'Step 2: Verification - All addons linked to Grillstation:' as step;
SELECT 
  p.name as product,
  a.name as addon,
  a.price,
  pa.display_order,
  pa.is_mandatory
FROM product_addons pa
JOIN products p ON pa.product_id = p.id
JOIN addons a ON pa.addon_id = a.id
WHERE p.name = 'Grillstation'
ORDER BY pa.display_order;

-- STEP 5: Count
SELECT 
  (SELECT COUNT(*) FROM product_addons WHERE product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1)) as "Total Addons for Grillstation"

