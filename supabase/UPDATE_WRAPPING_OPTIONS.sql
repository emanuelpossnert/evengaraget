-- ============================================================================
-- UPDATE WRAPPING/FOLIERING OPTIONS FOR PRODUCTS
-- Based on the product list provided
-- ============================================================================

-- EVENTMASKINER - Branding/Folierbarhet
UPDATE products SET can_be_wrapped = true, wrapping_cost = 6900 WHERE name = 'Basketmaskin';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 5900 WHERE name = 'Jukebox';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 3800 WHERE name = 'Shuffleboard';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 6000 WHERE name = 'Godisutomat STOR';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 8000 WHERE name = 'Airhockey';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 6300 WHERE name = 'Popcornvagn LITEN'; -- 4500 + 1800
UPDATE products SET can_be_wrapped = true, wrapping_cost = 7000 WHERE name = 'Popcornvagn STOR'; -- 3500 + 3500
UPDATE products SET can_be_wrapped = true, wrapping_cost = 6000 WHERE name = 'Godishylla STOR';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 4600 WHERE name = 'Godishylla LITEN'; -- 2800 + 1800
UPDATE products SET can_be_wrapped = true, wrapping_cost = 3900 WHERE name = 'Catch The Light';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 3900 WHERE name = 'Boxningsmaskin';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 5900 WHERE name = 'CashCube';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 6900 WHERE name = 'Flipperspel';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 5900 WHERE name = 'Vending Machine';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 5900 WHERE name = 'Lucky7';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 7000 WHERE name = 'Fotobås';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 1900 WHERE name = '360-foto';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 3000 WHERE name = 'Pingisbord';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 4500 WHERE name = 'Human Chess';

-- TRUCKAR - Helfoliering alternativ (vi använder den högsta: 65000 SEK)
-- Dock bör detta egentligen hanteras som addons istället
UPDATE products SET can_be_wrapped = true, wrapping_cost = 65000 WHERE name = 'Step Truck Amerikanaren';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 65000 WHERE name = 'Citroën Vintage';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 65000 WHERE name = 'Volkswagen Buss';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 65000 WHERE name = 'Foodtruck Vanlig';
UPDATE products SET can_be_wrapped = true, wrapping_cost = 65000 WHERE name = 'Foodtruck The Best';

-- CYKLAR - Branding options
UPDATE products SET can_be_wrapped = true, wrapping_cost = 5500 WHERE name = 'Eventcykel'; -- Branding foliering
UPDATE products SET can_be_wrapped = true, wrapping_cost = 6500 WHERE name = 'Fryscykel'; -- Helfoliering
UPDATE products SET can_be_wrapped = true, wrapping_cost = 6800 WHERE name = 'Cafécykel med Markis'; -- Branding foliering
UPDATE products SET can_be_wrapped = true, wrapping_cost = 0 WHERE name = 'Moppe Piaggio Ape'; -- Ingen wrapping info

-- Verify updates
SELECT name, category, wrapping_cost, can_be_wrapped
FROM products
WHERE can_be_wrapped = true
ORDER BY category, name;