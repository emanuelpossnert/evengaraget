-- First, let's check what confirmed bookings exist
SELECT 
  b.id,
  b.booking_number,
  b.status,
  b.pickup_date,
  b.delivery_date,
  b.event_date,
  b.location,
  COUNT(bt.id) as existing_tasks
FROM bookings b
LEFT JOIN booking_tasks bt ON b.id = bt.booking_id AND bt.task_type IN ('pickup', 'delivery')
WHERE b.status = 'confirmed'
GROUP BY b.id, b.booking_number, b.status, b.pickup_date, b.delivery_date, b.event_date, b.location
ORDER BY b.event_date DESC;

-- Then create missing pickup/delivery tasks for existing confirmed bookings
INSERT INTO booking_tasks (
  booking_id,
  title,
  description,
  priority,
  status,
  task_type,
  due_date,
  created_at
)
SELECT 
  b.id,
  'Upphämtning: ' || b.booking_number,
  'Upphämta material för bokning ' || b.booking_number || ' från ' || COALESCE(b.location, 'N/A'),
  'medium',
  'pending',
  'pickup',
  b.pickup_date,
  NOW()
FROM bookings b
WHERE b.status = 'confirmed'
  AND b.pickup_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM booking_tasks bt 
    WHERE bt.booking_id = b.id 
    AND bt.task_type = 'pickup'
  )

UNION ALL

SELECT 
  b.id,
  'Leverans: ' || b.booking_number,
  'Leverera material för bokning ' || b.booking_number || ' till ' || COALESCE(b.location, 'N/A'),
  'medium',
  'pending',
  'delivery',
  b.delivery_date,
  NOW()
FROM bookings b
WHERE b.status = 'confirmed'
  AND b.delivery_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM booking_tasks bt 
    WHERE bt.booking_id = b.id 
    AND bt.task_type = 'delivery'
  );

-- Verify tasks were created
SELECT 
  bt.id,
  bt.booking_id,
  bt.title,
  bt.task_type,
  bt.due_date,
  b.booking_number
FROM booking_tasks bt
JOIN bookings b ON bt.booking_id = b.id
WHERE bt.task_type IN ('pickup', 'delivery')
  AND b.status = 'confirmed'
ORDER BY bt.due_date DESC;
