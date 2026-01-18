# 🚀 ALTERNATIV A - IMPLEMENTATION GUIDE

## ✅ STATUS: STARTING IMPLEMENTATION

Du har valt: **Två separata webhooks** ✅

```
Webhook 1: Booking Confirmations (AUTO via Supabase)
Webhook 2: Customer Emails (MANUAL via HTTP POST)
```

---

## 📋 STEG-FÖR-STEG IMPLEMENTATION

### **STEG 1: Supabase Webhook Setup** ⏱️ 5 min

**I Supabase Console:**

1. Gå till: **Settings → Webhooks**
2. Klicka: **"Create webhook"**
3. Fyll i:
   ```
   Name: "Booking Confirmation Email"
   Table: booking_confirmations
   Event: INSERT
   HTTP method: POST
   URL: https://your-n8n-instance.com/webhook/booking-confirmation
   ```
4. Klicka: **"Create"**
5. ✅ Klar! Webhooks är nu aktiv

**Vad händer:**
- Varje gång en ny rad skapas i `booking_confirmations`
- Supabase skickar automatiskt data till N8N
- N8N startar workflow 1

---

### **STEG 2: N8N Workflow 1** ⏱️ 20 min

**"Booking Confirmation Email"**

#### I N8N Dashboard:

1. Klicka: **"New Workflow"**
2. Lägg till node: **"Webhook"**
   ```
   Method: POST
   Path: booking-confirmation
   Save
   ```
3. Kopiera webhook URL (visas i noden)
4. Lägg till node: **"PostgreSQL"**
   ```
   Select connection: your Supabase
   Query:
   SELECT b.*, c.email, c.phone, c.name
   FROM bookings b
   LEFT JOIN customers c ON b.customer_id = c.id
   WHERE b.id = $1
   
   Parameters: $json.record.booking_id
   ```
5. Lägg till node: **"Code"**
   ```javascript
   const booking = $input.first().json[0];
   const token = $json.record.token;
   const appUrl = "https://your-booking-app.com"; // Update!
   
   const bookingLink = `${appUrl}/booking/${token}`;
   
   return [{json: {
     to: booking.email,
     subject: `Bokningsbekräftelse - ${booking.booking_number}`,
     html: `
       <h2>Tack för din bokning!</h2>
       <p><strong>Bokningsnummer:</strong> ${booking.booking_number}</p>
       <p><strong>Event-datum:</strong> ${booking.event_date}</p>
       <p><strong>Plats:</strong> ${booking.location}</p>
       <p><strong>Totalt:</strong> ${booking.total_amount} SEK</p>
       
       <h3>🎨 Nästa steg - Ladda upp dina foliering-designs</h3>
       <p><a href="${bookingLink}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
         Se bokningsdetaljer & Ladda upp designs
       </a></p>
       
       <p>Vi behöver designen senast 3 dagar före eventet.</p>
       <p>Med vänlig hälsning,<br/>EventGaraget Team</p>
     `
   }}];
   ```
6. Lägg till node: **"Gmail"** (eller SendGrid)
   ```
   From email: noreply@eventgaraget.se
   To: ={{ $json.to }}
   Subject: ={{ $json.subject }}
   HTML: ={{ $json.html }}
   ```
7. Lägg till node: **"PostgreSQL"**
   ```
   Query:
   INSERT INTO webhook_logs 
   (event_type, table_name, booking_id, payload, status)
   VALUES ('booking_confirmation_sent', 'booking_confirmations', 
           $1, $2, 'success')
   
   Parameters: 
   - $json.record.booking_id
   - Email sent
   ```
8. Anslut alla noder i ordning
9. Klicka: **"Activate"**
10. ✅ Workflow 1 är aktiv!

---

### **STEG 3: N8N Workflow 2** ⏱️ 20 min

**"Send Customer Email"** (Manual från kundkort)

#### I N8N Dashboard:

1. Klicka: **"New Workflow"**
2. Lägg till node: **"Webhook"**
   ```
   Method: POST
   Path: send-customer-email
   Save & kopiera URL
   ```
3. Lägg till node: **"PostgreSQL"**
   ```
   Query:
   SELECT email, name FROM customers WHERE id = $1
   
   Parameters: $json.customer_id
   ```
