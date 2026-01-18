-- SKAPA TASKS AUTOMATISKT FÖR ALLA BOKNINGAR

-- Steg 1: Skapa "Granska bokning" task för alla bokningar som är i "draft" eller "pending" status
INSERT INTO booking_tasks (booking_id, task_type, title, description, priority, status, due_date, assigned_to_name)
SELECT 
  b.id,
  'review',
  'Granska bokning',
  'Bokningsuppgifterna behöver granskas och godkännas',
  'high',
  CASE 
    WHEN b.status = 'granska' THEN 'pending'
    WHEN b.status = 'pending' THEN 'in_progress'
    ELSE 'completed'
  END,
  CURRENT_DATE + interval '1 day',
  'EventGaraget Admin'
FROM bookings b
LEFT JOIN booking_tasks bt ON b.id = bt.booking_id AND bt.task_type = 'review'
WHERE bt.id IS NULL  -- Skapa bara om task inte redan finns
  AND b.status IN ('granska', 'pending', 'confirmed');

-- Steg 2: Skapa "Skicka bekräftelse till kund" task för confirmed bokningar
INSERT INTO booking_tasks (booking_id, task_type, title, description, priority, status, due_date, assigned_to_name)
SELECT 
  b.id,
  'confirm',
  'Skicka bekräftelse till kund',
  'Bekräftelselänk och detaljbox ska ha skickats till kund',
  'high',
  CASE 
    WHEN b.status = 'confirmed' THEN 'in_progress'
    ELSE 'completed'
  END,
  CURRENT_DATE + interval '1 day',
  'EventGaraget Admin'
FROM bookings b
LEFT JOIN booking_tasks bt ON b.id = bt.booking_id AND bt.task_type = 'confirm'
WHERE bt.id IS NULL  -- Skapa bara om task inte redan finns
  AND b.status IN ('pending', 'confirmed');

-- Steg 3: Skapa "Vänta på kundbekräftelse" task för confirmed bokningar
INSERT INTO booking_tasks (booking_id, task_type, title, description, priority, status, due_date, assigned_to_name)
SELECT 
  b.id,
  'follow_up',
  'Vänta på kundbekräftelse',
  'Länk skickad till kund - väntar på att de godkänner och laddar upp designs',
  'medium',
  'pending',
  b.event_date - interval '7 days',  -- Sätt deadline 7 dagar före event
  'EventGaraget Admin'
FROM bookings b
LEFT JOIN booking_tasks bt ON b.id = bt.booking_id AND bt.task_type = 'follow_up'
WHERE bt.id IS NULL  -- Skapa bara om task inte redan finns
  AND b.status = 'confirmed'
  AND b.event_date IS NOT NULL;

-- Steg 4: Skapa "Förbered för leverans" task för bokningar nära event-datum
INSERT INTO booking_tasks (booking_id, task_type, title, description, priority, status, due_date, assigned_to_name)
SELECT 
  b.id,
  'custom',
  'Förbered för leverans',
  'Kontrollera att allt är klart för leverans (designs godkända, produkter redo, etc)',
  'high',
  'pending',
  b.event_date - interval '3 days',
  'EventGaraget Admin'
FROM bookings b
LEFT JOIN booking_tasks bt ON b.id = bt.booking_id AND bt.task_type = 'custom' AND bt.title = 'Förbered för leverans'
WHERE bt.id IS NULL
  AND b.status = 'confirmed'
  AND b.event_date IS NOT NULL
  AND b.event_date > CURRENT_DATE
  AND b.event_date <= CURRENT_DATE + interval '30 days';
