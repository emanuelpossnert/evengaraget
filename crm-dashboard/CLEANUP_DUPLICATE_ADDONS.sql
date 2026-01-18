-- ============================================
-- CLEANUP DUPLICATE ADDONS
-- ============================================

-- Step 1: See all addons linked to Grillstation
SELECT 'All addons linked to Grillstation:' as step;
SELECT 
  pa.id,
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

-- Step 2: Find duplicates
SELECT 'Looking for duplicate addon links:' as step;
SELECT 
  product_id,
  addon_id,
  COUNT(*) as count
FROM product_addons
WHERE product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1)
GROUP BY product_id, addon_id
HAVING COUNT(*) > 1;

-- Step 3: See all addons in the system
SELECT '' as step, 'All addons in system:' as step2;
SELECT id, name, price, category FROM addons ORDER BY name;

-- Step 4: Delete ALL current addons for Grillstation
SELECT 'Deleting all current addons for Grillstation...' as step;
DELETE FROM product_addons 
WHERE product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1);

-- Step 5: Re-insert only the 3 correct addons
SELECT 'Re-inserting correct addons...' as step;
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
  AND a.name IN ('Grillkol', 'Värmefläkt', 'LED-belysning');

-- Step 6: Verify cleanup
SELECT 'After cleanup - Total addons:' as step;
SELECT COUNT(*) as "Total"
FROM product_addons pa
WHERE pa.product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1);

SELECT '' as step, 'Final addon list:' as step2;
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

