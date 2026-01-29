-- Add customer_type and org/personal number columns to customers table
-- Run this in Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'private' CHECK (customer_type IN ('private', 'company')),
ADD COLUMN IF NOT EXISTS org_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS personal_number VARCHAR(20);

-- Add comments for clarity
COMMENT ON COLUMN public.customers.customer_type IS 'Type of customer: private (person) or company';
COMMENT ON COLUMN public.customers.org_number IS 'Organization number for company customers (e.g., 556123-4567)';
COMMENT ON COLUMN public.customers.personal_number IS 'Personal identification number for private customers (e.g., 198501011234)';

-- Update RLS policies if needed (if using existing auth-based policies, this should work automatically)
-- For new inserts, these fields will be accessible to authenticated users
