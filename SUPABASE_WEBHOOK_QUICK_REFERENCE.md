# ⚡ SUPABASE WEBHOOK SETUP - QUICK REFERENCE

## 🎯 VAD ÄR SUPABASE WEBHOOKS?

En **Supabase webhook** är ett sätt för Supabase att automatiskt skicka data till en extern tjänst (N8N) när något händer i databasen.

```
Database Event (INSERT/UPDATE/DELETE)
         ↓
Supabase detects
         ↓
Supabase sends HTTP POST to N8N
         ↓
N8N receives & processes
         ↓
Action completes
```

---

## 🔧 STEP-BY-STEP SETUP

### **STEP 1: Open Supabase Console**
```
https://app.supabase.com
→ Select your project (EventGaraget)
→ Go to: Settings → Webhooks
```

### **STEP 2: Create Webhook**
```
Click: "Create a webhook"
```

### **STEP 3: Configure Webhook**

Fill in these fields:

| Field | Value |
|-------|-------|
| **Webhook name** | "Booking Confirmation Email" |
| **Table** | `booking_confirmations` |
| **Events** | ✓ INSERT |
| **HTTP method** | POST |
| **URL** | https://your-n8n.com/webhook/booking-confirmation |

### **STEP 4: Advanced Settings (Optional)**

```
- Rate limit: 10 requests/second
- Timeout: 30 seconds
- Retry: 3 times
```

### **STEP 5: Save**
```
Click: "Create webhook"
```

---

## 📡 WEBHOOK PAYLOAD (What Supabase Sends)

When a new row is inserted into `booking_confirmations`, Supabase sends this:

```json
{
  "type": "INSERT",
  "schema": "public",
  "table": "booking_confirmations",
  "record": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "booking_id": "abc-123-def",
    "token": "secure-token-12345",
    "email_sent": false,
    "status": "pending",
    "created_at": "2024-12-10T12:00:00Z"
  },
  "old_record": null
}
```

**I N8N, du får åtkomst till detta via:**
```
$json.record.booking_id
$json.record.token
$json.type
etc.
```

---

## ✅ VERIFY WEBHOOK IS WORKING

### **Method 1: Check Supabase Logs**
```
Supabase Console → Settings → Webhooks
→ Click your webhook
→ View: "Logs" tab
→ Should see: successful calls (status 200)
```

### **Method 2: Check N8N Logs**
```
N8N Dashboard
→ Open workflow
→ Click: "Executions"
→ Should see: webhook triggered
```

### **Method 3: Monitor webhook_logs Table**
```sql
SELECT * FROM webhook_logs 
WHERE event_type = 'booking_confirmation_sent'
ORDER BY created_at DESC;
```

---

## 🧪 TEST WEBHOOK MANUALLY

### **Using Postman:**

1. Open Postman
2. Create new POST request
3. URL: `https://your-n8n.com/webhook/booking-confirmation`
4. Headers:
   ```
   Content-Type: application/json
   ```
5. Body (JSON):
   ```json
   {
     "type": "INSERT",
     "table": "booking_confirmations",
     "record": {
       "booking_id": "test-123",
       "token": "test-token",
       "email_sent": false,
       "status": "pending"
     }
   }
   ```
6. Click "Send"
7. Check N8N logs for response

---

## 🔗 TWO WEBHOOK SETUP

För att ha både **booking confirmation** och **customer emails**, skapa två webhooks:

### **Webhook 1: Booking Confirmations (Auto)**
```
Table: booking_confirmations
Event: INSERT
URL: https://your-n8n.com/webhook/booking-confirmation
```
→ Triggers automatically när admin bekräftar bokning

### **Webhook 2: Customer Emails (Optional)**
```
Table: email_logs (eller customer_emails)
Event: INSERT
URL: https://your-n8n.com/webhook/send-customer-email
```
→ Triggers när mail-logg skapas

**ELLER:** Gör customer email manuell via HTTP POST från CRM (se N8N_WEBHOOK_CRM_INTEGRATION.ts)

---

## 🚫 TROUBLESHOOTING

