# N8N Webhook Polling Setup Guide

## 🎯 Overview

**Polling Workflow** runs every 30 seconds and:
1. ✅ Checks `webhook_logs` for unprocessed events
2. ✅ Routes to correct N8N workflow based on event type
3. ✅ Marks events as processed (success = true)
4. ✅ Full error tracking & retry capability

```
Polling Workflow (every 30s)
    ↓
Query webhook_logs WHERE success = false
    ↓
For each event:
    IF event_type = 'booking_confirmed'
      → Call Booking-Confirmation Webhook
    ELSE IF event_type = 'email_sent'
      → Call Send-Email Webhook
    ↓
Mark event: success = true
    ↓
Done!
```

---

## 📋 Architecture

### **Workflow Hierarchy**

```
┌─────────────────────────────────────────┐
│  Polling Workflow (Main Orchestrator)   │
│  - Runs: Every 30 seconds               │
│  - Trigger: Schedule                    │
│  - Action: Query & Route                │
└─────────────────────────────────────────┘
              ↓ Calls ↓
┌──────────────────────┬──────────────────┐
│ Booking Confirmation │  Send Email      │
│ Webhook              │  Webhook         │
│ - Sends email        │  - Sends email   │
│ - Updates status     │  - Updates status│
└──────────────────────┴──────────────────┘
```

### **Data Flow**

```
Frontend Action
    ↓
Supabase UPDATE
    ↓
DB Trigger Fires
    ↓
INSERT INTO webhook_logs (success=false)
    ↓
(Next 30-second cycle)
    ↓
Polling Workflow Runs
    ↓
SELECT webhook_logs WHERE success=false
    ↓
For Each Event:
  ↓
  Route to workflow
  ↓
  Call webhook URL
  ↓
  UPDATE webhook_logs SET success=true
    ↓
Done!
```

---

## ✅ Setup Steps

### **Step 1: Import Polling Workflow**

File: `workflows/EventGaraget-WEBHOOK-POLLING.json`

1. Open N8N
2. Click "New Workflow" or "Import"
3. Import from file: `EventGaraget-WEBHOOK-POLLING.json`
4. Deploy

### **Step 2: Configure Environment Variable**

N8N needs to know its own hostname to call its own webhooks:

1. **In N8N Dashboard:**
   - Click Profile (top right)
   - Settings
   - Environment Variables
   - Add:
     ```
     N8N_INSTANCE_HOST = your-n8n-domain.com
     ```
   - Example: `N8N_INSTANCE_HOST = n8n.eventgaraget.se`
   - DO NOT include `https://` or `/webhook/`
   - Save

2. **Alternative: Hardcode in Workflow**
   - If env vars don't work, edit the HTTP Request nodes
   - Replace: `{{ $env.N8N_INSTANCE_HOST }}`
   - With: `your-n8n-domain.com`

### **Step 3: Verify Supabase Connection**

1. Open Polling Workflow
2. Click "Fetch Pending Webhooks" node
3. Check Credentials: "Eventgaraget" Supabase
4. Test connection

### **Step 4: Activate Polling**

1. Open Polling Workflow
2. Click "Deploy"
3. Go to "Executions"
4. After ~30 seconds, you should see first execution
5. Check logs for:
   - ✅ "No pending webhooks" (if nothing to process)
   - ✅ "Processing X pending webhooks" (when processing)

---

## 🧪 Testing

### **Test 1: Monitor First Run**

```
1. Open Polling Workflow
2. Click "Executions" tab
3. Wait for next run (max 30 seconds)
4. Click latest execution
5. Expand nodes to see:
   - "Fetch Pending Webhooks" results
   - "Loop: Each Webhook Event" iterations
   - "Is booking_confirmed?" / "Is email_sent?" routing
   - "Mark Webhook: Success" updates
```

### **Test 2: Manual Webhook Insert**

Insert test webhook manually to verify flow:

```sql
-- Insert test webhook_log
INSERT INTO webhook_logs (
  webhook_name,
  event_type,
  data,
  success
) VALUES (
  'test_webhook',
  'booking_confirmed',
  jsonb_build_object(
    'booking_id', 'test-123',
    'booking_number', 'BK-999',
    'customer_email', 'test@example.com'
  ),
  false
);

-- Wait 30 seconds for polling cycle...

-- Check if it was processed
SELECT id, success, response 
FROM webhook_logs 
WHERE webhook_name = 'test_webhook';
-- Should show: success = true
```

### **Test 3: Real Booking Confirmation**

