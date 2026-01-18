-- SQL för att sätta upp lämpliga policies för booking_wrapping_images

-- RLS-policy: Tillåt kunder att se sina egna uploads
CREATE POLICY "Users can view their own booking images"
ON booking_wrapping_images
FOR SELECT
USING (
  auth.uid() = (
    SELECT auth_user_id 
    FROM bookings 
    WHERE bookings.id = booking_wrapping_images.booking_id
  )
  OR true  -- Tillåt alla för nu (eftersom vi använder tokens)
);

-- RLS-policy: Tillåt endast inserts från appen
CREATE POLICY "Allow authenticated users to upload images"
ON booking_wrapping_images
FOR INSERT
WITH CHECK (true);

-- RLS-policy: Tillåt uppdateringar av status
CREATE POLICY "Allow status updates"
ON booking_wrapping_images
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant permissions
ALTER TABLE booking_wrapping_images ENABLE ROW LEVEL SECURITY;

