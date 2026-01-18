-- ============================================================================
-- IMPORT ALL EVENTGARAGET PRODUCTS
-- This script inserts all products, categories, and addons
-- ============================================================================

-- STEP 1: Insert all products
INSERT INTO products (name, category, description, base_price_per_day, quantity_total, quantity_available, can_be_wrapped, wrapping_cost, image_url, created_at, updated_at)
VALUES
-- EVENTPERSONAL
('Event Personal', 'EVENTPERSONAL', 'Professionell eventpersonal, prisbas 490kr/h', 490, 50, 50, false, 0, NULL, NOW(), NOW()),

-- EVENTMASKINER - Spelmaskiner (6900kr/dag, 1500kr extra dag)
('Basketmaskin', 'EVENTMASKINER', 'Basketmaskin - 6900 SEK per dag', 6900, 2, 2, false, 0, NULL, NOW(), NOW()),
('Jukebox', 'EVENTMASKINER', 'Jukebox - 6900 SEK per dag', 6900, 2, 2, false, 0, NULL, NOW(), NOW()),
('Shuffleboard', 'EVENTMASKINER', 'Shuffleboard - 6900 SEK per dag', 6900, 2, 2, false, 0, NULL, NOW(), NOW()),
('Godisutomat STOR', 'EVENTMASKINER', 'Godisutomat STOR - 6900 SEK per dag', 6900, 1, 1, false, 0, NULL, NOW(), NOW()),
('Airhockey', 'EVENTMASKINER', 'Airhockey - 6900 SEK per dag', 6900, 2, 2, false, 0, NULL, NOW(), NOW()),
('Popcornvagn LITEN', 'EVENTMASKINER', 'Popcornvagn LITEN - 2500 SEK per dag', 2500, 1, 1, false, 0, NULL, NOW(), NOW()),
('Popcornvagn STOR', 'EVENTMASKINER', 'Popcornvagn STOR - 3500 SEK per dag', 3500, 1, 1, false, 0, NULL, NOW(), NOW()),
('Godishylla STOR', 'EVENTMASKINER', 'Godishylla STOR - 5900 SEK per dag', 5900, 1, 1, false, 0, NULL, NOW(), NOW()),
('Godishylla LITEN', 'EVENTMASKINER', 'Godishylla LITEN - 3990 SEK per dag', 3990, 2, 2, false, 0, NULL, NOW(), NOW()),
('Catch The Light', 'EVENTMASKINER', 'Catch The Light - 6900 SEK per dag', 6900, 1, 1, false, 0, NULL, NOW(), NOW()),
('Boxningsmaskin', 'EVENTMASKINER', 'Boxningsmaskin - 6900 SEK per dag', 6900, 1, 1, false, 0, NULL, NOW(), NOW()),
('CashCube', 'EVENTMASKINER', 'CashCube - 6900 SEK per dag', 6900, 1, 1, false, 0, NULL, NOW(), NOW()),
('Flipperspel', 'EVENTMASKINER', 'Flipperspel - 6900 SEK per dag', 6900, 2, 2, false, 0, NULL, NOW(), NOW()),
('Vending Machine', 'EVENTMASKINER', 'Vending Machine - 6900 SEK per dag', 6900, 1, 1, false, 0, NULL, NOW(), NOW()),
('Lucky7', 'EVENTMASKINER', 'Lucky7 - 6900 SEK per dag', 6900, 1, 1, false, 0, NULL, NOW(), NOW()),
('Fotobås', 'EVENTMASKINER', 'Fotobås - 10000 SEK per dag', 10000, 1, 1, false, 0, NULL, NOW(), NOW()),
('360-foto', 'EVENTMASKINER', '360-foto - 1500 SEK per dag', 1500, 1, 1, false, 0, NULL, NOW(), NOW()),
('Pingisbord', 'EVENTMASKINER', 'Pingisbord - 2900 SEK per dag', 2900, 2, 2, false, 0, NULL, NOW(), NOW()),
('Human Chess', 'EVENTMASKINER', 'Human Chess - 2900 SEK per dag', 2900, 1, 1, false, 0, NULL, NOW(), NOW()),
('Godisautomat LITEN', 'EVENTMASKINER', 'Godisautomat LITEN - 1990 SEK per dag', 1990, 1, 1, false, 0, NULL, NOW(), NOW()),

-- TRUCKAR - Mat/Dryckestruck (10000kr/dag)
('Step Truck Amerikanaren', 'TRUCKAR', 'Step Truck Amerikanaren - 10000 SEK per dag, 25000 SEK 3 dagar', 10000, 1, 1, false, 0, NULL, NOW(), NOW()),
('Citroën Vintage', 'TRUCKAR', 'Citroën Vintage - 10000 SEK per dag, 25000 SEK 3 dagar', 10000, 1, 1, false, 0, NULL, NOW(), NOW()),
('Volkswagen Buss', 'TRUCKAR', 'Volkswagen Buss - 10000 SEK per dag, 25000 SEK 3 dagar', 10000, 1, 1, false, 0, NULL, NOW(), NOW()),
('Foodtruck Vanlig', 'TRUCKAR', 'Foodtruck Vanlig - 10000 SEK per dag, 25000 SEK 3 dagar', 10000, 2, 2, false, 0, NULL, NOW(), NOW()),
('Foodtruck The Best', 'TRUCKAR', 'Foodtruck The Best - 10000 SEK per dag, 25000 SEK 3 dagar', 10000, 1, 1, false, 0, NULL, NOW(), NOW()),

-- CYKLAR
('Eventcykel', 'CYKLAR', 'Eventcykel - 2500 SEK per dag', 2500, 3, 3, false, 0, NULL, NOW(), NOW()),
('Fryscykel', 'CYKLAR', 'Fryscykel - 4000 SEK per dag', 4000, 1, 1, false, 0, NULL, NOW(), NOW()),
('Cafécykel med Markis', 'CYKLAR', 'Cafécykel med Markis - 4000 SEK per dag', 4000, 1, 1, false, 0, NULL, NOW(), NOW()),
('Moppe Piaggio Ape', 'CYKLAR', 'Moppe Piaggio Ape - 7500 SEK per dag', 7500, 1, 1, false, 0, NULL, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  base_price_per_day = EXCLUDED.base_price_per_day,
  quantity_total = EXCLUDED.quantity_total,
  quantity_available = EXCLUDED.quantity_available,
  updated_at = NOW();

-- Verify all products are added
SELECT COUNT(*) as total_products, 
       COUNT(DISTINCT category) as total_categories
FROM products
WHERE created_at >= NOW() - INTERVAL '1 hour';
