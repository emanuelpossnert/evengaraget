-- CLEANUP: Remove existing constraint and columns (start fresh)

-- 1. Drop existing constraint if it exists
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS check_org_or_personal;

-- 2. Drop columns if they exist (complete reset)
ALTER TABLE public.customers DROP COLUMN IF EXISTS customer_type CASCADE;
ALTER TABLE public.customers DROP COLUMN IF EXISTS org_number CASCADE;
ALTER TABLE public.customers DROP COLUMN IF EXISTS personal_number CASCADE;

-- 3. Now add them fresh
ALTER TABLE public.customers
ADD COLUMN customer_type VARCHAR(20) DEFAULT 'business' CHECK (customer_type IN ('private', 'business')),
ADD COLUMN org_number VARCHAR(20),
ADD COLUMN personal_number VARCHAR(20);

-- 4. Update existing rows to have sensible defaults
UPDATE public.customers
SET customer_type = 'business',
    org_number = 'TBD'
WHERE org_number IS NULL AND personal_number IS NULL;

-- 5. Add the check constraint
ALTER TABLE public.customers
ADD CONSTRAINT check_org_or_personal CHECK (
  (customer_type = 'business' AND org_number IS NOT NULL) OR
  (customer_type = 'private' AND personal_number IS NOT NULL)
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);

-- 7. Add comments
COMMENT ON COLUMN public.customers.customer_type IS 'Type of customer: private (privatperson) or business (företag)';
COMMENT ON COLUMN public.customers.org_number IS 'Organization/Company number (Org.nr) for business customers';
COMMENT ON COLUMN public.customers.personal_number IS 'Personal ID number (Personnummer) for private customers';