### Problem: Webhook doesn't trigger
```
❌ Check: Table name is correct
❌ Check: Event type selected (INSERT/UPDATE/DELETE)
❌ Check: URL is correct & reachable
❌ Check: N8N webhook path matches
→ Solution: Test webhook URL with Postman first
```

### Problem: N8N doesn't receive data
```
❌ Check: N8N webhook is active
❌ Check: URL in Supabase matches N8N exactly
❌ Check: N8N logs for errors
→ Solution: Manually test with Postman
```

### Problem: Email not sent
```
❌ Check: Email service configured in N8N
❌ Check: Customer email is valid
❌ Check: N8N workflow has email node
❌ Check: webhook_logs for errors
→ Solution: Debug N8N workflow step-by-step
```

### Problem: Too many webhook calls
```
❌ Check: Not inserting multiple times accidentally
❌ Check: Not running bulk updates
→ Solution: Add rate limiting in Supabase
```

---

## 🔒 SECURITY BEST PRACTICES

### ✅ DO:
- Use HTTPS URLs only
- Validate webhook source (Supabase IP)
- Add authentication tokens if possible
- Log all webhook calls
- Monitor webhook_logs table
- Set rate limits

### ❌ DON'T:
- Expose webhook URLs publicly
- Trust webhook data without validation
- Store sensitive data in logs
- Use HTTP (unencrypted)
- Forget to test failures

---

## 📊 WEBHOOK LIFECYCLE

```
1. CRM Admin Action
   └─ Clicks "Bekräfta" button

2. Database Insert
   └─ booking_confirmations row created
   └─ status: 'pending'

3. Supabase Webhook Triggered
   └─ Detects INSERT event
   └─ Prepares payload
   └─ Makes HTTP POST

4. N8N Receives
   └─ Webhook node receives POST
   └─ Extracts data from $json
   └─ Starts workflow execution

5. N8N Processes
   └─ Gets booking details
   └─ Formats email
   └─ Sends via email service

6. N8N Logs
   └─ Inserts to webhook_logs
   └─ Records success/failure
   └─ Timestamp & details

7. Complete
   └─ Workflow finished
   └─ Customer receives email
   └─ Admin sees confirmation
```

---

## 💡 PERFORMANCE TIPS

- **Use indexes** on `booking_id` for fast lookups
- **Limit payload size** - only send what you need
- **Set timeout appropriately** - not too short
- **Batch operations** - don't trigger multiple times
- **Monitor webhook_logs** - watch for patterns

---

## 📚 N8N WEBHOOK NODES

### **Incoming Webhook (Receives from Supabase)**
```
Use this when Supabase calls N8N
- Path: /webhook/booking-confirmation
- Method: POST
- Listen for incoming data from database events
```

### **Outgoing Webhook (N8N calls other services)**
```
Use this when N8N calls external APIs
- Make HTTP requests FROM N8N
- Example: POST to CRM API
```

---

## 🎯 WORKFLOW TEMPLATE

```
┌──────────────────────────────────────┐
│ Supabase Webhook (Incoming)         │
│ Listens to: booking_confirmations   │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ Extract Booking ID                   │
│ $json.record.booking_id              │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ SQL Query                            │
│ Get booking + customer details       │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ Format Email                         │
│ Build HTML with booking info         │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ Send Email                           │
│ Via Gmail/SendGrid                   │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ Log Webhook Event                    │
│ Insert to webhook_logs               │
└──────────────────────────────────────┘
```

---

## 🚀 GO LIVE CHECKLIST

- [ ] Supabase webhook created
- [ ] N8N webhook node configured
- [ ] Webhook URL tested with Postman
- [ ] N8N workflow complete
- [ ] Email service configured
- [ ] webhook_logs table exists
- [ ] Error handling in place
- [ ] Admin notifications setup
- [ ] Tested end-to-end
- [ ] Monitoring enabled

---

## 📞 NEED HELP?

Check these files:
- `N8N_WEBHOOK_INTEGRATION_GUIDE.md` - Full guide
- `N8N_WEBHOOK_CRM_INTEGRATION.ts` - Implementation code
- `BOOKING_CONFIRMATION_SETUP_GUIDE.md` - Complete setup

---

**Ready to setup? Follow STEP 1-5 above!** ✨

