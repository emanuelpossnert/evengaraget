-- 🗑️ RESET INVENTORY SYSTEM
-- Kör detta för att ta bort allt och börja om från scratch

-- Drop tables in correct order (respect foreign keys)
DROP TABLE IF EXISTS availability_calendar CASCADE;
DROP TABLE IF EXISTS booking_items CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS check_product_availability(VARCHAR, DATE, DATE, INTEGER);
DROP FUNCTION IF EXISTS suggest_alternative_dates(VARCHAR, DATE, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS reserve_products_for_booking(UUID, JSONB);

-- Nu kan du köra inventory-system.sql igen!

