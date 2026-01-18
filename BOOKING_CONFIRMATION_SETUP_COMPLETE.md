# 🚀 BOOKING CONFIRMATION EMAIL - COMPLETE SETUP GUIDE

> **Status:** Ready to deploy
> **Time to setup:** ~20 minutes

---

## 📋 OVERVIEW

Flöde när en bokning bekräftas:

```
CRM: Klicka "Bekräfta"
  ↓
Booking status: pending → confirmed
  ↓
booking_confirmations INSERT
  ↓
Supabase Webhook triggas
  ↓
N8N receives POST request
  ↓
N8N: Generate link + Format email + Send Gmail
  ↓
Customer receives email with link to booking details app
  ↓
Customer can view booking & upload foiling images
```

---

## ✅ PREREQUISITES

Before starting, ensure you have:
- ✅ N8N running (port 5678)
- ✅ NGrok tunnel active with URL: `https://reita-orthostichous-imagistically.ngrok-free.dev`
- ✅ Supabase project set up
- ✅ Gmail account configured in N8N
- ✅ Booking-details-app running locally (port 3000)

---

## 🔧 STEP 1: IMPORT N8N WORKFLOW

### 1.1 Copy the workflow
File: `workflows/BOOKING-CONFIRMATION-EMAIL.json`

### 1.2 Open N8N
Go to: `http://localhost:5678`

### 1.3 Import workflow
1. Click **"Workflows"** in left sidebar
2. Click **"Import"** (top right)
3. Select file: `BOOKING-CONFIRMATION-EMAIL.json`
4. Click **"Import"**

### 1.4 Verify imported nodes
The workflow should have these nodes in order:
- ✅ Webhook1 (trigger)
- ✅ Extract Data (code)
- ✅ Get Booking Token (supabase)
- ✅ Get Booking Details (supabase)
- ✅ Get Customer Email (supabase)
- ✅ Generate Link (code)
- ✅ Format Email (code)
- ✅ Send Gmail (gmail)
- ✅ Log Email (supabase)
- ✅ Respond to Webhook (response)

### 1.5 Update credentials
For each Supabase node, verify credentials:
1. Click node
2. Check **Credentials** = "Eventgaraget"
3. If not, select from dropdown

---

## 🔌 STEP 2: CONFIGURE SUPABASE WEBHOOK

### 2.1 Get Webhook URL from N8N
1. In N8N, click **Webhook1** node
2. Copy the **Webhook URL** (it will auto-generate)

Example:
```
https://reita-orthostichous-imagistically.ngrok-free.dev/webhook/booking-confirmation
```

### 2.2 Create Supabase Webhook
1. Go to **Supabase Console** → Your Project
2. Click **"Database"** in left sidebar
3. Scroll down to **"Webhooks"**
4. Click **"Create a new webhook"**

### 2.3 Fill in webhook details
```
Webhook Name:          booking-confirmation-email
Table:                 booking_confirmations
Event:                 INSERT
HTTP Method:           POST
URL:                   [PASTE N8N WEBHOOK URL HERE]
```

Example:
```
https://reita-orthostichous-imagistically.ngrok-free.dev/webhook/booking-confirmation
```

### 2.4 Advanced settings
- ✅ Retry count: **3**
- ✅ Send self-signed certs: **On** (for ngrok)
- ✅ Timeout (seconds): **30**

### 2.5 Create webhook
Click **"Create webhook"**

### 2.6 Verify webhook
Status should show: ✅ **Active** (green toggle)

---

## 🧪 STEP 3: TEST THE WORKFLOW

### 3.1 Activate N8N workflow
1. In N8N, click **"Save"** (top right)
2. Toggle **"Active"** to ON (green)

### 3.2 Test with manual trigger
1. Click **"Test workflow"** button
2. In Webhook1 node, click **"Send test event"**

### 3.3 Send test webhook from Supabase
```bash
curl -X POST https://reita-orthostichous-imagistically.ngrok-free.dev/webhook/booking-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "schema": "public",
    "table": "booking_confirmations",
    "record": {
      "id": "test-id-123",
      "booking_id": "00000000-0000-0000-0000-000000000001",
      "email_sent": false,
      "created_at": "2025-01-13T10:00:00Z"
    }
  }'
```

