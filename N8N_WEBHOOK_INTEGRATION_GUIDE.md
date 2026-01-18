# 🔗 N8N WEBHOOK INTEGRATION - BOOKING CONFIRMATION SETUP

## 📋 OVERSIKT

Du har två alternativ:

### **Alternativ A: Separate Webhooks** (Rekommenderas)
```
✅ En webhook för booking confirmations (auto-trigger)
✅ En webhook för customer emails (manuell trigger från kundkort)
✅ Två olika N8N workflows
✅ Enklare att hålla isär & debugga
```

### **Alternativ B: Samma Webhook med Conditional Logic**
```
⚠️ En webhook med if/switch statements
⚠️ Hantera båda event-typerna
❌ Svårare att debugga
❌ Kan bli förvirrande
```

---

## 🎯 REKOMMENDERAD SETUP (Alternativ A)

### **WEBHOOK 1: Booking Confirmation** (Auto-triggered)
```
Trigger: booking_confirmations table INSERT
Event: CRM admin clicks "Bekräfta"
Action: N8N sends confirmation email automatically
```

### **WEBHOOK 2: Customer Email** (Manual trigger)
```
Trigger: Manual HTTP POST från kundkortet
Event: User clicks "Skicka mail" på kundkort
Action: N8N sends custom email
```

---

## 🔧 HOW TO SET UP

### **STEP 1: Booking Confirmation Webhook (Auto)**

**I N8N:**

1. Create new workflow: "Booking Confirmation Email"
2. Add node: **"Webhook"**
   ```
   Method: POST
   Node name: "Booking Confirmed"
   ```
3. Copy the webhook URL (ser ut så här):
   ```
   https://your-n8n-instance.com/webhook/booking-confirmation
   ```

4. Configure the workflow:
   ```
   Webhook Trigger
        ↓
   Get Booking Details (SQL query)
        ↓
   Format Email
        ↓
   Send Email
        ↓
   Log Webhook
   ```

**I CRM (handleApprove):**

```typescript
// Efter booking_confirmations.insert
const { error: confirmationError } = await supabase
  .from("booking_confirmations")
  .insert([{
    booking_id: bookingId,
    token: token,
    email_sent: false,
    status: "pending"
  }]);

// Supabase Webhook (konfigureras i Supabase Console)
// triggered automatically → calls N8N webhook URL
```

**I Supabase Console:**

1. Settings → Webhooks
2. Create webhook on `booking_confirmations` table
3. Event: INSERT
4. HTTP method: POST
5. URL: `https://your-n8n-instance.com/webhook/booking-confirmation`

Supabase kommer automatiskt att trigga N8N när en ny rad insertas!

---

### **STEP 2: Customer Email Webhook (Manual)**

**I N8N:**

1. Create new workflow: "Send Customer Email"
2. Add node: **"Webhook"**
   ```
   Method: POST
   Node name: "Send Email from Customer Card"
   URL: https://your-n8n-instance.com/webhook/send-customer-email
   ```

3. Configure workflow:
   ```
   Webhook receives:
   {
     customer_id: "...",
     subject: "...",
     message: "..."
   }
        ↓
   Get Customer Email (SQL)
        ↓
   Format Email
        ↓
   Send Email
        ↓
   Log Webhook
   ```

**I CRM (kundkort/mail-section):**

```typescript
// I komponenten där du har "Skicka mail"-knappen

const handleSendEmail = async (customerId: string, subject: string, message: string) => {
  try {
    const response = await fetch(
      'https://your-n8n-instance.com/webhook/send-customer-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          subject,
          message,
          timestamp: new Date().toISOString()
        })
      }
    );

    if (response.ok) {
      setMessage({ type: 'success', text: 'Email skickad!' });
    } else {
      setMessage({ type: 'error', text: 'Kunde inte skicka email' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    setMessage({ type: 'error', text: 'Ett fel uppstod' });
  }
};
```

---

## 🔄 JÄMFÖRELSE: WEBHOOK VS POLLING

| Aspekt | Webhook | Polling |
|--------|---------|---------|
| **Trigger** | Automatic (instant) | Timed checks |
| **Latency** | <1 sec | 5-60 sec |
| **Complexity** | Medium | Simple |
| **Cost** | Lower | Higher |
| **Reliability** | High | Medium |
| **Best for** | Real-time events | Scheduled tasks |

---

## 🎯 FLOW DIAGRAMS

### **FLOW 1: Booking Confirmation (Auto)**
```
CRM Admin
    ↓
[Click "Bekräfta"]
    ↓
CRM Code: Update booking status
    ↓
CRM Code: Insert booking_confirmations
    ↓
Supabase detects INSERT
    ↓
Supabase Webhook → N8N
    ↓
N8N: Get booking details
    ↓
N8N: Send confirmation email
    ↓
N8N: Log event
    ↓
✅ Customer gets email automatically!
```

