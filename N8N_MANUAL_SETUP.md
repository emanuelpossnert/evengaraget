# N8N Manual Workflow Setup (No Import Needed)

## ⚠️ Problem med JSON Import
Om du får "Could not find property option" error, skapa workflows **manuellt** istället!

---

## 🎯 Workflow 1: Booking Confirmation (Manual)

### Step 1: Create New Workflow
1. N8N Dashboard → "New Workflow"
2. Name: **"Booking Confirmation"**
3. Save

### Step 2: Add Webhook Trigger
1. Click "+" (Add Node)
2. Search: **"Webhook"**
3. Select: **n8n-nodes-base.webhook**
4. Configure:
   - HTTP Method: **POST**
   - Path: **booking-confirmation**
   - Response Mode: **When last node finishes**
5. Save node

### Step 3: Get Booking Details
1. Add Node → Search: **"Supabase"**
2. Configure:
   - Operation: **Get record**
   - Table: **bookings**
   - Filters:
     - Field: **id**
     - Condition: **equals**
     - Value: **={{ $json.body.record.id }}**
3. Set Credentials: **Eventgaraget**
4. Save node

### Step 4: Get Customer
1. Add Node → **Supabase**
2. Operation: **Get record**
3. Table: **customers**
4. Filters:
   - Field: **id**
   - Value: **={{ $json.customer_id }}** (from previous node)
5. Save node

### Step 5: Send Email
1. Add Node → Search: **"Gmail"**
2. Configure:
   - Resource: **Message**
   - Subject: **={{ "✅ Bokningsbekräftelse - " + $json.booking_number }}**
   - To: **={{ $json.customer.email }}**
   - Include HTML: **YES**
   - HTML: (paste HTML template below)
3. Credentials: **Gmail account 2**
4. Save node

### Step 6: Update Confirmation Status
1. Add Node → **Supabase**
2. Operation: **Update record**
3. Table: **booking_confirmations**
4. Filters:
   - Field: **booking_id**
   - Value: **={{ $json.booking.id }}**
5. Fields:
   - **email_sent**: true
   - **email_sent_at**: **={{ new Date().toISOString() }}**
6. Save node

### Step 7: Connect Nodes
```
Webhook
  ↓
Get Booking
  ↓
Get Customer (input from Get Booking)
  ↓
Send Email
  ↓
Update Confirmation
```

### Step 8: Deploy
- Click **Deploy** button
- Workflow is now active!

**Webhook URL:** https://your-n8n-instance.com/webhook/booking-confirmation

---

## 🎯 Workflow 2: Send Email (Manual)

### Step 1: Create New Workflow
1. New Workflow
2. Name: **"Send Email"**
3. Save

### Step 2: Add Webhook Trigger
1. Add Node → **Webhook**
2. Configure:
   - HTTP Method: **POST**
   - Path: **send-email**

### Step 3: Get Email Record
1. Add Node → **Supabase**
2. Operation: **Get record**
3. Table: **outgoing_emails**
4. Filters:
   - Field: **id**
   - Value: **={{ $json.body.record.id }}**

### Step 4: Send Email
1. Add Node → **Gmail**
2. Configure:
   - Subject: **={{ $json.subject }}**
   - To: **={{ $json.recipient_email }}**
   - Include HTML: **YES**
   - HTML: **={{ $json.body_html || $json.body_plain }}**
3. Credentials: **Gmail account 2**

### Step 5: Update Email Status
1. Add Node → **Supabase**
2. Operation: **Update record**
3. Table: **outgoing_emails**
4. Filters:
   - Field: **id**
   - Value: **={{ $json.id }}**
5. Fields:
   - **status**: sent
   - **sent_at**: **={{ new Date().toISOString() }}**

### Step 6: Connect Nodes
```
Webhook
  ↓
Get Email Record
  ↓
Send Email
  ↓
Update Email Status
```

### Step 7: Deploy
- Click **Deploy**
- Workflow is now active!

**Webhook URL:** https://your-n8n-instance.com/webhook/send-email

---

## 🎯 Workflow 3: Polling (Manual - MOST IMPORTANT)

### Step 1: Create New Workflow
1. New Workflow
2. Name: **"Webhook Poller"**
3. Save

