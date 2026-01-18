-- ============================================
-- EventGaraget Addon System - Simple Setup
-- ============================================
-- Simplified version - just create the linking table

-- Step 1: Create product_addons table (the main thing we need)
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON product_addons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon_id ON product_addons(addon_id);

-- Step 3: Disable RLS
ALTER TABLE product_addons DISABLE ROW LEVEL SECURITY;

-- Step 4: Check current addons
SELECT '📦 Current Addons in Database:' as info;
SELECT id, name, price FROM addons ORDER BY name;

-- Step 5: Get IDs we need
SELECT 'Looking for Grillstation product...' as info;
SELECT id, name FROM products WHERE name = 'Grillstation';

-- Step 6: Manually link addons to Grillstation
-- Replace the UUIDs below with the actual IDs from above queries
-- Format: INSERT INTO product_addons (product_id, addon_id, display_order)
-- VALUES ('PRODUCT_ID_HERE', 'ADDON_ID_HERE', 1);

-- Example (you need to replace with actual IDs):
-- INSERT INTO product_addons (product_id, addon_id, display_order)
-- VALUES 
--   ('grillstation-id', 'grillkol-id', 1),
--   ('grillstation-id', 'led-id', 2),
--   ('grillstation-id', 'varmefläkt-id', 3);

-- Step 7: Verify
SELECT '✅ Addon Links Created:' as info;
SELECT 
  p.name as product,
  a.name as addon,
  pa.display_order
FROM product_addons pa
JOIN products p ON pa.product_id = p.id
JOIN addons a ON pa.addon_id = a.id
ORDER BY p.name, pa.display_order;

