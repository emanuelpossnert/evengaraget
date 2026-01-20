-- SQL View for Printer: Confirmed orders with foiling
-- This view shows all confirmed bookings that have foliering (wrapping) requested
CREATE OR REPLACE VIEW printer_foiling_orders AS
SELECT 
  b.id,
  b.booking_number,
  b.event_date,
  b.location,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.email AS customer_email,
  b.products_requested,
  b.status,
  COUNT(bwi.id) AS image_count,
  MAX(bwi.uploaded_at) AS latest_image_uploaded
FROM bookings b
JOIN customers c ON b.customer_id = c.id
LEFT JOIN booking_wrapping_images bwi ON b.id = bwi.booking_id
WHERE 
  -- Only confirmed bookings
  b.status = 'confirmed' 
  AND b.products_requested IS NOT NULL
  AND (
    -- Handle both formats: with and without spaces around colon
    b.products_requested::text ILIKE '%"wrapping_requested"%true%'
    OR b.products_requested::text ILIKE '%wrapping_requested%:%true%'
  )
GROUP BY b.id, b.booking_number, b.event_date, b.location, c.name, c.phone, c.email, b.products_requested, b.status
ORDER BY b.event_date ASC;

-- Grant access to authenticated users
GRANT SELECT ON printer_foiling_orders TO authenticated;

-- RLS: Only users with role 'printer' can access foiling orders
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Printer can view confirmed foiling orders" ON bookings;
CREATE POLICY "Printer can view confirmed foiling orders"
ON bookings FOR SELECT
USING (
  status = 'confirmed' 
  AND products_requested IS NOT NULL
  AND (
    products_requested::text ILIKE '%"wrapping_requested"%true%'
    OR products_requested::text ILIKE '%wrapping_requested%:%true%'
  )
  AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'printer'
);

-- RLS for booking_wrapping_images
ALTER TABLE booking_wrapping_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Printer can view foiling images" ON booking_wrapping_images;
CREATE POLICY "Printer can view foiling images"
ON booking_wrapping_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND b.status = 'confirmed'
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'printer'
  )
);

DROP POLICY IF EXISTS "Customers can upload foiling images" ON booking_wrapping_images;
CREATE POLICY "Customers can upload foiling images"
ON booking_wrapping_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid()
      AND role = ANY(ARRAY['admin', 'manager', 'support', 'customer'])
    ) IS NOT NULL
  )
);
