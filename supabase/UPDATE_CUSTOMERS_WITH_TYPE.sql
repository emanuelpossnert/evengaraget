-- Add customer_type and identification number fields to customers table
-- Allows storing both private and business customers with appropriate ID numbers

-- 1. Add columns if they don't exist
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'business' CHECK (customer_type IN ('private', 'business')),
ADD COLUMN IF NOT EXISTS org_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS personal_number VARCHAR(20);

-- 2. Add comments for clarity
COMMENT ON COLUMN public.customers.customer_type IS 'Type of customer: private (privatperson) or business (företag)';
COMMENT ON COLUMN public.customers.org_number IS 'Organization/Company number (Org.nr) for business customers';
COMMENT ON COLUMN public.customers.personal_number IS 'Personal ID number (Personnummer) for private customers';

-- 3. Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);

-- 4. Update existing customers to have default values
UPDATE public.customers
SET customer_type = 'business'
WHERE customer_type IS NULL;

-- 5. For rows without any ID number, set a placeholder org_number (can be updated later)
UPDATE public.customers
SET org_number = 'N/A'
WHERE org_number IS NULL AND personal_number IS NULL AND customer_type = 'business';

-- 6. Drop existing constraint if it exists (to avoid conflicts)
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS check_org_or_personal;

-- 7. Add check constraint to ensure proper validation
ALTER TABLE public.customers
ADD CONSTRAINT check_org_or_personal CHECK (
  (customer_type = 'business' AND org_number IS NOT NULL) OR
  (customer_type = 'private' AND personal_number IS NOT NULL)
);

-- 8. Enable RLS if not already enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies (if not already set)
DROP POLICY IF EXISTS "Allow authenticated users to view customers" ON public.customers;
CREATE POLICY "Allow authenticated users to view customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create customers" ON public.customers;
CREATE POLICY "Allow authenticated users to create customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON public.customers;
CREATE POLICY "Allow authenticated users to update customers"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
