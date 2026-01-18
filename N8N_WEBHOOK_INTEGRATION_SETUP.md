# N8N Webhook Integration - Booking Confirmation & Email

## 🎯 Overview

**Frontend → Supabase (Webhook Triggers) → N8N (Process & Send)**

```
┌─────────────────┐
│   Frontend CRM  │
│  (Next.js App)  │
└────────┬────────┘
         │ User clicks "Godkänn" or sends email
         ↓
┌─────────────────────────────────┐
│  Supabase Database              │
│  - booking updated → "confirmed"│
│  - email inserted → "pending"   │
│         ↓ (automatic triggers)  │
│  - trigger_booking_confirmation_webhook()
│  - trigger_email_sent_webhook() │
│  - Logs to webhook_logs         │
│  - Creates booking_confirmations│
└────────┬────────────────────────┘
         │ (DB logs webhook event)
         ↓ (N8N polls webhook_logs)
┌─────────────────────────────────┐
│      N8N Workflows              │
│  1. Booking-Confirmation        │
│     - Fetch booking data        │
│     - Build confirmation HTML   │
│     - Send email via Gmail      │
│     - Update status "sent"      │
│                                 │
│  2. Send-Email                  │
│     - Fetch email record        │
│     - Send via Gmail            │
│     - Update status "sent"      │
└─────────────────────────────────┘
```

---

## 📋 Setup Instructions

### **STEG 1: Supabase - Kör Migration Script**

✅ **File:** `supabase/SAFE_MIGRATE_WEBHOOK_TABLES.sql`

```sql
-- Kör i Supabase SQL Editor
-- Detta skapar:
-- - booking_confirmations
-- - outgoing_emails
-- - webhook_logs
-- + triggers
```

**Verifiera:**
```sql
SELECT * FROM webhook_logs;
SELECT * FROM booking_confirmations;
SELECT * FROM outgoing_emails;
```

---

### **STEG 2: Import N8N Workflows**

#### **2A. Booking Confirmation Workflow**

**File:** `workflows/EventGaraget-BOOKING-CONFIRMATION.json`

1. Öppna N8N
2. Click "Import from File"
3. Välj `EventGaraget-BOOKING-CONFIRMATION.json`
4. Update credentials:
   - ✅ Supabase API connection
   - ✅ Gmail account (for sending emails)
5. Click "Deploy"

**Webhook URL:** `https://your-n8n-instance.com/webhook/booking-confirmation`

---

#### **2B. Send Email Workflow**

**File:** `workflows/EventGaraget-SEND-EMAIL.json`

1. Öppna N8N
2. Click "Import from File"
3. Välj `EventGaraget-SEND-EMAIL.json`
4. Update credentials (same as above)
5. Click "Deploy"

**Webhook URL:** `https://your-n8n-instance.com/webhook/send-email`

---

### **STEG 3: Frontend - Code Already Updated ✅**

**Files Updated:**
- ✅ `/crm-dashboard/app/dashboard/bookings/[id]/page.tsx`
  - `handleApprove()` now triggers webhook via DB trigger
  
- ✅ `/crm-dashboard/app/dashboard/customers/[id]/page.tsx`
  - `sendEmail()` now saves to `outgoing_emails` table (status: "pending")
  - This triggers webhook via DB trigger

---

## 🔄 How It Works

### **Scenario 1: User Approves Booking**

```
1. User clicks "Godkänn" button on /dashboard/bookings/[id]
2. Frontend updates: bookings.status = "pending"
3. Supabase trigger activates: trigger_booking_confirmation_webhook()
4. Creates row in booking_confirmations
5. Logs to webhook_logs table
6. N8N workflow picks up the event (if polling webhook_logs)
7. N8N:
   - Gets booking details
   - Gets customer details
   - Gets products
   - Builds HTML email
   - Sends via Gmail
   - Updates booking_confirmations.email_sent = true
8. Customer receives confirmation email ✉️
```

### **Scenario 2: User Sends Email from Customer Card**

```
1. User types email in customer card
2. Clicks "Skicka"
3. Frontend inserts into outgoing_emails (status: "pending")
4. Supabase trigger activates: trigger_email_sent_webhook()
5. Logs to webhook_logs table
6. N8N workflow picks up the event
7. N8N:
   - Gets email record
   - Gets customer info
   - Formats email
   - Sends via Gmail
   - Updates outgoing_emails.status = "sent"
8. Customer receives email ✉️
```

---

## 🧪 Testing

### **Test 1: Booking Confirmation**

```sql
-- 1. Find a draft booking
SELECT id, booking_number, status FROM bookings WHERE status = 'draft' LIMIT 1;

-- 2. Manually update it to "pending" (simulating frontend click)
UPDATE bookings 
SET status = 'pending' 
WHERE id = 'xxx-xxx-xxx';

-- 3. Check webhook_logs to see if trigger fired
SELECT * FROM webhook_logs 
WHERE event_type = 'booking_confirmed' 
ORDER BY created_at DESC LIMIT 1;

-- 4. Check booking_confirmations
SELECT * FROM booking_confirmations 
WHERE booking_id = 'xxx-xxx-xxx';

-- 5. Check if N8N picked it up (look at N8N logs)
-- It should have called the webhook and sent email
```

