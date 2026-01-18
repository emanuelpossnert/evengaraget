-- Add VIP segment to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- Create function to update VIP status based on total_revenue
CREATE OR REPLACE FUNCTION update_customer_vip_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update VIP status: true if total_revenue >= 100000, false otherwise
  NEW.is_vip = (NEW.total_revenue >= 100000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_update_customer_vip_status ON customers;

-- Create trigger to automatically update VIP status when total_revenue changes
CREATE TRIGGER trg_update_customer_vip_status
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customer_vip_status();

-- Update existing customers based on their total_revenue
UPDATE customers
SET is_vip = (total_revenue >= 100000)
WHERE total_revenue >= 100000 OR is_vip = true;

-- Verify
SELECT 
  name,
  total_revenue,
  is_vip,
  CASE 
    WHEN total_revenue >= 100000 THEN '👑 VIP'
    ELSE 'Standard'
  END as customer_tier
FROM customers
ORDER BY total_revenue DESC
LIMIT 10;

