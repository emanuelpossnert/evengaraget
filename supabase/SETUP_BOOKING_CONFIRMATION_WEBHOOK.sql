-- ===================================================
-- SUPABASE WEBHOOK FOR BOOKING CONFIRMATION EMAILS
-- ===================================================

-- 1. CREATE WEBHOOK
-- Go to Supabase Console → Database → Webhooks
-- Create New Webhook with these settings:

/*
Webhook Name: booking-confirmation-email
Events: INSERT on booking_confirmations table
HTTP Push with POST method
URL: https://reita-orthostichous-imagistically.ngrok-free.dev/webhook/booking-confirmation

Advanced Settings:
- Retry count: 3
- Send self-signed certs: Yes (for ngrok)
*/

-- 2. OR USE SQL TO CREATE (if your version supports it)

-- Check if webhook already exists
SELECT * FROM pg_class WHERE relname = 'webhooks';

-- Create trigger function (if not exists)
CREATE OR REPLACE FUNCTION "public"."send_booking_confirmation_webhook"() 
RETURNS "pg_trigger" 
LANGUAGE "plpgsql" 
AS $$
BEGIN
  -- Send webhook to N8N
  -- This is handled by Supabase webhooks UI, not via SQL trigger
  RETURN NEW;
END;
$$;

-- ===================================================
-- WEBHOOK PAYLOAD STRUCTURE (what N8N receives)
-- ===================================================

/*
{
  "type": "INSERT",
  "schema": "public",
  "table": "booking_confirmations",
  "record": {
    "id": "uuid",
    "booking_id": "uuid",
    "email_sent": false,
    "created_at": "2025-01-13T10:00:00Z"
  },
  "old_record": null
}
*/

-- ===================================================
-- VERIFICATION QUERIES
-- ===================================================

-- Check booking_confirmations table
SELECT * FROM public.booking_confirmations LIMIT 5;

-- Check outgoing_emails log
SELECT * FROM public.outgoing_emails WHERE email_type = 'booking_confirmation' LIMIT 5;

-- Check booking_tokens
SELECT * FROM public.booking_tokens LIMIT 5;
