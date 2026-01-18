# 🚀 BOOKING CONFIRMATION SYSTEM - SETUP & TESTING GUIDE

## 📋 Systemöversikt

```
1. Kund gör en bokning
   ↓
2. CRM admin bekräftar bokning
   ↓
3. System genererar unique token
   ↓
4. N8N skickar confirmation-email med länk
   ↓
5. Kund klickar länken
   ↓
6. Booking Details App öppnas
   ↓
7. Kund laddar upp foliering-designs
   ↓
8. Bilder sparas i Supabase + notifieras admin
```

---

## ✅ SETUP CHECKLIST

### **DEL 1: DATABASE SETUP (5 min)**

- [ ] Tabellen `booking_tokens` finns (skapad redan)
- [ ] Tabellen `booking_wrapping_images` finns (skapad redan)
- [ ] Kört: `SETUP_BOOKING_WRAPPING_RLS.sql` från Supabase SQL Editor

Run this SQL:
```bash
# Öppna Supabase Console → SQL Editor
# Paste innehållet från: supabase/SETUP_BOOKING_WRAPPING_RLS.sql
# Klicka "Execute"
```

### **DEL 2: SUPABASE STORAGE SETUP (10 min)**

- [ ] Bucket `booking-wrapping-images` skapad
- [ ] Bucket konfigurerad för images + PDF
- [ ] RLS-policies aktiverade

Steps:
1. Supabase Console → Storage
2. "Create a new bucket" → `booking-wrapping-images`
3. Configure → MIME types: `image/*`, `application/pdf`
4. Max size: 10485760 (10MB)

### **DEL 3: BOOKING-DETAILS-APP SETUP (5 min)**

- [ ] App finns i `/booking-details-app`
- [ ] Dependencies installerade: `npm install`
- [ ] Build OK: `npm run build`
- [ ] `.env.local` konfigurerad med Supabase credentials

```bash
cd booking-details-app

# Skapa .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EOF

# Test build
npm run build
```

### **DEL 4: CRM INTEGRATION (15 min)**

- [ ] `booking_approval_handler.ts` integrerad i CRM
- [ ] `handleApprove` uppdaterad för token-generering
- [ ] Knapp i booking-kortet uppdaterad

File to update:
`crm-dashboard/app/dashboard/bookings/[id]/page.tsx`

Find: `const handleApprove = async () => {`
Replace with code från: `BOOKING_APPROVAL_TOKEN_GENERATION.ts`

### **DEL 5: N8N WORKFLOW SETUP (20 min)**

- [ ] N8N workflow "Booking Confirmation Email" skapad
- [ ] Webhook trigger konfigurerad på `booking_confirmations`
- [ ] Email-service integrerad (Gmail/SendGrid)
- [ ] Test email skickad

Steps:
1. Öppna N8N
2. "New Workflow"
3. Importera från: `workflows/N8N_BOOKING_CONFIRMATION_TEMPLATE.json`
4. Uppdatera nodes:
   - Webhook trigger → Supabase connection
   - SQL queries → Supabase credentials
   - Email node → Gmail/SendGrid credentials
5. Aktivera workflow

---

## 🧪 TESTING GUIDE

### **Test 1: Token Generation**

```bash
# 1. Öppna CRM → Bookings
# 2. Hitta en bokning
# 3. Klicka "Bekräfta"
# 4. Kontrollera databas:

SELECT * FROM booking_tokens 
ORDER BY created_at DESC LIMIT 1;

# Expected: Ny rad med token
```

### **Test 2: Database Verification**

```sql
-- Kontrollera booking_tokens
SELECT COUNT(*) as token_count FROM booking_tokens;

-- Kontrollera booking_confirmations
SELECT COUNT(*) as confirmation_count FROM booking_confirmations;

-- Kontrollera booking_wrapping_images
SELECT COUNT(*) as image_count FROM booking_wrapping_images;
```

### **Test 3: Email Integration (N8N)**

