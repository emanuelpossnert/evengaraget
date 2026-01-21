-- =============================================
-- INVOICES TABLE FOR EVENTGARAGET
-- =============================================

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Booking Reference
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV-2026-001, etc
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Customer Information (snapshot at time of invoice)
  customer_id UUID NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_street_address TEXT,
  customer_postal_code VARCHAR(20),
  customer_city VARCHAR(100),
  customer_country VARCHAR(100),
  customer_org_number VARCHAR(50),
  
  -- Company Information (snapshot)
  company_name VARCHAR(255),
  company_address TEXT,
  company_vat_number VARCHAR(50),
  
  -- Financial
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- Items (as JSONB)
  items JSONB, -- Array of {name, quantity, price, total}
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(100),
  
  -- Notes
  notes TEXT,
  terms_and_conditions TEXT,
  
  -- Metadata
  created_by_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON invoices 
  FOR ALL TO service_role USING (true);
CREATE POLICY "Admins can see all invoices" ON invoices 
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INVOICE TASKS TABLE (for tracking what needs to be billed)
-- =============================================

CREATE TABLE IF NOT EXISTS invoice_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Task Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, invoiced, cancelled
  task_type VARCHAR(100), -- delivery, pickup, event, etc
  
  -- Status Trigger
  completed_date TIMESTAMP WITH TIME ZONE,
  should_invoice_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_tasks_booking ON invoice_tasks(booking_id);
CREATE INDEX idx_invoice_tasks_status ON invoice_tasks(status);

ALTER TABLE invoice_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for service role" ON invoice_tasks 
  FOR ALL TO service_role USING (true);

CREATE TRIGGER update_invoice_tasks_updated_at BEFORE UPDATE ON invoice_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION TO AUTO-CREATE INVOICE TASK
-- =============================================
-- This function is called when a booking is marked as completed
-- It creates an entry in invoice_tasks that will trigger a notification

CREATE OR REPLACE FUNCTION create_invoice_task_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO invoice_tasks (booking_id, title, description, should_invoice_at)
    VALUES (
      NEW.id,
      'Fakturera bokning: ' || NEW.booking_number,
      'Bokningen är slutförd och bör faktureras',
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS auto_create_invoice_task ON bookings;
CREATE TRIGGER auto_create_invoice_task AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_invoice_task_on_completion();

-- =============================================
-- DONE
-- =============================================
-- Run this script in Supabase SQL Editor
-- All tables, indexes, RLS policies and triggers will be created
