-- Create booking_notes table for storing notes on bookings
CREATE TABLE IF NOT EXISTS public.booking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by_email VARCHAR(255),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_booking_notes_booking_id ON public.booking_notes(booking_id);
CREATE INDEX idx_booking_notes_created_at ON public.booking_notes(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_booking_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_notes_updated_at ON public.booking_notes;
CREATE TRIGGER trg_booking_notes_updated_at
  BEFORE UPDATE ON public.booking_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_notes_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_notes TO authenticated;
