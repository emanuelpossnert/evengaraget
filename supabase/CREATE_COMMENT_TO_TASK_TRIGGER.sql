-- SKAPA TRIGGER FÖR AUTOMATISK TASK GENERERING NÄR NYT COMMENT KOMMER

-- 1. Skapa trigger-funktion som skapar task när nytt booking_comment INSERT
CREATE OR REPLACE FUNCTION create_task_on_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Skapa task om meddelandet är från kund (sender_type = 'customer')
  IF NEW.sender_type = 'customer' THEN
    INSERT INTO booking_tasks (booking_id, task_type, title, description, priority, status, due_date, assigned_to_name)
    VALUES (
      NEW.booking_id,
      'response_needed',
      'Svar på kundfråga',
      'Kund: ' || NEW.sender_name || ' - ' || NEW.message,
      'high',
      'pending',
      CURRENT_DATE + interval '1 day',
      'EventGaraget Admin'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Koppla trigger till booking_comments tabellen
DROP TRIGGER IF EXISTS trg_create_task_on_new_comment ON booking_comments;
CREATE TRIGGER trg_create_task_on_new_comment
AFTER INSERT ON booking_comments
FOR EACH ROW
EXECUTE FUNCTION create_task_on_new_comment();

-- 3. Verifiera att triggern är aktiv
SELECT trigger_name, event_object_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_create_task_on_new_comment';
