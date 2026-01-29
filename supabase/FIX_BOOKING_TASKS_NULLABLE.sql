-- Fix booking_tasks table to make booking_id nullable
-- This allows creating standalone tasks (not linked to bookings)

ALTER TABLE public.booking_tasks
ALTER COLUMN booking_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN public.booking_tasks.booking_id IS 'Optional reference to booking; can be null for standalone tasks';

-- Optional: Create index on booking_id for queries (may already exist)
-- CREATE INDEX IF NOT EXISTS idx_booking_tasks_booking_id ON public.booking_tasks(booking_id);