### 3.4 Check N8N execution logs
Look for:
- ✅ Webhook received
- ✅ Token extracted
- ✅ Email formatted
- ✅ Gmail sent
- ✅ Logged to Supabase

---

## 🎯 STEP 4: TEST END-TO-END

### 4.1 Start booking-details-app
```bash
cd booking-details-app
npm run dev  # Port 3000
```

### 4.2 In CRM Dashboard
1. Go to **Bookings** page
2. Find a booking with status **"Väntande"** (pending)
3. Click **"Bekräfta"** button

### 4.3 Expected flow
- ✅ Button shows "Bekräftar..." (loading)
- ✅ Success message appears
- ✅ Page redirects to bookings list
- ✅ Booking status changes to **"Bekräftad"** (confirmed)

### 4.4 Check email
1. Check Gmail inbox (should arrive in ~10 seconds)
2. Look for email with subject: `Bokningsbekräftelse - BK-XXXXX`
3. Click the button/link in email

### 4.5 Verify booking details page
Customer should see:
- ✅ Booking number
- ✅ Event date & location
- ✅ Total amount
- ✅ Products list
- ✅ Upload section for foiling images

### 4.6 Test image upload
1. Select a test image (JPG, PNG, PDF)
2. Click **"Ladda upp filer"**
3. Verify upload succeeds
4. Refresh page and verify image persists

---

## 🔍 TROUBLESHOOTING

### Email not received
- ✅ Check N8N execution logs for errors
- ✅ Verify Gmail credentials in N8N
- ✅ Check Gmail "Less secure apps" is enabled
- ✅ Check spam folder

### Webhook not triggering
- ✅ Verify Supabase webhook is Active (green toggle)
- ✅ Check NGrok tunnel is running
- ✅ Verify N8N workflow is Active
- ✅ Check N8N execution logs

### Customer link not working
- ✅ Verify token was created in `booking_tokens` table
- ✅ Check booking-details-app is running
- ✅ Verify URL is correct: `http://localhost:3000/booking/[TOKEN]`

### Images not uploading
- ✅ Check `booking-wrapping-images` bucket exists in Supabase Storage
- ✅ Verify bucket has correct permissions
- ✅ Check file size < 10MB
- ✅ Check Supabase RLS policies allow uploads

---

## 📊 MONITORING

### Check execution logs
1. N8N: Click workflow → "Executions"
2. See all trigger events
3. Click each to see details

### Check sent emails
```sql
SELECT * FROM outgoing_emails 
WHERE email_type = 'booking_confirmation' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check uploaded images
```sql
SELECT * FROM booking_wrapping_images 
ORDER BY uploaded_at DESC 
LIMIT 10;
```

---

## 🚀 PRODUCTION DEPLOYMENT

When moving to production:

### 1. Update booking details URL
In N8N workflow, edit **Generate Link** code node:
```javascript
const BOOKING_DETAILS_URL = 'https://booking.eventgaraget.se';  // Change this
```

### 2. Deploy booking-details-app
```bash
# Option A: Vercel
vercel deploy --prod

# Option B: Docker
docker build -t booking-details-app .
docker run -p 3000:3000 booking-details-app

# Option C: Own server
npm run build
npm start
```

### 3. Update N8N webhook URL
If production N8N has different URL:
```
https://n8n.eventgaraget.se/webhook/booking-confirmation
```

### 4. Update Supabase webhook
1. Go to Supabase Console → Webhooks
2. Edit **booking-confirmation-email**
3. Update URL to production webhook
4. Save changes

---

## ✨ COMPLETE!

Your booking confirmation email system is now live!

**What happens now:**
1. Admin confirms booking in CRM ✅
2. Customer receives email with link ✅
3. Customer views booking & uploads images ✅
4. Admin sees uploaded images in CRM ✅

---

## 📞 SUPPORT

If something doesn't work:
1. Check N8N execution logs
2. Verify all webhooks are active
3. Check Supabase tables for data
4. Restart services if needed

---

**Questions?** Feel free to ask!
