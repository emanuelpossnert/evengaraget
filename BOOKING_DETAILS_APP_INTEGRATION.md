# 🎨 Booking Details App - Integrationsvägledning

## Översikt

Den nya **booking-details-app** är en separate Next.js-applikation som kunderna använder för att:
1. Se alla detaljer om sin bokning
2. Ladda upp foliering-designs
3. Få bekräftelse på uppladdningar

---

## 📋 Steg-för-steg Setup

### **1. Supabase Storage - Skapa Bucket**

1. Gå till **Supabase Console** → **Storage**
2. Klicka **"Create a new bucket"**
3. Namnge: `booking-wrapping-images`
4. **Gör INTE den public** (vi hanterar åtkomst via RLS)
5. Klicka **Create bucket**

### **2. Supabase Storage - Tillåtna Filtyper**

1. Klicka på bucketen `booking-wrapping-images`
2. Gå till **Policies** tab
3. Lägg till eller uppdatera tillåtna MIME-typer:
   - `image/jpeg`
   - `image/png`
   - `image/gif`
   - `application/pdf`
4. Max filstorlek: **10485760** (10MB)

### **3. Environment Variables**

Kopiera dessa till **booking-details-app/.env.local**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```

Få värdena från:
- Supabase Console → Settings → API
- Under "Project URL" och "anon public" key

### **4. Kör SQL-setup**

Kör denna i Supabase SQL Editor:

```sql
-- Booking Wrapping Images RLS Policies
CREATE POLICY "Allow all to insert images"
ON booking_wrapping_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all to read images"
ON booking_wrapping_images
FOR SELECT
USING (true);

CREATE POLICY "Allow updates to images"
ON booking_wrapping_images
FOR UPDATE
USING (true)
WITH CHECK (true);

ALTER TABLE booking_wrapping_images ENABLE ROW LEVEL SECURITY;
```

---

## 🔗 CRM - Integrering (Uppdatering av Bokningsbekräftelse)

I **crm-dashboard/app/dashboard/bookings/[id]/page.tsx**, uppdatera `handleApprove` funktionen:

```typescript
const handleApprove = async () => {
  try {
    setActionLoading(true);
    
    // 1. Update booking status
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) throw error;

    // 2. Create booking token for secure link
    const token = Math.random().toString(36).substring(2, 15) + Date.now();
    const { error: tokenError } = await supabase
      .from("booking_tokens")
      .insert([{ 
        booking_id: bookingId, 
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }]);

    if (tokenError) console.error("Token error:", tokenError);

    // 3. Trigger webhook for booking confirmation email
    // (This will be handled by N8N webhook trigger)
    const { error: confirmationError } = await supabase
      .from("booking_confirmations")
      .insert([{
        booking_id: bookingId,
        email_sent: false,
        status: "pending",
        token: token  // ← Lägg till token här!
      }]);

    if (confirmationError) console.error("Confirmation error:", confirmationError);

    setMessage({ type: "success", text: "Bokning bekräftad och email skickad!" });
    setTimeout(() => router.push("/dashboard/bookings"), 2000);
  } catch (error) {
    console.error("Error:", error);
    setMessage({ type: "error", text: "Kunde inte bekräfta bokning" });
  } finally {
    setActionLoading(false);
  }
};
```

---

## 📧 N8N Workflow - Email Integration

### Flow:

```
CRM (Bekräft bokning)
    ↓
webhook_trigger (booking_confirmations.insert)
    ↓
n8n workflow: "Booking Confirmation Email"
    ↓
Fetch booking details + token
    ↓
Format email with link
    ↓
Send to customer
    ↓
Update webhook_logs
```

### N8N Nodes Configuration:

**Node 1: Webhook Trigger**
- Listen to: `booking_confirmations` table inserts
- Extract: `booking_id`, `token`, `booking.customer_email`

**Node 2: SQL Query - Get Booking Details**

```sql
SELECT 
  b.*,
  c.email,
  c.phone
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE b.id = $1
```

**Node 3: Build Confirmation Email**

```javascript
const booking = $json.booking;
const token = $json.token;
const appUrl = "https://your-domain.com"; // Update this!

const bookingLink = `${appUrl}/booking/${token}`;

return [{json: {
  to: booking.customer_email,
  subject: `Bokningsbekräftelse - ${booking.booking_number}`,
  html: `
    <h2>Tack för din bokning!</h2>
    
    <p><strong>Bokningsnummer:</strong> ${booking.booking_number}</p>
    <p><strong>Event-datum:</strong> ${new Date(booking.event_date).toLocaleDateString('sv-SE')}</p>
    <p><strong>Plats:</strong> ${booking.location}</p>
    <p><strong>Totalt belopp:</strong> ${booking.total_amount} SEK</p>
    
    <h3>🎨 Nästa steg - Ladda upp foliering-designs</h3>
    <p>Klicka på länken nedan för att ladda upp dina foliering-designs:</p>
    
    <a href="${bookingLink}" style="
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
    ">
      Se bokningsdetaljer & Ladda upp designs
    </a>
    
    <p>Vi behöver alla designs senast 3 dagar före eventet.</p>
    
    <p>Med vänlig hälsning,<br/>EventGaraget Team</p>
  `
}}];
```

**Node 4: Send Email**
- Use your email service (SendGrid, Gmail, etc.)
- To: `{{$json.to}}`
- Subject: `{{$json.subject}}`
- HTML Body: `{{$json.html}}`

**Node 5: Update Webhook Logs**

```sql
INSERT INTO webhook_logs (
  event_type,
  table_name,
  booking_id,
  payload,
  status,
  error_message
) VALUES (
  'booking_confirmation_sent',
  'booking_confirmations',
  $1,
  $2,
  'success',
  null
)
```

---

## 🚀 Deployment

### **Development**
```bash
cd booking-details-app
npm run dev
# Available on http://localhost:3000
```

### **Production**

#### Option 1: Vercel (Rekommenderas)
```bash
npm i -g vercel
cd booking-details-app
vercel
# Follow prompts, connect your Git repo
```

#### Option 2: Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t booking-details-app .
docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=... -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... booking-details-app
```

---

## 🔒 Säkerhet

1. **Token-baserad åtkomst**: Cada bokning har ett unikt, slumpmässigt token
2. **Tokens upphör**: Efter 7 dagar automatiskt (se `booking_tokens.expires_at`)
3. **RLS-policies**: Supabase hanterar dataåtkomst-kontroll
4. **File validation**: Endast accepterade filtyper och storlekar

---

## ✅ Checklista

- [ ] Supabase Storage bucket skapat (`booking-wrapping-images`)
- [ ] Environment variables konfigurerade
- [ ] SQL RLS-policies uppsatta
- [ ] CRM `handleApprove` uppdaterad
- [ ] N8N workflow konfigurerad
- [ ] Test email skickad och verifierad
- [ ] Booking link funkar i webbläsare
- [ ] Filuppladdning testad
- [ ] Production deployment

---

## 🐛 Felsökning

### Problem: "Token not found"
- Verifiera att token finns i `booking_tokens` tabellen
- Kontrollera att booking_id är korrekt

### Problem: Filuppladdning misslyckades
- Verifiera Supabase Storage bucket namn
- Kontrollera RLS-policies är aktiverade
- Verifiera environment variables

### Problem: Email skickas inte
- Kontrollera N8N webhook trigger är aktiv
- Verifiera `booking_confirmations` tabellen har rader
- Kontrollera email-service är konfigurerad i N8N

---

## 📞 Support

Vid frågor, kontakta development-teamet eller se README.md i `booking-details-app/`