```
1. Go to CRM: http://localhost:3001/dashboard/bookings
2. Approve a draft booking
3. Watch Polling Workflow executions
4. Should see:
   - Event logged to webhook_logs (success=false)
   - Next polling cycle processes it
   - Event marked success=true
   - Confirmation email sent
```

---

## 🔍 Monitoring

### **Check Polling Status**

```sql
-- See latest webhook logs
SELECT 
  id,
  webhook_name,
  event_type,
  success,
  created_at,
  response,
  error_message
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;

-- Count unprocessed events
SELECT COUNT(*) 
FROM webhook_logs 
WHERE success = false;

-- See success rate
SELECT 
  success,
  COUNT(*) as count
FROM webhook_logs
GROUP BY success;
```

### **N8N Execution Logs**

1. Open Polling Workflow
2. Click "Executions" tab
3. Each row = one 30-second cycle
4. Click to expand and see details:
   - ✅ Green = successful
   - ❌ Red = error
   - Yellow = warning

### **Check Workflow Output**

```javascript
// In "Summary Log" node, logs show:
// ✅ No pending webhooks
// 🔄 Processing 2 pending webhooks
//   1. booking_confirmed - booking_confirmation
//   2. email_sent - send_email
```

---

## 🛠️ Troubleshooting

### **Problem: Polling never runs**

**Solution:**
1. Check workflow status: Should be "Active"
2. Click "Deploy" to reactivate
3. Check N8N logs for errors
4. Verify Supabase credentials

### **Problem: webhook_logs shows success=false still**

**Solution:**
1. Check N8N execution logs for errors
2. Verify HTTP Request node can reach webhook URL
3. Check: `{{ $env.N8N_INSTANCE_HOST }}` is correct
4. Try manually: `curl https://your-n8n/webhook/booking-confirmation`

### **Problem: Events processed but webhook not called**

**Solution:**
```sql
-- Check webhook_logs response field
SELECT error_message, response 
FROM webhook_logs 
WHERE success = false 
ORDER BY created_at DESC LIMIT 1;
```

Look for HTTP errors like:
- `404 Not Found` - webhook URL wrong
- `401 Unauthorized` - credentials wrong
- `500 Server Error` - workflow crashed

### **Problem: Emails not sending after webhook called**

**Solution:**
1. Check Booking-Confirmation or Send-Email workflow logs
2. Verify Gmail credentials still authorized
3. Check customer.email in database
4. Look at "Update Confirmation Status" node for errors

---

## ⏱️ Tuning Polling Interval

**Current:** 30 seconds (good balance)

**To Change:**
1. Open Polling Workflow
2. Click "Schedule: Every 30 seconds" node
3. Change "Interval Value" to desired seconds
4. Deploy

**Recommendations:**
- **10 seconds** = Faster but more load on Supabase
- **30 seconds** = Balanced (default)
- **60 seconds** = Slower but less load

---

## 🔒 Security Notes

- ✅ Polling uses Supabase API key (service role)
- ✅ N8N environment variable not exposed to frontend
- ✅ Webhook logs stored in Supabase (encrypted)
- ✅ RLS policies protect data

**For Production:**
- Use environment variables for all credentials
- Enable N8N workflow execution logging
- Monitor webhook_logs for failures
- Set up alerts for high error rates

---

## 📊 Success Indicators

When polling is working correctly:

- ✅ Polling Workflow shows regular executions in N8N
- ✅ Every 30 seconds, a new execution appears
- ✅ webhook_logs.success alternates between false→true
- ✅ Email sent within 30-60 seconds of action
- ✅ booking_confirmations.email_sent = true
- ✅ outgoing_emails.status = 'sent'
- ✅ No error_message fields populated

---

## 📚 Related Files

- `EventGaraget-WEBHOOK-POLLING.json` - Main polling workflow
- `EventGaraget-BOOKING-CONFIRMATION.json` - Called by polling
- `EventGaraget-SEND-EMAIL.json` - Called by polling
- `SAFE_MIGRATE_WEBHOOK_TABLES.sql` - Database setup
- `WEBHOOK_QUICKSTART.md` - Quick start guide

---

## 🚀 Next Steps

1. ✅ Deploy Polling Workflow
2. ✅ Set N8N_INSTANCE_HOST environment variable
3. ✅ Test with manual webhook_logs insert
4. ✅ Test with real booking approval
5. ✅ Monitor execution logs
6. ✅ Verify emails sent successfully

**You're all set!** 🎉