4. Lägg till node: **"Code"**
   ```javascript
   const customer = $input.first().json[0];
   
   return [{json: {
     to: customer.email,
     subject: $json.subject,
     html: `
       <p>${$json.message}</p>
       <p>Med vänlig hälsning,<br/>EventGaraget Team</p>
     `
   }}];
   ```
5. Lägg till node: **"Gmail"**
   ```
   From: noreply@eventgaraget.se
   To: ={{ $json.to }}
   Subject: ={{ $json.subject }}
   HTML: ={{ $json.html }}
   ```
6. Lägg till node: **"Respond to Webhook"**
   ```
   Body:
   {
     "success": true,
     "message": "Email skickad!"
   }
   ```
7. Anslut alla noder
8. Klicka: **"Activate"**
9. ✅ Workflow 2 är aktiv!
10. **Kopiera webhook URL** (du behöver denna i CRM)

---

### **STEG 4: Update CRM Code** ⏱️ 15 min

#### **Del A: handleApprove (Booking confirmation)**

Uppdatera: `crm-dashboard/app/dashboard/bookings/[id]/page.tsx`

```typescript
import { supabase } from "@/lib/supabaseClient";

export const handleApproveBooking = async (
  bookingId: string,
  setActionLoading: (loading: boolean) => void,
  setMessage: (message: { type: "success" | "error"; text: string }) => void,
  router: any
) => {
  try {
    setActionLoading(true);

    // 1. Update booking status
    const { error: statusError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (statusError) throw statusError;

    // 2. Generate token
    const token = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;

    // 3. Create booking token
    const { error: tokenError } = await supabase
      .from("booking_tokens")
      .insert([{
        booking_id: bookingId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }]);

    if (tokenError) console.error("Token error:", tokenError);

    // 4. Insert booking_confirmations
    // ⚡ THIS TRIGGERS SUPABASE WEBHOOK!
    // ⚡ SUPABASE WEBHOOK CALLS N8N!
    const { error: confirmError } = await supabase
      .from("booking_confirmations")
      .insert([{
        booking_id: bookingId,
        token,
        email_sent: false,
        status: "pending"
      }]);

    if (confirmError) console.error("Confirmation error:", confirmError);

    setMessage({
      type: "success",
      text: "Bokning bekräftad! 📧 Email är på väg till kunden..."
    });

    setTimeout(() => {
      router.push("/dashboard/bookings");
    }, 2000);

  } catch (error) {
    console.error("Error:", error);
    setMessage({
      type: "error",
      text: `Kunde inte bekräfta bokning: ${error.message}`
    });
  } finally {
    setActionLoading(false);
  }
};
```

**Lägg till i knappen:**
```typescript
<button
  onClick={async () => {
    await handleApproveBooking(bookingId, setActionLoading, setMessage, router);
  }}
  disabled={actionLoading}
>
  {actionLoading ? "Bekräftar..." : "✅ Bekräfta bokning"}
</button>
```

#### **Del B: Customer Email Function**

Lägg till i: `crm-dashboard/app/dashboard/customers/[id]/page.tsx`

```typescript
const [emailLoading, setEmailLoading] = useState(false);
const [emailMessage, setEmailMessage] = useState(null);
const [emailSubject, setEmailSubject] = useState("");
const [emailBody, setEmailBody] = useState("");

const handleSendCustomerEmail = async () => {
  try {
    setEmailLoading(true);

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_EMAIL_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error("N8N webhook URL not configured");
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: customer.id,
        customer_email: customer.email,
        subject: emailSubject,
        message: emailBody,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "N8N webhook failed");
    }

    setEmailMessage({
      type: "success",
      text: `Email skickad till ${customer.email}! ✅`
    });

    // Clear form
    setEmailSubject("");
    setEmailBody("");

  } catch (error) {
    console.error("Error sending email:", error);
    setEmailMessage({
      type: "error",
      text: `Kunde inte skicka email: ${error.message}`
    });
  } finally {
    setEmailLoading(false);
  }
};
```

