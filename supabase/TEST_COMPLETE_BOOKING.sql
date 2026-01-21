-- =============================================
-- TEST SCRIPT: Complete a booking for invoice testing
-- =============================================

-- First, let's see what bookings we have
SELECT 
  id,
  booking_number,
  status,
  customer_id,
  total_amount,
  event_date,
  created_at
FROM bookings
WHERE status IN ('draft', 'pending', 'confirmed')
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- Now update the FIRST CONFIRMED booking to COMPLETED
-- =============================================
UPDATE bookings
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM bookings
  WHERE status = 'confirmed'
  ORDER BY created_at DESC
  LIMIT 1
)
RETURNING 
  booking_number,
  status,
  total_amount,
  customer_id;

-- =============================================
-- Verify the change
-- =============================================
SELECT 
  booking_number,
  status,
  total_amount
FROM bookings
WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 1;
