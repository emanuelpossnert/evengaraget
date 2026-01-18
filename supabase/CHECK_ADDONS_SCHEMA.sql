-- Check if addons table exists and show its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'addons'
ORDER BY ordinal_position;