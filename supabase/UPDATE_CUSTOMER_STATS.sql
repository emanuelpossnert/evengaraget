-- =====================================================
-- UPDATE CUSTOMER STATISTICS FROM BOOKINGS
-- =====================================================
-- This script updates customer KPIs when bookings change status
-- Run this in Supabase SQL Editor

-- 1. CREATE FUNCTION TO UPDATE CUSTOMER STATS
CREATE OR REPLACE FUNCTION update_customer_stats(customer_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET 
    total_bookings = (
      SELECT COUNT(*) 
      FROM bookings 
      WHERE customer_id = customer_id_param 
      AND status IN ('confirmed', 'completed')
    ),
    total_revenue = (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM bookings 
      WHERE customer_id = customer_id_param 
      AND status IN ('confirmed', 'completed')
    ),
    lifetime_value = (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM bookings 
      WHERE customer_id = customer_id_param 
      AND status IN ('confirmed', 'completed')
    ),
    updated_at = NOW()
  WHERE id = customer_id_param;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE TRIGGER TO AUTO-UPDATE STATS WHEN BOOKING STATUS CHANGES
CREATE OR REPLACE FUNCTION trigger_update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer stats when booking status changes
  IF NEW.status != OLD.status AND NEW.status IN ('confirmed', 'completed', 'cancelled') THEN
    PERFORM update_customer_stats(NEW.customer_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (using correct syntax for Supabase/PostgreSQL)
BEGIN;
DROP TRIGGER IF EXISTS trg_update_customer_stats_on_booking ON bookings;
COMMIT;

-- Create trigger
CREATE TRIGGER trg_update_customer_stats_on_booking
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_update_customer_stats();

-- 3. RUN INITIAL UPDATE FOR ALL CUSTOMERS
-- This ensures existing data is populated
SELECT update_customer_stats(id) FROM customers;

-- 4. VERIFY THE UPDATES
SELECT 
  id,
  name,
  email,
  total_bookings,
  total_revenue,
  lifetime_value
FROM customers
ORDER BY total_revenue DESC
LIMIT 10;

