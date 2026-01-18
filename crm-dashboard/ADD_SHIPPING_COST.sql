-- Add shipping_cost column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;

-- Add tax_amount column if not exists (for completeness)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'bookings' AND (column_name = 'shipping_cost' OR column_name = 'tax_amount');

