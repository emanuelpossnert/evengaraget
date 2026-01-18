-- 1. Kontrollera vad som finns i booking_tasks
SELECT COUNT(*) as total_tasks FROM booking_tasks;

-- 2. Se alla befintliga bookings som borde ha tasks
SELECT id, booking_number, status, created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. Se vilka bokningar som INTE har tasks ännu
SELECT b.id, b.booking_number, b.status, COUNT(bt.id) as task_count
FROM bookings b
LEFT JOIN booking_tasks bt ON b.id = bt.booking_id
GROUP BY b.id, b.booking_number, b.status
ORDER BY b.created_at DESC;
