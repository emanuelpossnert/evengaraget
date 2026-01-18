# N8N Webhook Integration Guide

## Overview
This guide explains how to set up n8n webhooks for:
1. **Booking Confirmation PDF** - Triggered when booking status changes to "confirmed"
2. **Email Sending** - Triggered from customer card email form or booking confirmation

## Architecture

```
┌─────────────────────────────────────────────┐
│         Supabase Database                   │
│  ┌───────────────────────────────────────┐  │
│  │ Bookings Table                        │  │
│  │ - When status → "confirmed"           │  │
│  │   Trigger: trigger_booking_confirmation_webhook()
│  │   ↓ Creates row in booking_confirmations
│  │   ↓ Logs to webhook_logs              │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Outgoing_emails Table                 │  │
│  │ - On INSERT (new email)               │  │
│  │   Trigger: trigger_email_sent_webhook()
│  │   ↓ Logs to webhook_logs              │  │
│  └───────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ (Webhooks called)
                   ↓
         ┌──────────────────┐
         │  N8N Workflows   │
         ├──────────────────┤
         │ Webhook #1:      │
         │ "booking_confirm"│ → Generate PDF + Send Email
         │                  │
         │ Webhook #2:      │
         │ "send_email"     │ → Send Email
         └──────────────────┘
```

## Step 1: Create N8N Webhooks

### Webhook #1: Booking Confirmation (booking_confirm)

**URL Pattern:** `https://your-n8n-instance.com/webhook/booking_confirm`

**Receives:**
```json
{
  "booking_id": "uuid",
  "booking_number": "BOK-123456",
  "customer_id": "uuid",
  "total_amount": 5000,
  "event_date": "2025-01-15",
  "delivery_date": "2025-01-14"
}
```

**What it does:**
1. Fetch booking details from Supabase
2. Generate PDF using booking data
3. Upload PDF to Supabase Storage
4. Send email with PDF attachment via SMTP/Sendgrid
5. Update `booking_confirmations` table with `email_sent = true`

---

### Webhook #2: Send Email (send_email)

**URL Pattern:** `https://your-n8n-instance.com/webhook/send_email`

**Receives:**
```json
{
  "email_id": "uuid",
  "customer_id": "uuid",
  "recipient_email": "customer@example.com",
  "subject": "Your Booking Confirmation",
  "email_type": "booking_confirmation|custom_message"
}
```

**What it does:**
1. Fetch full email from Supabase (with customer context)
2. Send via SMTP/Sendgrid
3. Update `outgoing_emails` table with `status = 'sent'`

---

## Step 2: Update Booking Detail Page (Frontend)

**File:** `/dashboard/bookings/[id]/page.tsx`

When clicking "Godkänn" (Approve) button for a draft booking:

```typescript
const handleApprove = async () => {
  // 1. Update booking status to "pending"
  await supabase
    .from("bookings")
    .update({ status: "pending" })
    .eq("id", bookingId);

  // 2. Update status to "confirmed"
  await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);
  // This triggers: trigger_booking_confirmation_webhook()
  // Which creates booking_confirmations entry
  // Which triggers n8n webhook!
};
```

---

## Step 3: Update Customer Card Email (Frontend)

**File:** `/dashboard/customers/[id]/page.tsx`

When sending email from customer card:

```typescript
const sendEmail = async () => {
  // 1. Save to outgoing_emails table
  const { error } = await supabase.from("outgoing_emails").insert([
    {
      customer_id: customerId,
      recipient_email: customer?.email,
      subject: newEmail.subject,
      body_plain: newEmail.body,
      email_type: "custom_message",
      status: "pending",
    },
  ]);
  // This triggers: trigger_email_sent_webhook()
  // Which triggers n8n webhook!
};
```

---

## Step 4: N8N Workflow Setup

### Example N8N Workflow for Booking Confirmation

1. **Webhook Trigger Node**
   - Listen on: `POST /webhook/booking_confirm`
   - Parse incoming JSON

2. **Supabase Node** (Fetch Booking)
   - Query: SELECT * FROM bookings WHERE id = booking_id
   - Get all booking details

3. **Supabase Node** (Fetch Customer)
   - Query: SELECT * FROM customers WHERE id = customer_id
   - Get customer details

4. **Code Node** (Generate PDF HTML)
   ```javascript
   // Generate booking confirmation HTML
   const html = `
     <h1>Bokningsbekräftelse</h1>
     <p>Bokningsnummer: ${data.booking_number}</p>
     <p>Totalt belopp: ${data.total_amount} SEK</p>
     // ... more details
   `;
   return { html };
   ```

5. **Code Node** (Convert HTML to PDF)
   - Use puppeteer or similar to convert HTML → PDF
   - Return base64 PDF

6. **Supabase Node** (Upload PDF)
   - Upload PDF to `booking_confirmations/` folder in Storage
   - Return: storage_url

7. **Supabase Node** (Update booking_confirmations)
   - UPDATE booking_confirmations
   - SET pdf_url = storage_url, email_sent = true

8. **SMTP/Sendgrid Node** (Send Email)
   - From: noreply@eventgaraget.se
   - To: customer_email
   - Subject: "Bokningsbekräftelse"
   - Attach PDF

9. **Supabase Node** (Update outgoing_emails if used)
   - UPDATE outgoing_emails SET status = 'sent'

---

## Step 5: Webhook Integration in Supabase

Currently, we log to `webhook_logs` table. To actually call n8n:

### Option A: Use Supabase Edge Functions (Recommended)

Create Edge Function that calls n8n:

```typescript
// supabase/functions/webhook-trigger/index.ts
Deno.serve(async (req) => {
  const body = await req.json();
  
  const response = await fetch("https://your-n8n.com/webhook/booking_confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return new Response(JSON.stringify({ success: true }));
});
```

Then call from trigger function:

```sql
CREATE OR REPLACE FUNCTION trigger_booking_confirmation_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function which calls n8n
  PERFORM http_post(
    'https://your-supabase.com/functions/v1/webhook-trigger',
    jsonb_build_object(
      'event', 'booking_confirmed',
      'booking_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Option B: Use pg_cron + HTTP (Simple)

Create scheduled function that checks for new events and calls n8n.

---

## Testing Checklist

- [ ] Booking status changes to "confirmed"
- [ ] Check `booking_confirmations` table for new entry
- [ ] Check `webhook_logs` table for webhook call
- [ ] Verify n8n workflow received webhook
- [ ] PDF generated and uploaded
- [ ] Email sent to customer
- [ ] `booking_confirmations.email_sent = true`
- [ ] Send email from customer card
- [ ] Check `outgoing_emails` table for entry
- [ ] Check `webhook_logs` for send_email trigger
- [ ] Email received

---

## Environment Variables (n8n)

```
N8N_WEBHOOK_URL_BASE=https://your-n8n-instance.com
SENDGRID_API_KEY=your_sendgrid_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

---

## Troubleshooting

1. **Webhook not triggering?**
   - Check `webhook_logs` table for entries
   - Verify n8n webhook URL is reachable
   - Check n8n logs for incoming requests

2. **Email not sending?**
   - Check SMTP credentials in n8n
   - Verify Sendgrid API key
   - Check email spam folder

3. **PDF not generating?**
   - Verify puppeteer/PDF library installed in n8n
   - Check n8n logs for HTML conversion errors
   - Ensure CSS renders correctly

---

## Security Notes

- Use Supabase Service Role Key only in n8n (never client key)
- Add n8n webhook URL to Supabase CORS allow list
- Rate limit webhooks if needed
- Validate webhook signatures for production