### **FLOW 2: Customer Email (Manual)**
```
CRM: Kundkort
    ↓
[View mail section]
    ↓
[Type message]
    ↓
[Click "Skicka mail"]
    ↓
CRM Code: HTTP POST to N8N
    ↓
N8N: Receive webhook
    ↓
N8N: Get customer email
    ↓
N8N: Send email
    ↓
N8N: Log event
    ↓
✅ Customer gets email immediately!
```

---

## ❌ VAD MAN INTE BÖR GÖRA

### **IKKE: Samma webhook för två saker**
```typescript
// ❌ WRONG - Confusing logic
if (type === "booking_confirmation") {
  // do booking stuff
} else if (type === "customer_email") {
  // do customer email stuff
}
// Svårt att debugga & maintain
```

### **INTE: Poll från CRM**
```typescript
// ❌ WRONG - Inefficient
setInterval(async () => {
  // Check if booking_confirmations has new rows
  // Send email if found
}, 5000);
// Slösaktig & dålig praxis
```

---

## ✅ BEST PRACTICES

### **DO: Separate Webhooks**
```
✅ One webhook = one responsibility
✅ Easy to test & debug
✅ Easy to scale
✅ Easy to disable if needed
```

### **DO: Log Everything**
```typescript
// I N8N:
INSERT INTO webhook_logs (
  event_type,
  table_name,
  payload,
  status,
  error_message,
  timestamp
) VALUES (...)
```

### **DO: Verify Webhooks**
```
✅ Test with Postman first
✅ Check N8N logs
✅ Verify database receives data
✅ Monitor email delivery
```

---

## 🚀 SETUP STEPS (I Ordning)

### **Step 1: N8N Webhook Creation**
1. Open N8N dashboard
2. Create "Booking Confirmation Email" workflow
3. Add Webhook node
4. Copy webhook URL
5. Test with Postman

### **Step 2: Supabase Webhook Setup**
1. Supabase Console → Settings → Webhooks
2. Table: booking_confirmations
3. Event: INSERT
4. URL: Paste N8N webhook URL
5. Test: Trigger from CRM

### **Step 3: CRM Integration**
1. Update handleApprove function
2. Add: booking_confirmations.insert([...])
3. Supabase webhook triggers automatically
4. Test: Confirm booking

### **Step 4: Customer Email Setup**
1. Create second N8N workflow
2. Add Webhook node
3. Update CRM kundkort component
4. Add send email button with HTTP call
5. Test: Send test email

---

## 🧪 TESTING CHECKLIST

### **Test Booking Confirmation:**
- [ ] Confirm booking in CRM
- [ ] Check booking_confirmations table
- [ ] N8N workflow triggers automatically
- [ ] Check N8N logs for success
- [ ] Email arrives in customer inbox

### **Test Customer Email:**
- [ ] Open customer card
- [ ] Type test message
- [ ] Click "Skicka mail"
- [ ] HTTP POST succeeds
- [ ] N8N webhook receives data
- [ ] Email arrives in customer inbox

### **Test Error Handling:**
- [ ] N8N webhook URL is wrong → See error in logs
- [ ] Email service down → N8N shows failure
- [ ] Invalid data → N8N shows error message
- [ ] Database error → Webhook logs record it

---

## 💡 TIPS & TRICKS

**Debugging N8N Webhooks:**
1. Check N8N Logs tab
2. Use "Debug" mode
3. Test with Postman first
4. Add console.log in code nodes

**Monitoring:**
1. Check webhook_logs table
2. Monitor email delivery service
3. Set up alerts for failures
4. Review logs daily

**Performance:**
1. Use async operations
2. Don't wait for email response
3. Log asynchronously
4. Cache booking data if needed

---

## 🔒 SECURITY

### **Webhook Security:**
```
✅ HTTPS only (encrypted)
✅ Validate payload
✅ Check timestamps
✅ Rate limiting
✅ Authentication tokens (optional)
```

### **N8N Security:**
```
✅ Keep webhook URLs secret
✅ Don't log sensitive data
✅ Use environment variables
✅ Monitor access logs
```

---

## 📝 ENVIRONMENT VARIABLES

```bash
# .env in booking-details-app & CRM

N8N_BOOKING_WEBHOOK_URL=https://your-n8n.com/webhook/booking-confirmation
N8N_EMAIL_WEBHOOK_URL=https://your-n8n.com/webhook/send-customer-email
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_here
```

---

## 🎯 SUMMARY

| Task | Method | Trigger | Auto/Manual |
|------|--------|---------|-------------|
| **Booking Confirmation** | Supabase Webhook | INSERT on booking_confirmations | Auto ✅ |
| **Customer Email** | HTTP POST from CRM | Click button on kundkort | Manual ✅ |

**REKOMMENDATION:** Använd två separata webhooks för klarhet & enkla underhål!

---

## 📞 SUPPORT

**Questions?**
- See: BOOKING_CONFIRMATION_SETUP_GUIDE.md
- Check: N8N logs
- Test: With Postman
- Monitor: webhook_logs table

**Next:** Follow setup steps 1-4 above!