```
1. Gå till N8N
2. Öppna "Booking Confirmation Email" workflow
3. Klicka "Execute Workflow"
4. Kontrollera webhook logs:
   - booking_confirmations table har ny rad
   - webhook_logs visar "success" eller "error"
```

### **Test 4: Manual Email Test**

```bash
# Skicka test-email direkt via N8N
# Node: "Send Email"
# To: your-test-email@example.com
# Subject: Test - Booking Confirmation
```

### **Test 5: Booking Details App Access**

```bash
# 1. Starta app lokalt
cd booking-details-app
npm run dev

# 2. Öppna i browser
# http://localhost:3000/booking/TEST_TOKEN_123

# Expected: 
# - Om token är valid: Visa booking details
# - Om token är invalid: Visa error message
```

### **Test 6: File Upload**

```
1. Öppna booking details page (med valid token)
2. Dra en test-fil (PNG/PDF) till upload area
3. Klicka "Ladda upp"
4. Verifiera:
   - File uploaded till Supabase Storage
   - Rad skapad i booking_wrapping_images
   - Success message visad
```

### **Test 7: End-to-End Flow**

```
1. CRM: Bekräfta bokning
2. Check: Email skickat (verifiera Supabase webhook logs)
3. Open: Email från test-mailbox
4. Click: Länk till booking details app
5. Upload: Test-fil (design)
6. Verify: Fil finns i Supabase Storage
```

---

## 📊 Monitoring & Logs

### **Supabase Logs**
```
Supabase Console → Logs
Filter by:
- Table: booking_tokens (insert/select)
- Table: booking_wrapping_images (insert/select)
- Table: webhook_logs (insert)
```

### **N8N Logs**
```
N8N UI → Workflow → Executions
Check:
- Success/Error status
- Execution time
- Input/Output data
```

### **Browser Console**
```
Booking details app:
- Open DevTools (F12)
- Check Console for errors
- Check Network tab for API calls
```

---

## 🐛 FELSÖKNING

### Problem: "Token not found"
```
Lösning:
1. Verifiera token existerar i booking_tokens
2. Kontrollera token är rätt formaterad
3. Verifiera expires_at inte passerats
```

### Problem: Email skickas inte
```
Lösning:
1. Verifiera N8N workflow är active
2. Check webhook trigger på booking_confirmations
3. Verifiera email-credentials i N8N
4. Check N8N execution logs för errors
```

### Problem: Fil laddar upp men sparas inte i DB
```
Lösning:
1. Verifiera Supabase Storage bucket permissions
2. Check RLS policies på booking_wrapping_images
3. Verifiera API key är korrekt
4. Check browser console för error messages
```

### Problem: Booking link fungerar inte
```
Lösning:
1. Verifiera token är korrekt formaterad
2. Check booking_tokens.expires_at inte passerats
3. Verifiera booking existerar i bookings table
4. Check CORS settings på Supabase
```

---

## 📝 PRODUCTION DEPLOYMENT

### **Environment Variables (Production)**

```bash
# .env.production eller hosting provider
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key

# N8N
N8N_WEBHOOK_URL=https://your-prod-n8n-domain.com
BOOKING_APP_URL=https://your-prod-booking-app.com
```

### **Docker Deployment**

```bash
# Build image
cd booking-details-app
docker build -t booking-details-app:latest .

# Run with docker-compose
docker-compose up -d booking-details-app
```

### **Vercel Deployment (Recommended)**

```bash
npm i -g vercel
cd booking-details-app
vercel
# Follow prompts, connect repo, add env variables
```

---

## 📞 SUPPORT & KONTAKT

För frågor eller issues:
1. Check logs (Supabase, N8N, Browser console)
2. Verifiera setup stegen ovan
3. Kontakta development-teamet

---

## ✨ FEATURES ROADMAP

- [ ] SMS-notifikation när kund laddar upp
- [ ] Admin-dashboard för att se uploads
- [ ] Automatisk thumbnail-generering
- [ ] Email-reminder om deadline
- [ ] Multi-file batch upload
- [ ] Design approval workflow
- [ ] Integration med print-system


