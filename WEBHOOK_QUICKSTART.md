# 🚀 Webhook Integration - Quick Start

## ✅ COMPLETED - Vad är redan gjort

### **1. Database Setup ✅**
- ✅ `booking_confirmations` table created
- ✅ `outgoing_emails` table created
- ✅ `webhook_logs` table created
- ✅ Triggers och functions skapade
- ✅ RLS policies konfigurerade

**File:** `supabase/SAFE_MIGRATE_WEBHOOK_TABLES.sql`

### **2. Frontend Integration ✅**
- ✅ Booking approval (`handleApprove`) - now triggers webhook
- ✅ Email sending (`sendEmail`) - now saves to `outgoing_emails`
- ✅ Both automatically log webhook events to DB

**Files Updated:**
- `crm-dashboard/app/dashboard/bookings/[id]/page.tsx`
- `crm-dashboard/app/dashboard/customers/[id]/page.tsx`

### **3. N8N Workflows ✅**
- ✅ Booking confirmation workflow JSON created
- ✅ Send email workflow JSON created
- ✅ Both ready for import

**Files Created:**
- `workflows/EventGaraget-BOOKING-CONFIRMATION.json`
- `workflows/EventGaraget-SEND-EMAIL.json`

---

## 🎯 NEXT STEPS - What YOU Need To Do

### ⚠️ **IF IMPORT FAILS?**