### Step 2: Add Schedule Trigger
1. Add Node → Search: **"Schedule"**
2. Select: **n8n-nodes-base.scheduleTrigger**
3. Configure:
   - Trigger: **Every 30 seconds**

### Step 3: Query Pending Webhooks
1. Add Node → **Supabase**
2. Operation: **Read (get all)**
3. Table: **webhook_logs**
4. Configure Filters:
   - Add Filter
   - Field: **success**
   - Condition: **equals**
   - Value: **false**
5. Options:
   - Limit: **10**

### Step 4: Loop Through Results
1. Add Node → Search: **"Loop"**
2. Select: **n8n-nodes-base.loop**
3. Configure:
   - Loop Expression: **={{ $json }}**

### Step 5: Determine Event Type
1. Add Node → Search: **"Code"**
2. Select: **n8n-nodes-base.code**
3. Language: **JavaScript**
4. Code:
```javascript
const webhook = $input.first().json;

if (webhook.event_type === 'booking_confirmed') {
  return [{ json: { ...webhook, action: 'booking' } }];
}

if (webhook.event_type === 'email_sent') {
  return [{ json: { ...webhook, action: 'email' } }];
}

return [{ json: { ...webhook, action: 'unknown' } }];
```

### Step 6: Route to Booking Webhook
1. Add Node → **IF**
2. Configure:
   - Condition: **action** equals **booking**
3. True branch → **HTTP Request**
4. HTTP Request:
   - Method: **POST**
   - URL: **https://{{ $env.N8N_INSTANCE_HOST }}/webhook/booking-confirmation**
   - Headers: **Content-Type: application/json**
   - Body: **Raw** (paste JSON below)
```json
{ "record": { "id": "{{ $json.id }}" } }
```

### Step 7: Route to Email Webhook
1. Add Node → **IF**
2. Configure:
   - Condition: **action** equals **email**
3. True branch → **HTTP Request**
4. HTTP Request:
   - Method: **POST**
   - URL: **https://{{ $env.N8N_INSTANCE_HOST }}/webhook/send-email**
   - Headers: **Content-Type: application/json**
   - Body: Same as above

### Step 8: Mark as Processed
1. Add Node → **Supabase**
2. Operation: **Update record**
3. Table: **webhook_logs**
4. Filters:
   - Field: **id**
   - Value: **={{ $json.id }}**
5. Fields:
   - **success**: true
   - **response**: Processed

### Step 9: Connect Nodes
```
Schedule (every 30s)
  ↓
Query Pending
  ↓
Loop
  ↓
Determine Action
  ├─→ IF booking → HTTP → Mark Processed
  └─→ IF email → HTTP → Mark Processed
```

### Step 10: Deploy
- Click **Deploy**
- Polling now runs every 30 seconds!

---

## ✅ Environment Setup

### Set N8N_INSTANCE_HOST

1. Go to N8N Settings
2. Environment Variables
3. Add:
   ```
   N8N_INSTANCE_HOST=your-n8n-domain.com
   ```
   Example: `n8n.eventgaraget.se`

---

## 🧪 Testing

### Test 1: Manually Insert Webhook Log
```sql
INSERT INTO webhook_logs (
  webhook_name,
  event_type,
  data,
  success
) VALUES (
  'test',
  'booking_confirmed',
  '{}',
  false
);
```

Wait 30 seconds → Should process automatically

### Test 2: Real Booking
1. Go to CRM
2. Approve a draft booking
3. Watch polling workflow in N8N
4. Should trigger automatically

### Test 3: Send Email
1. Go to Customer card
2. Send email
3. Watch polling workflow
4. Should send automatically

---

## 📊 Verification Checklist

- [ ] 3 Workflows created manually
- [ ] N8N_INSTANCE_HOST environment variable set
- [ ] All credentials connected (Supabase + Gmail)
- [ ] Booking Confirmation webhook deployed
- [ ] Send Email webhook deployed
- [ ] Poller workflow deployed
- [ ] Tested booking confirmation
- [ ] Tested email sending
- [ ] Polling runs every 30 seconds

---

## 🚀 Ready to Go!

When all checked, your webhook system is ready for production! ✅

**Next:** Go to CRM and test! 🎉

