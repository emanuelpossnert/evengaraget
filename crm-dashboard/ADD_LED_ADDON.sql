-- ============================================
-- Add LED-belysning addon to Grillstation
-- ============================================

-- First, check if LED-belysning exists in addons
SELECT 'Checking for LED-belysning addon...' as step;
SELECT id, name, price FROM addons WHERE name = 'LED-belysning';

-- Get Grillstation ID
SELECT 'Getting Grillstation product ID...' as step;
SELECT id, name FROM products WHERE name = 'Grillstation';

-- Add LED-belysning link (replace UUIDs with actual values from above)
-- Format: 
-- INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
-- VALUES ('PRODUCT_UUID', 'ADDON_UUID', 3, FALSE);

-- Example with placeholder values - YOU NEED TO FILL IN THE ACTUAL UUIDs:
-- For Grillstation product and LED-belysning addon:

-- Verify all addons are linked
SELECT 'Current addon links for Grillstation:' as step;
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

-- Count addons
SELECT COUNT(*) as "Total Grillstation Addons" 
FROM product_addons pa
WHERE pa.product_id = (SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1);

