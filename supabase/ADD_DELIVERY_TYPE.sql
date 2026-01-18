-- Add delivery_type column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'internal' CHECK (delivery_type IN ('internal', 'external'));

-- Function to detect if address is in Stockholm area based on postal code
CREATE OR REPLACE FUNCTION detect_delivery_type(p_postal_code VARCHAR, p_city VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  -- Stockholm area: postal codes starting with 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
  -- or cities containing 'Stockholm' or 'stockholm'
  IF p_postal_code IS NULL AND p_city IS NULL THEN
    RETURN 'internal'; -- Default to internal if no info
  END IF;
  
  -- Check postal code (Stockholm area: 10000-19999)
  IF p_postal_code IS NOT NULL THEN
    IF p_postal_code ~ '^(10|11|12|13|14|15|16|17|18|19)[0-9]{3}$' THEN
      RETURN 'internal';
    END IF;
  END IF;
  
  -- Check city
  IF p_city IS NOT NULL THEN
    IF LOWER(p_city) LIKE '%stockholm%' THEN
      RETURN 'internal';
    END IF;
  END IF;
  
  -- Default to external if not Stockholm
  RETURN 'external';
END;
$$ LANGUAGE plpgsql;

-- Function to determine default shipping cost based on delivery type
CREATE OR REPLACE FUNCTION get_default_shipping_cost(p_delivery_type VARCHAR)
RETURNS DECIMAL AS $$
BEGIN
  IF p_delivery_type = 'internal' THEN
    RETURN 0; -- Free delivery in Stockholm
  ELSE
    RETURN 0; -- Set to 0, admin can override per booking
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing bookings with delivery type based on postal code
UPDATE bookings
SET delivery_type = detect_delivery_type(delivery_postal_code, delivery_city)
WHERE delivery_type IS NULL OR delivery_type = 'internal';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_type ON bookings(delivery_type);

-- Verify the data
SELECT 
  delivery_type,
  delivery_postal_code,
  delivery_city,
  COUNT(*) as booking_count
FROM bookings
GROUP BY delivery_type, delivery_postal_code, delivery_city
ORDER BY delivery_type, delivery_postal_code;

