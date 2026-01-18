# 🚀 SKAPA BOOKING_TASKS TABELL

Kopiera hela denna SQL-kod och kör den i Supabase SQL Editor:

## STEG 1: Kör denna SQL i Supabase SQL Editor
https://app.supabase.com/project/_/sql/new

```sql
-- Create booking_tasks table for CRM TODO list
CREATE TABLE IF NOT EXISTS booking_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  task_type VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to_name VARCHAR(255),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_tasks_booking_id ON booking_tasks(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_tasks_status ON booking_tasks(status);
CREATE INDEX IF NOT EXISTS idx_booking_tasks_due_date ON booking_tasks(due_date);

-- Trigger för updated_at
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

-- Disable RLS för development
ALTER TABLE booking_tasks DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON booking_tasks TO authenticated;
```

**Klicka RUN (eller Ctrl+Enter) för att köra SQL**

✅ När det är klart, procedera till nästa steg.
