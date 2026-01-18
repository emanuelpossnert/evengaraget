# 🔌 N8N WEBHOOK SETUP - VISUAL GUIDE

## 🎯 QUICK ANSWER TO YOUR FRÅGA

**Du frågade:** "Kan man använda samma webhook för booking confirmation OCH customer email?"

**Svar:** ❌ **Nej, använd två separata webhooks!** ✅

```
❌ DONT: Same webhook med if/else logic
   └─ Svårt att debugga
   └─ Lätt att göra fel
   └─ Svårt att maintain

✅ DO: Two separate webhooks
   ├─ Webhook 1: booking_confirmations → email (auto)
   └─ Webhook 2: manual HTTP POST → email (from kundkort)
   └─ Clean & maintainable
   └─ Easy to debug
   └─ Independent workflows
```

---

## 📊 SYSTEM DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    EventGaraget System                       │
└─────────────────────────────────────────────────────────────┘

┌─ CRM DASHBOARD ──────────────────────────────────────────┐
│                                                           │
│  BOOKING CARD:                                           │
│  ├─ [Bekräfta] Button                                    │
│  └─ → Insert booking_confirmations                       │
│                                                           │
│  CUSTOMER CARD:                                          │
│  ├─ Mail section                                         │
│  ├─ [Type message]                                       │
│  └─ [Skicka mail] → HTTP POST to N8N                     │
│                                                           │
└────────────────────────────────────────────────────────────┘
         ↓ (Auto)                    ↓ (Manual)

┌─ SUPABASE WEBHOOK ──────────────────────────────────────┐
│ Event: booking_confirmations.INSERT                      │
│ Action: POST to N8N                                      │
│ Status: Auto-triggered                                   │
└────────────────────────────────────────────────────────────┘
         ↓

┌─ N8N WORKFLOW 1 ────────────────────────────────────────┐
│ "Booking Confirmation Email"                             │
│                                                           │
│ Webhook Trigger                                          │
│    ↓                                                      │
│ Get Booking Details (SQL)                                │
│    ↓                                                      │
│ Format Email (with booking link)                         │
│    ↓                                                      │
│ Send Email                                               │
│    ↓                                                      │
│ Log to webhook_logs                                      │
└────────────────────────────────────────────────────────────┘
         ↓
   CUSTOMER EMAIL ✅


         (Separate flow)
         ↓

┌─ N8N WORKFLOW 2 ────────────────────────────────────────┐
│ "Send Customer Email"                                    │
│ (From HTTP POST via CRM)                                 │
│                                                           │
│ Webhook Trigger (manual POST from CRM)                   │
│    ↓                                                      │
│ Get Customer Email (SQL)                                 │
│    ↓                                                      │
│ Format Email (custom message)                            │
│    ↓                                                      │
│ Send Email                                               │
│    ↓                                                      │
│ Return Response to CRM                                   │
└────────────────────────────────────────────────────────────┘
         ↓
   CUSTOMER EMAIL ✅
```

---

## 🔄 TWO FLOWS EXPLAINED

### **FLOW 1: Booking Confirmation (Automatic)**

```
Step 1: Admin in CRM
        └─ Opens booking card
        └─ Clicks [Bekräfta]
        
Step 2: CRM Code
        └─ Updates booking status → "confirmed"
        └─ Generates token
        └─ Inserts booking_confirmations row
        
Step 3: Supabase Webhook ⚡ AUTOMATIC
        └─ Detects INSERT on booking_confirmations
        └─ Sends HTTP POST to N8N webhook URL
        
Step 4: N8N Webhook Receives
        └─ Gets booking_id & token from payload
        └─ Queries database for booking details
        └─ Builds email HTML with booking link
        
Step 5: N8N Sends Email
        └─ Connects to email service (Gmail/SendGrid)
        └─ Sends to customer
        
Step 6: Logging
        └─ Records in webhook_logs table
        
Result: Customer gets confirmation email ✅
```

### **FLOW 2: Customer Email (Manual)**

```
Step 1: Admin in CRM
        └─ Opens customer card
        └─ Navigates to "Mail" section
        └─ Types subject & message
        
Step 2: Admin clicks [Skicka mail]
        └─ CRM code makes HTTP POST request
        └─ Sends to: N8N webhook URL
        └─ Includes: customer_id, email, subject, message
        
Step 3: N8N Webhook Receives
        └─ Gets customer_id & message from POST body
        └─ Looks up customer email in database
        
Step 4: N8N Formats & Sends Email
        └─ Uses custom subject & message from admin
        └─ Connects to email service
        └─ Sends email
        
Step 5: N8N Returns Response
        └─ Sends response back to CRM
        └─ CRM shows: "Email sent!" message
        