**Lägg till UI:**
```typescript
<div className="bg-white p-6 rounded-lg">
  <h3 className="text-lg font-bold mb-4">📧 Skicka mail till kund</h3>
  
  {emailMessage && (
    <div className={`p-4 rounded mb-4 ${
      emailMessage.type === "success" 
        ? "bg-green-100 text-green-800" 
        : "bg-red-100 text-red-800"
    }`}>
      {emailMessage.text}
    </div>
  )}
  
  <input
    placeholder="Ämne"
    value={emailSubject}
    onChange={(e) => setEmailSubject(e.target.value)}
    className="w-full p-2 border rounded mb-3"
  />
  
  <textarea
    placeholder="Meddelande"
    value={emailBody}
    onChange={(e) => setEmailBody(e.target.value)}
    rows={5}
    className="w-full p-2 border rounded mb-3"
  />
  
  <button
    onClick={handleSendCustomerEmail}
    disabled={emailLoading || !emailSubject || !emailBody}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
  >
    {emailLoading ? "Skickar..." : "📤 Skicka mail"}
  </button>
</div>
```

---

### **STEG 5: Environment Variables** ⏱️ 2 min

Lägg till i `.env.local` (CRM):

```bash
# N8N Webhook URLs
NEXT_PUBLIC_N8N_EMAIL_WEBHOOK_URL=https://your-n8n-instance.com/webhook/send-customer-email
```

---

## ✅ TESTING CHECKLIST

### **Test 1: Booking Confirmation**
- [ ] Öppna CRM → Bookings
- [ ] Hitta en bokning
- [ ] Klicka "Bekräfta"
- [ ] Verifiera:
  - [ ] `booking_confirmations` har ny rad
  - [ ] N8N workflow 1 triggades (check Executions)
  - [ ] Email ankommer till kundens inbox

### **Test 2: Customer Email**
- [ ] Öppna Customer card
- [ ] Scrolla till mail-sektion
- [ ] Typ test-subject & message
- [ ] Klicka "Skicka mail"
- [ ] Verifiera:
  - [ ] Knappen visar "Skickar..."
  - [ ] N8N webhook 2 triggades
  - [ ] Success message visas
  - [ ] Email ankommer

### **Test 3: Manual Webhook Test**
```bash
# Using Postman:
POST https://your-n8n-instance.com/webhook/booking-confirmation

Headers:
Content-Type: application/json

Body:
{
  "type": "INSERT",
  "table": "booking_confirmations",
  "record": {
    "booking_id": "test-123",
    "token": "test-token-456"
  }
}

Expected: 200 OK
```

---

## 🎯 VERIFIKATION

### **Supabase Webhook Status:**
```
Supabase Console → Settings → Webhooks
→ Click your webhook
→ Check: "Logs" tab
→ Should see: POST requests (Status 200)
```

### **N8N Workflow Status:**
```
N8N Dashboard
→ Open each workflow
→ Click: "Executions"
→ Should see: triggered executions
→ Check: Input/Output data
```

### **Database Logging:**
```sql
-- Check webhook logs
SELECT * FROM webhook_logs 
WHERE event_type IN ('booking_confirmation_sent')
ORDER BY created_at DESC
LIMIT 10;

-- Should see successful entries
```

---

## 🚨 TROUBLESHOOTING

### **Problem: Webhook triggers men email skickas inte**
```
1. Check N8N logs (Executions tab)
2. Look for error message
3. Verify email service is configured (Gmail/SendGrid)
4. Check email address is valid
```

### **Problem: Supabase webhook visas inte i logs**
```
1. Verify webhook URL är korrekt
2. Check webhook är aktiverad (toggle)
3. Verify table name = booking_confirmations
4. Try triggering manually with Postman
```

### **Problem: CRM mail-knapp fungerar inte**
```
1. Check N8N webhook URL i .env.local
2. Verify N8N webhook är aktiv
3. Check browser console för errors
4. Try webhook with Postman
```

---

## ✨ DU ÄR KLAR! 

🎉 **Alternativ A är nu live!**

```
✅ Webhook 1: Auto booking confirmations
✅ Webhook 2: Manual customer emails
✅ Two independent N8N workflows
✅ CRM fully integrated
✅ Testing procedures included
```

**Nästa:** Testa allt enligt checklistan ovan!

---

## 📞 SUPPORT FILES

- `N8N_WEBHOOK_INTEGRATION_GUIDE.md` - Full reference
- `N8N_WEBHOOK_CRM_INTEGRATION.ts` - Code examples
- `SUPABASE_WEBHOOK_QUICK_REFERENCE.md` - Supabase help
- `N8N_WEBHOOK_VISUAL_GUIDE.md` - Visual diagrams

🚀 **Let's go!**