### **Test 2: Send Email from CRM**

```sql
-- 1. Insert test email into outgoing_emails
INSERT INTO outgoing_emails (
  customer_id,
  recipient_email,
  subject,
  body_plain,
  email_type,
  status
) VALUES (
  'customer-uuid-here',
  'test@example.com',
  'Test Email',
  'This is a test email from the CRM',
  'custom_message',
  'pending'
);

-- 2. Check webhook_logs
SELECT * FROM webhook_logs 
WHERE event_type = 'email_sent' 
ORDER BY created_at DESC LIMIT 1;

-- 3. Check outgoing_emails status changed to "sent"
SELECT status FROM outgoing_emails 
ORDER BY created_at DESC LIMIT 1;
```

---

## 🔌 Integration Points

### **Frontend → Database**

| Action | Table | Trigger | Webhook Log |
|--------|-------|---------|------------|
| Approve booking | `bookings` | `status → pending` | `booking_confirmed` |
| Send email | `outgoing_emails` | `INSERT` | `email_sent` |

### **Database → N8N**

| Trigger | Webhook Path | N8N Workflow |
|---------|-------------|-------------|
| `booking_confirmed` | `/webhook/booking-confirmation` | Booking-Confirmation |
| `email_sent` | `/webhook/send-email` | Send-Email |

### **N8N → Database**

| Workflow | Updates | Field |
|----------|---------|-------|
| Booking-Confirmation | `booking_confirmations` | `email_sent`, `email_sent_at` |
| Send-Email | `outgoing_emails` | `status = 'sent'`, `sent_at` |

---

## 📊 Data Flow Example

### **Complete Flow: User Approves Booking**

```
Frontend (Next.js)
  ↓
  User clicks "Godkänn" on /dashboard/bookings/[id]
  ↓
  handleApprove() executes
  ↓
  supabase.from("bookings").update({ status: "pending" })
  ↓
Supabase
  ↓
  UPDATE bookings SET status = 'pending' WHERE id = 'booking-123'
  ↓ (Trigger fires immediately)
  ↓
  INSERT INTO booking_confirmations (booking_id) VALUES ('booking-123')
  INSERT INTO webhook_logs (event_type = 'booking_confirmed', data = {...})
  ↓
N8N (Booking-Confirmation Workflow)
  ↓
  1. Webhook receives: GET /webhook/booking-confirmation
  2. Get Booking Details from Supabase
  3. Get Customer Details
  4. Get All Products
  5. Prepare data (calculations)
  6. Build confirmation email HTML
  7. Send via Gmail
  8. Update booking_confirmations.email_sent = true
  ↓
Gmail
  ↓
  Email sent to customer@example.com
  ↓
Customer
  ↓
  📧 Receives: "✅ Bokningsbekräftelse - BK-123456"
```

---

## 🛡️ Error Handling

### **If Workflow Fails**

1. **Check N8N Logs:**
   - Go to N8N → Workflow → Executions
   - Look for failed runs
   - See error message

2. **Check Supabase:**
   - Check `webhook_logs.error_message` column
   - Check `booking_confirmations.error_message` if available

3. **Common Issues:**
   - ❌ Gmail credentials expired → Re-authorize
   - ❌ Supabase API key wrong → Update in N8N
   - ❌ Email address invalid → Check customer.email
   - ❌ Booking data missing → Check booking exists in DB

### **Retry Logic**

If N8N workflow fails:
1. Email is NOT sent (status stays "pending")
2. Manual retry: Update `outgoing_emails.status` back to "pending"
3. N8N trigger fires again on next run

---

## 📞 Support

### **Debugging Checklist**

- [ ] N8N workflows imported successfully
- [ ] N8N credentials (Supabase + Gmail) working
- [ ] Supabase migration script ran
- [ ] webhook_logs table populated
- [ ] booking_confirmations table has records
- [ ] outgoing_emails table has records
- [ ] Gmail can send test email
- [ ] Customer emails are correct in database

### **Test Commands**

```bash
# Check N8N is running
curl https://your-n8n-instance.com/api/v1/health

# Test webhook URL
curl -X POST https://your-n8n-instance.com/webhook/booking-confirmation \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `supabase/SAFE_MIGRATE_WEBHOOK_TABLES.sql` | DB migration with tables & triggers |
| `workflows/EventGaraget-BOOKING-CONFIRMATION.json` | N8N workflow for booking confirmations |
| `workflows/EventGaraget-SEND-EMAIL.json` | N8N workflow for custom emails |
| `crm-dashboard/app/dashboard/bookings/[id]/page.tsx` | Frontend booking approval |
| `crm-dashboard/app/dashboard/customers/[id]/page.tsx` | Frontend email sending |

---

## ✅ Success Indicators

When everything works:
- ✅ Approve booking → confirmation email sent within 1 minute
- ✅ Send email from CRM → email delivered within 1 minute
- ✅ `booking_confirmations.email_sent = true`
- ✅ `outgoing_emails.status = 'sent'`
- ✅ No errors in `webhook_logs`
- ✅ N8N workflow executions show "success"

