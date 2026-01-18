-- SQL View for Printer: Confirmed orders with foiling
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
  -- Endast bekräftade ordrar
  b.status = 'confirmed' 
  -- Och har foilering vald (JSONB contains check)
  AND (
    b.products_requested::text ILIKE '%"wrapping_requested"%true%'
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(b.products_requested) elem
      WHERE elem->>'wrapping_requested' = 'true'
    )
  )
GROUP BY b.id, b.booking_number, b.event_date, b.location, c.name, c.phone, c.email, b.products_requested, b.status
ORDER BY b.event_date ASC;

-- Grant access to authenticated users (will be filtered by RLS)
GRANT SELECT ON printer_foiling_orders TO authenticated;

-- Optional: Drop existing policies if they exist
DROP POLICY IF EXISTS "Printer can view confirmed foiling orders" ON bookings;
DROP POLICY IF EXISTS "Printer can view foiling images" ON booking_wrapping_images;

-- RLS: Only users with role 'printer' can access foiling orders
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Printer can view confirmed foiling orders"
ON bookings FOR SELECT
USING (
  status = 'confirmed' 
  AND (
    products_requested::text ILIKE '%"wrapping_requested"%true%'
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(products_requested) elem
      WHERE elem->>'wrapping_requested' = 'true'
    )
  )
  AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'printer'
);

-- RLS for booking_wrapping_images
ALTER TABLE booking_wrapping_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Printer can view foiling images"
ON booking_wrapping_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = booking_id 
    AND status = 'confirmed'
    AND (
      products_requested::text ILIKE '%"wrapping_requested"%true%'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(products_requested) elem
        WHERE elem->>'wrapping_requested' = 'true'
      )
    )
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'printer'
  )
);