Result: Customer gets email from admin ✅
```

---

## 🎯 KEY DIFFERENCES

| Aspect | Booking Confirmation | Customer Email |
|--------|---------------------|-----------------|
| **Trigger** | Supabase webhook | HTTP POST from CRM |
| **When** | When admin clicks "Bekräfta" | When admin clicks "Skicka mail" |
| **Auto/Manual** | Automatic ⚡ | Manual 🖱️ |
| **N8N Workflow** | "Booking Confirmation Email" | "Send Customer Email" |
| **N8N Trigger** | Webhook node | Webhook node |
| **Response** | Logs to webhook_logs | Returns JSON to CRM |
| **Email Content** | Booking details + link | Custom message from admin |
| **Customer** | Gets confirmation | Gets custom message |

---

## 💻 HOW TO IMPLEMENT

### **STEP 1: Create Supabase Webhook**

1. Go to: Supabase Console → Settings → Webhooks
2. Click: "Create webhook"
3. Fill in:
   ```
   Name: "Booking Confirmation"
   Table: booking_confirmations
   Event: INSERT
   Method: POST
   URL: https://your-n8n.com/webhook/booking-confirmation
   ```
4. Click: "Create"
5. ✅ Done! Will trigger automatically

### **STEP 2: Create N8N Workflow (Booking)**

1. Go to: N8N Dashboard
2. Click: "New Workflow"
3. Add node: "Webhook"
   ```
   Path: booking-confirmation
   Method: POST
   ```
4. Add node: "Postgres" (SQL query)
   ```sql
   SELECT b.*, c.email FROM bookings b 
   LEFT JOIN customers c ON b.customer_id = c.id 
   WHERE b.id = $1
   ```
5. Add node: "Code" (Format email)
6. Add node: "Email Send"
7. Add node: "Postgres" (Log to webhook_logs)
8. Connect nodes in sequence
9. Click: "Activate"
10. ✅ Done! Ready to receive webhooks

### **STEP 3: Update CRM Code**

```typescript
// In crm-dashboard/app/dashboard/bookings/[id]/page.tsx

const handleApprove = async (bookingId: string) => {
  // Update booking status
  await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);

  // Generate token
  const token = "...";
  
  // Create token record
  await supabase
    .from("booking_tokens")
    .insert([{ booking_id: bookingId, token }]);

  // Insert confirmation
  // ⚡ This triggers Supabase webhook automatically!
  await supabase
    .from("booking_confirmations")
    .insert([{
      booking_id: bookingId,
      token,
      email_sent: false,
      status: "pending"
    }]);
};
```

### **STEP 4: Create N8N Workflow (Customer Email)**

1. Go to: N8N Dashboard
2. Click: "New Workflow"
3. Add node: "Webhook"
   ```
   Path: send-customer-email
   Method: POST
   ```
4. Add node: "Postgres" (Get customer email)
5. Add node: "Code" (Format email)
6. Add node: "Email Send"
7. Add node: "Respond to Webhook"
   ```
   { "success": true, "message": "Email sent" }
   ```
8. Connect nodes
9. Click: "Activate"
10. Copy webhook URL
11. ✅ Done!

### **STEP 5: Update CRM Customer Card**

```typescript
// In crm-dashboard/app/dashboard/customers/[id]/page.tsx

const handleSendEmail = async (
  customerId: string,
  email: string,
  subject: string,
  message: string
) => {
  const response = await fetch(
    "https://your-n8n.com/webhook/send-customer-email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        customer_email: email,
        subject,
        message
      })
    }
  );
  
  if (response.ok) {
    alert("Email sent!");
  }
};
```

---

## ✅ TESTING

### **Test 1: Booking Confirmation**
```
1. Open CRM → Bookings
2. Click "Bekräfta" on a booking
3. Check:
   - booking_confirmations table (new row)
   - N8N logs (workflow triggered)
   - Email inbox (email arrived)
```

### **Test 2: Customer Email**
```
1. Open CRM → Customer Card
2. Type message & click "Skicka mail"
3. Check:
   - N8N logs (webhook received)
   - Browser console (200 response)
   - Email inbox (email arrived)
```

### **Test 3: Manual Webhook Test**
```
Use Postman:
POST https://your-n8n.com/webhook/booking-confirmation

Body:
{
  "type": "INSERT",
  "record": {
    "booking_id": "test-123",
    "token": "test-token"
  }
}

Response: Should be 200 OK
```

---

## 🚀 QUICK SUMMARY

| What | How | Where |
|------|-----|-------|
| **Booking Confirmation** | Auto via Supabase webhook | Table: booking_confirmations |
| **Customer Email** | Manual via HTTP POST | From: CRM kundkort |
| **Two Workflows** | Separate N8N workflows | Independent & clean |
| **Easy to Debug** | Check N8N logs | Dashboard → Executions |
| **Easy to Maintain** | No complex if/else logic | Simple, clear flow |

---

## 🎊 YOU'RE READY!

Follow steps 1-5 above and you're done!

**Files to read:**
- `N8N_WEBHOOK_INTEGRATION_GUIDE.md` - Full guide
- `N8N_WEBHOOK_CRM_INTEGRATION.ts` - Code examples
- `SUPABASE_WEBHOOK_QUICK_REFERENCE.md` - Supabase setup

🚀 **Let's go!**

