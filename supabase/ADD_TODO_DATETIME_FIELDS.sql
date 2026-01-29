-- Add time fields to booking_tasks for To-Do scheduling
-- Allows To-Dos to span multiple days with specific times

ALTER TABLE public.booking_tasks
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add comments for clarity
COMMENT ON COLUMN public.booking_tasks.start_date IS 'Start date of the task (for To-Do scheduling)';
COMMENT ON COLUMN public.booking_tasks.start_time IS 'Start time of the task (HH:MM format)';
COMMENT ON COLUMN public.booking_tasks.end_date IS 'End date of the task (can be same as start_date or later for multi-day tasks)';
COMMENT ON COLUMN public.booking_tasks.end_time IS 'End time of the task (HH:MM format)';

-- Create index for calendar queries
CREATE INDEX IF NOT EXISTS idx_booking_tasks_start_date 
ON public.booking_tasks(start_date);

CREATE INDEX IF NOT EXISTS idx_booking_tasks_date_range 
ON public.booking_tasks(start_date, end_date);
