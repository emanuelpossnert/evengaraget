-- Fix: Add UNIQUE constraint to booking_confirmations table
-- This is needed for the ON CONFLICT clause in the trigger

-- First, check if the constraint already exists
-- If it does, drop it to avoid errors
ALTER TABLE IF EXISTS public.booking_confirmations 
DROP CONSTRAINT IF EXISTS uq_booking_id;

-- Add the UNIQUE constraint
ALTER TABLE public.booking_confirmations 
ADD CONSTRAINT uq_booking_id UNIQUE (booking_id);

-- Verify the constraint was added
SELECT constraint_name, table_name, column_name 
FROM information_schema.constraint_column_usage 
WHERE table_name = 'booking_confirmations' AND constraint_name = 'uq_booking_id';

-- Test the ON CONFLICT behavior (optional)
-- This should work now without errors

