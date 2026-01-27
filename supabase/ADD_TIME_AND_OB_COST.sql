-- ============================================================================
-- ADD PICKUP_TIME AND DELIVERY_TIME TO BOOKINGS TABLE
-- Add OB (Overtime) cost calculation
-- ============================================================================

-- 1. Add time columns to bookings table
ALTER TABLE IF EXISTS public.bookings
ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(5); -- Format: HH:MM

ALTER TABLE IF EXISTS public.bookings
ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(5); -- Format: HH:MM

ALTER TABLE IF EXISTS public.bookings
ADD COLUMN IF NOT EXISTS ob_cost DECIMAL(10, 2) DEFAULT 0; -- OB (Overtime) cost

-- 2. Create helper table for Swedish holidays (Holidays 2025-2026)
CREATE TABLE IF NOT EXISTS public.swedish_holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert Swedish holidays for 2025-2026
INSERT INTO public.swedish_holidays (date, name, description) VALUES
-- 2025
('2025-01-01', 'Nyårsdagen', 'New Year''s Day'),
('2025-01-06', 'Trettondedag jul', 'Epiphany'),
('2025-04-18', 'Långfredagen', 'Good Friday'),
('2025-04-20', 'Påskdagen', 'Easter Sunday'),
('2025-04-21', 'Andra påskdagen', 'Easter Monday'),
('2025-05-01', 'Första maj', 'Labour Day'),
('2025-05-09', 'Kristi himmelsfärdsdag', 'Ascension Day'),
('2025-05-19', 'Pingstdagen', 'Whit Sunday'),
('2025-06-06', 'Sveriges nationaldag', 'Swedish National Day'),
('2025-06-21', 'Midsommardagen', 'Midsummer Day'),
('2025-11-01', 'Alla helgons dag', 'All Saints'' Day'),
('2025-12-24', 'Julafton', 'Christmas Eve'),
('2025-12-25', 'Juldagen', 'Christmas Day'),
('2025-12-26', 'Andra juldagen', 'Boxing Day'),
('2025-12-31', 'Nyårsafton', 'New Year''s Eve'),
-- 2026
('2026-01-01', 'Nyårsdagen', 'New Year''s Day'),
('2026-01-06', 'Trettondedag jul', 'Epiphany'),
('2026-04-03', 'Långfredagen', 'Good Friday'),
('2026-04-05', 'Påskdagen', 'Easter Sunday'),
('2026-04-06', 'Andra påskdagen', 'Easter Monday'),
('2026-05-01', 'Första maj', 'Labour Day'),
('2026-05-14', 'Kristi himmelsfärdsdag', 'Ascension Day'),
('2026-05-24', 'Pingstdagen', 'Whit Sunday'),
('2026-06-06', 'Sveriges nationaldag', 'Swedish National Day'),
('2026-06-20', 'Midsommardagen', 'Midsummer Day'),
('2026-11-01', 'Alla helgons dag', 'All Saints'' Day'),
('2026-12-24', 'Julafton', 'Christmas Eve'),
('2026-12-25', 'Juldagen', 'Christmas Day'),
('2026-12-26', 'Andra juldagen', 'Boxing Day'),
('2026-12-31', 'Nyårsafton', 'New Year''s Eve')
ON CONFLICT (date) DO NOTHING;

-- 4. Create index for faster holiday lookups
CREATE INDEX IF NOT EXISTS idx_swedish_holidays_date ON public.swedish_holidays(date);

-- 5. Enable RLS on holidays table
ALTER TABLE public.swedish_holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to swedish_holidays" ON public.swedish_holidays;
CREATE POLICY "Allow read access to swedish_holidays" ON public.swedish_holidays
  FOR SELECT USING (true);

-- 6. Grant permissions
GRANT SELECT ON public.swedish_holidays TO authenticated, anon, service_role;

-- 7. Verify changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name IN ('pickup_time', 'delivery_time', 'ob_cost')
ORDER BY ordinal_position;

SELECT COUNT(*) as total_holidays
FROM public.swedish_holidays
WHERE EXTRACT(YEAR FROM date) IN (2025, 2026);
