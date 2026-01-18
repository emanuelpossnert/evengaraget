-- Create booking_tasks table for CRM TODO list
CREATE TABLE IF NOT EXISTS booking_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  task_type VARCHAR(50),  -- 'review', 'confirm', 'follow_up', 'response_needed', 'custom'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'cancelled'
  assigned_to_name VARCHAR(255),  -- Admin name (text, not FK)
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_tasks_booking_id ON booking_tasks(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_tasks_status ON booking_tasks(status);
CREATE INDEX IF NOT EXISTS idx_booking_tasks_due_date ON booking_tasks(due_date);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_booking_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_booking_tasks_timestamp ON booking_tasks;
CREATE TRIGGER trg_update_booking_tasks_timestamp
BEFORE UPDATE ON booking_tasks
FOR EACH ROW
EXECUTE FUNCTION update_booking_tasks_timestamp();

-- Disable RLS for development (optional - enable in production)
ALTER TABLE booking_tasks DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON booking_tasks TO authenticated;