If you get **"Could not find property option"** error:
- 👉 **See: `N8N_CREATE_WORKFLOWS_VIA_API.md`**
- **Option 1:** Build manually in N8N UI (20 min, most reliable)
- **Option 2:** Duplicate your existing working workflow (fastest)
- **Option 3:** Send N8N version info (I'll create compatible JSON)

---

### **STEG 1: Import Workflows to N8N (10 min)**

1. **Open N8N**
   ```
   https://your-n8n-instance.com
   ```

2. **Import Webhook Polling Workflow (START HERE!)**
   - Click "Import from File"
   - Select: `workflows/EventGaraget-WEBHOOK-POLLING.json`
   - Click "Import"
   - When imported, it will ask for credentials
   - Set Supabase API to: **Eventgaraget**
   - Click "Deploy"
   - **This workflow now runs every 30 seconds!**
   - ⚠️ **If import fails:** See `N8N_CREATE_WORKFLOWS_VIA_API.md`

3. **Import Booking Confirmation Workflow**
   - Click "Import from File"
   - Select: `workflows/EventGaraget-BOOKING-CONFIRMATION.json`
   - Click "Import"
   - Check all nodes have correct credentials
   - Click "Deploy"

4. **Import Send Email Workflow**
   - Click "Import from File"
   - Select: `workflows/EventGaraget-SEND-EMAIL.json`
   - Click "Import"
   - Check all nodes have correct credentials
   - Click "Deploy"

5. **Note Webhook URLs**
   ```
   Polling Workflow:     Runs automatically every 30 seconds
   Booking Confirmation: https://your-n8n.com/webhook/booking-confirmation
   Send Email:           https://your-n8n.com/webhook/send-email
   ```

**HOW IT WORKS:**
- Polling Workflow runs every 30 seconds
- Checks `webhook_logs` table for new events (success = false)
- Routes to correct workflow:
  - `booking_confirmed` → Booking Confirmation Workflow
  - `email_sent` → Send Email Workflow
- Marks events as processed (success = true)

---

### **STEG 2: Setup Environment Variable (2 min)**

For Polling Workflow to call other workflows, set N8N_INSTANCE_HOST:

1. **Go to N8N Settings**
   - Click your profile → Settings
   - Find "Environment Variables"
   - Add:
     ```
     N8N_INSTANCE_HOST = your-n8n-instance.com
     ```
   - Example: `N8N_INSTANCE_HOST = n8n.eventgaraget.se`
   - Save

---

### **STEG 3: Verify Credentials (5 min)**

For each workflow, verify:

✅ **Supabase API**
- Go to N8N → Credentials
- Check "Eventgaraget" Supabase connection
- Test: Click "Test connection"
- Should show: ✅ "OK"

✅ **Gmail**
- Go to N8N → Credentials
- Check "Gmail account 2" connection
- Verify it's connected to correct email account
- Test: Should be authorized

---

### **STEG 4: Verify Database Triggers ✅**

**Triggers are already created!**

Verify in Supabase SQL Editor:

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'trg_%';
```

You should see:
- ✅ `trg_booking_confirmation` on `bookings`
- ✅ `trg_email_sent` on `outgoing_emails`
- ✅ `trg_update_customer_stats_on_booking` on `bookings`

---

### **STEG 5: Test End-to-End (10 min)**

#### **Test A: Booking Confirmation**

```
1. Go to: http://localhost:3001/dashboard/bookings
2. Find a booking with status "draft"
3. Click on it to open detail page
4. Check ALL items in review checklist
5. Click "Godkänn Bokning" button
6. Status should change to "pending"
7. Frontend updates database ✅
8. DB trigger fires → logs to webhook_logs ✅
9. Wait ~30 seconds (polling cycle)
10. Check webhook_logs:
    SELECT * FROM webhook_logs 
    WHERE event_type = 'booking_confirmed' 
    ORDER BY created_at DESC LIMIT 1;
11. Check success=true ✅
12. Customer should receive confirmation email
13. Check: booking_confirmations.email_sent = true ✅
```

#### **Test B: Send Email from Customer Card**

```
1. Go to: http://localhost:3001/dashboard/customers
2. Pick any customer
3. Go to "E-post" tab
4. Type subject and message
5. Click "Skicka"
6. Frontend saves to outgoing_emails ✅
7. DB trigger fires → logs to webhook_logs ✅
8. Wait ~30 seconds (polling cycle)
9. Check webhook_logs:
   SELECT * FROM webhook_logs 
   WHERE event_type = 'email_sent' 
   ORDER BY created_at DESC LIMIT 1;
10. Check success=true ✅
11. Email should be sent
12. Check: outgoing_emails.status = 'sent' ✅
```

---

## 🔍 Troubleshooting

### **Problem: Email not sent**

```sql
-- 1. Check webhook_logs for errors
SELECT error_message, data 
FROM webhook_logs 
WHERE event_type = 'booking_confirmed' 
ORDER BY created_at DESC LIMIT 5;

-- 2. Check N8N workflow execution logs
-- Go to N8N → Workflow → "Booking Confirmation" → Executions

-- 3. Check if email was marked as sent
SELECT email_sent, error_message 
FROM booking_confirmations 
ORDER BY created_at DESC LIMIT 1;
```

### **Problem: Trigger not firing**

```sql
-- 1. Verify triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_%' AND trigger_schema = 'public';

-- 2. Try manual update to test trigger
UPDATE bookings 
SET status = 'pending' 
WHERE id = 'your-booking-id';

-- 3. Check webhook_logs
SELECT * FROM webhook_logs 
ORDER BY created_at DESC LIMIT 1;
```

### **Problem: Supabase API Error in N8N**

- Check Supabase API key in N8N credentials
- Verify service role key (not anon key)
- Test: Click "Test connection" in N8N

### **Problem: Gmail Auth Error**

- Go to N8N → Credentials
- Click Gmail credential
- Click "Reconnect"
- Authorize with Google account again
- Save

---

## 📊 What Happens Next (Automatic)

When you approve a booking or send an email:

```
Frontend Action
    ↓
Database Updated (Supabase)
    ↓
DB Trigger Fires
    ↓
webhook_logs Entry Created
    ↓
N8N Workflow Executes (automatic)
    ↓
Email Sent (Gmail)
    ↓
Status Updated in Database
    ↓
✅ DONE!
```

**Entire process takes:** ~30 seconds

---

## 📋 Checklist Before Going Live

- [ ] N8N workflows imported
- [ ] Credentials verified (Supabase + Gmail)
- [ ] Database triggers created
- [ ] Test booking confirmation works
- [ ] Test email sending works
- [ ] webhook_logs shows entries
- [ ] booking_confirmations has email_sent = true
- [ ] outgoing_emails has status = 'sent'
- [ ] Customer receives both types of emails
- [ ] No errors in webhook_logs.error_message

---

## 📞 Quick Support

| Issue | Solution |
|-------|----------|
| Workflow not triggering | Check triggers: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'trg_%'` |
| Email not sending | Check Gmail credentials in N8N, verify service role key in Supabase |
| Customer email wrong | Check `customers.email` in database |
| Slow email delivery | Normal: ~30 seconds. If longer: check N8N queue |
| Duplicate emails | Check N8N workflow "executeOnce" setting |

---

## 🎓 Documentation

For more details, see:
- `N8N_WEBHOOK_INTEGRATION_SETUP.md` - Detailed setup guide
- `WEBHOOK_SETUP_STEPS.md` - Step-by-step walkthrough
- `WEBHOOK_SAFE_MIGRATION_GUIDE.md` - Database migration details

---

**Ready? Let's go!** 🚀

**Next Step:** Import N8N workflows and test!

