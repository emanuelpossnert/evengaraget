-- Auto-create pickup and delivery tasks when booking is confirmed
CREATE OR REPLACE FUNCTION create_warehouse_tasks_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create tasks when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Create PICKUP task (pickup_date)
    IF NEW.pickup_date IS NOT NULL THEN
      INSERT INTO booking_tasks (
        booking_id,
        title,
        description,
        priority,
        status,
        task_type,
        due_date,
        created_at
      ) VALUES (
        NEW.id,
        'Upphämtning: ' || NEW.booking_number,
        'Upphämta material för bokning ' || NEW.booking_number || ' från ' || COALESCE(NEW.location, 'N/A'),
        'medium',
        'pending',
        'pickup',
        NEW.pickup_date,
        NOW()
      );
    END IF;

    -- Create DELIVERY task (delivery_date)
    IF NEW.delivery_date IS NOT NULL THEN
      INSERT INTO booking_tasks (
        booking_id,
        title,
        description,
        priority,
        status,
        task_type,
        due_date,
        created_at
      ) VALUES (
        NEW.id,
        'Leverans: ' || NEW.booking_number,
        'Leverera material för bokning ' || NEW.booking_number || ' till ' || COALESCE(NEW.location, 'N/A'),
        'medium',
        'pending',
        'delivery',
        NEW.delivery_date,
        NOW()
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_create_warehouse_tasks ON bookings;

-- Create trigger
CREATE TRIGGER trg_create_warehouse_tasks
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_warehouse_tasks_on_confirm();

GRANT EXECUTE ON FUNCTION create_warehouse_tasks_on_confirm() TO authenticated;
