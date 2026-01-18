# 🚀 N8N WORKFLOWS - IMPORT GUIDE

Du har nu två färdiga N8N workflows som .json files!

---

## 📦 WORKFLOW FILES

### **Workflow 1: Booking Confirmation Email**
```
File: N8N_BOOKING_CONFIRMATION_WORKFLOW.json
Path: /workflows/
What: Automatic booking confirmation emails
Trigger: Supabase webhook (when booking_confirmations INSERT)
Purpose: Send beautiful confirmation email with booking link
```

### **Workflow 2: Customer Email**
```
File: N8N_CUSTOMER_EMAIL_WORKFLOW.json
Path: /workflows/
What: Manual customer emails from CRM
Trigger: HTTP POST from CRM (Skicka mail button)
Purpose: Send custom message to customer
```

---

## 📥 HOW TO IMPORT

### **STEP 1: Open N8N Dashboard**
1. Go to: `https://your-n8n-instance.com`
2. Login

### **STEP 2: Import Workflow 1**
1. Click: **"New Workflow"**
2. Click: **⋯ (three dots)** → **"Import from file"**
3. Select: **`N8N_BOOKING_CONFIRMATION_WORKFLOW.json`**
4. Click: **"Import"**
5. Wait for import to complete

### **STEP 3: Configure Workflow 1**
1. You'll see error icons (red X) on credentials nodes
2. Fix each node:

**Webhook Node:**
- Already configured (path: `/booking-confirmation`)
- Copy the full webhook URL (you'll need this for Supabase)

**PostgreSQL Nodes (2 nodes):**
- Click on each "PostgreSQL" node
- Select: Your Supabase connection
- If not available, create new connection:
  - Host: Your Supabase host
  - User: postgres
  - Password: Your password
  - Database: postgres

**Gmail Node:**
- Select: Your Gmail connection
- If not available, create new Gmail OAuth connection

**3. Save & Activate**
- Click: **"Save"** (top right)
- Click: **"Activate"** toggle
- Should turn GREEN

---

### **STEP 4: Import Workflow 2**
1. Click: **"New Workflow"**
2. Click: **⋯ (three dots)** → **"Import from file"**
3. Select: **`N8N_CUSTOMER_EMAIL_WORKFLOW.json`**
4. Click: **"Import"**

### **STEP 5: Configure Workflow 2**
1. Fix credential nodes (same as Workflow 1)

**Webhook Node:**
- Copy the full webhook URL
- This goes in `.env.local` as `NEXT_PUBLIC_N8N_EMAIL_WEBHOOK_URL`

**PostgreSQL Nodes:**
- Select Supabase connection (same as Workflow 1)

**Gmail Node:**
- Select Gmail connection (same as Workflow 1)

**3. Save & Activate**
- Click: **"Save"**
- Click: **"Activate"** toggle
- Should turn GREEN

---

## 🔑 COPY THESE URLS

### **Webhook URLs (Save for later):**

**From Workflow 1 (Booking Confirmation):**
```
https://your-n8n-instance.com/webhook/booking-confirmation
```
→ Use this in **Supabase Webhooks**

**From Workflow 2 (Customer Email):**
```
https://your-n8n-instance.com/webhook/send-customer-email
```
→ Use this in **CRM .env.local**

---

## 📋 WHAT EACH WORKFLOW DOES

### **Workflow 1: Booking Confirmation**
```
Receives (from Supabase webhook):
{
  "type": "INSERT",
  "record": {
    "booking_id": "...",
    "token": "...",
    ...
  }
}
        ↓
Gets booking details from database
        ↓
Formats beautiful HTML email with:
  • Booking number, date, location, price
  • Product list
  • Link to booking details app (with token)
  • EventGaraget branding
        ↓
Sends email to customer
        ↓
Logs to webhook_logs table
```

### **Workflow 2: Customer Email**
```
Receives (from HTTP POST from CRM):
{
  "customer_id": "...",
  "subject": "...",
  "message": "..."
}
        ↓
Gets customer email from database
        ↓
Formats simple HTML email with:
  • Customer name
  • Custom message from admin
  • EventGaraget footer
        ↓
Sends email to customer
        ↓
Logs to email_logs table
        ↓
Returns JSON response to CRM
```

---

## ✅ VERIFICATION CHECKLIST

### **After Import:**
- [ ] Both workflows imported without errors
- [ ] All red X icons are gone
- [ ] Both workflows are "Active" (toggle is green)
- [ ] Webhook URLs are copied

### **Before Go Live:**
- [ ] Supabase webhook is created (pointing to Workflow 1 URL)
- [ ] Environment variables set in CRM (.env.local)
- [ ] Gmail/Email service configured in N8N
- [ ] Test email (manually trigger workflow)
- [ ] Test CRM button (HTTP POST test)

---

## 🧪 TEST WORKFLOWS

### **Test Workflow 1 (Booking Confirmation)**

1. Click on **Workflow 1** → **"Execute Workflow"**
2. In popup, provide test data:
```json
{
  "type": "INSERT",
  "record": {
    "booking_id": "test-booking-123",
    "token": "test-token-456"
  }
}
```
3. Click: **"Execute"**
4. Check output:
   - Should see email was formatted
   - Check your email inbox (email should arrive)

### **Test Workflow 2 (Customer Email)**

1. Click on **Workflow 2** → **"Execute Workflow"**
2. In popup, provide test data:
```json
{
  "customer_id": "test-customer-789",
  "subject": "Test Subject",
  "message": "This is a test message"
}
```
3. Click: **"Execute"**
4. Check:
   - Should see success response
   - Check your email inbox (email should arrive)

---

## 📊 WORKFLOW NODES EXPLAINED

### **Workflow 1 Nodes:**
1. **Webhook** - Receives data from Supabase
2. **Get Booking Details** - SQL query to fetch booking info
3. **Format Email** - Code node to create beautiful HTML
4. **Send Email** - Gmail node to send email
5. **Log Webhook Event** - SQL insert to database logging

### **Workflow 2 Nodes:**
1. **Webhook** - Receives POST from CRM
2. **Get Customer Email** - SQL query to fetch customer
3. **Format Email** - Code node to create HTML
4. **Send Email** - Gmail node to send email
5. **Log Email** - SQL insert to database logging
6. **Respond to Webhook** - Return JSON to CRM

---

## 🔒 IMPORTANT NOTES

- ✅ Both workflows are `"active": false` (you must activate them)
- ✅ Credentials are referenced but need to be connected
- ✅ Email service (Gmail) must be configured
- ✅ Database (Supabase) connection must be set

---

## 🚀 NEXT STEPS

1. **Import both .json files** (follow steps above)
2. **Configure credentials** (Supabase, Gmail)
3. **Copy webhook URLs** (save for Supabase & CRM)
4. **Test workflows** (use test data)
5. **Setup Supabase webhook** (point to Workflow 1 URL)
6. **Update CRM code** (use code from ALTERNATIV_A_IMPLEMENTATION.md)
7. **Add environment variables** (Workflow 2 URL)
8. **Go live!** 🎉

---

## 💡 TIPS

- **Test first:** Always test workflows before going live
- **Check logs:** N8N shows execution logs for debugging
- **Monitor emails:** Verify emails arrive (check spam folder)
- **Error handling:** If something fails, check N8N logs first

---

**Ready? Start importing!** 🚀
