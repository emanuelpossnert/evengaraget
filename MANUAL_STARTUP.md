# 🚀 Manual System Startup Guide

Använd denna guide om `START_ALL.sh` inte fungerar eller om du föredrar manuell startup.

---

## 📋 Förutsättningar

Innan du börjar, se till att du har:
- ✅ Docker installerat och körande
- ✅ Node.js & npm installerat
- ✅ ngrok installerat (`brew install ngrok`)
- ✅ Supabase projekt konfigurerat
- ✅ Gmail-konto kopplat till n8n

---

## 🔧 Terminal Setup

**Öppna 3 terminaler** (eller 3 terminal-tabs):

```
Terminal 1: n8n
Terminal 2: ngrok
Terminal 3: Signature App
```

---

## Terminal 1️⃣: n8n Setup

```bash
# Gå till projekt-root
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget

# Starta n8n med Docker
docker-compose up n8n

# Vänta på output som säger:
# "n8n ready on http://localhost:5678"
```

**Status:** ✅ Ready när du ser:
```
n8n ready on http://localhost:5678
```

---

## Terminal 2️⃣: ngrok Setup

```bash
# I EN NY TERMINAL, starta ngrok
ngrok http 5678

# Du får output som:
# Forwarding                    https://abc123def456.ngrok.io -> http://localhost:5678
```

**KOPIERA denna URL:** `https://abc123def456.ngrok.io`

**Status:** ✅ Ready när tunneln är aktiv

---

## Terminal 3️⃣: Signature App Setup

```bash
# I EN NY TERMINAL, gå till signature-app
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget/signature-app

# Installera dependencies (om inte redan gjort)
npm install

# Starta dev-servern
npm run dev

# Vänta på output som säger:
# "ready - started server on 0.0.0.0:3000"
```

**Status:** ✅ Ready när du ser:
```
ready - started server on 0.0.0.0:3000
```

---

## ✅ Verify All Services Running

Öppna dessa URLs i din browser:

```
1. n8n:        http://localhost:5678
2. Signature:  http://localhost:3000
3. ngrok:      http://localhost:4040 (status page)
```

---

## 🔗 n8n Workflow Setup

Nu måste du importera workflows i n8n:

### 1️⃣ Importera Workflow 1 - Email Classification

```
1. Gå till http://localhost:5678
2. Workflows → + New → ⋮ Menu → Import from file
3. Välj: workflows/01-email-classification-FINAL.json
4. Click Save
```

### 2️⃣ Importera Workflow 2 - Quotation Generation

```
1. Workflows → + New → ⋮ Menu → Import from file
2. Välj: workflows/02-quotation-generation.json
3. Click Save
```

---

## 🔗 Supabase Webhook Setup

Nu måste webhook konfigureras i Supabase:

### 1. Gå till Supabase Console

```
https://app.supabase.com → Your Project → Database → Tables
```

### 2. Skapa Webhook för `bookings` table

```
1. Gå till bookings tabell
2. ⋮ Menu → Webhooks → + New Webhook
3. Fyll i:
   - Name: quotation-trigger
   - Events: ☑ INSERT
   - HTTP Method: POST
   - URL: https://abc123def456.ngrok.io/webhook/quotation-webhook
4. Click Create
```

**VIKTIGT:** Använd ngrok URL från Terminal 2!

---

## 🧪 Test the Full Flow

### Test 1: Manual Booking Creation

Gå till Supabase SQL Editor och kör:

```sql
INSERT INTO public.bookings (
  customer_id,
  products_requested,
  event_date,
  event_end_date,
  location,
  booking_status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '[{"name": "Partytält 4x4m", "quantity": 1, "price": 800}]'::jsonb,
  '2025-11-15'::date,
  '2025-11-15'::date,
  'Stockholm',
  'pending_quotation'
);
```

### Test 2: Check if Quotation Was Created

```sql
SELECT id, booking_id, signing_token, status
FROM quotations
ORDER BY created_at DESC
LIMIT 1;
```

Du bör se en ny quotation! ✅

### Test 3: Check n8n Executions

```
1. Gå till http://localhost:5678
2. Öppna Workflow 2 (02-quotation-generation)
3. Klicka på Executions
4. Du bör se den senaste körningen med status ✅
```

### Test 4: Access Quotation Page

```
1. Kopiera signing_token från quotation
2. Gå till: http://localhost:3000/quotation/[PASTE_TOKEN_HERE]
3. Du bör se quotation-sidan med addons
```

---

## 🐛 Troubleshooting

### Problem: "Connection refused" på localhost:5678

**Lösning:**
```bash
# Kontrollera att n8n körs
docker ps | grep n8n

# Om inte, starta igen
docker-compose up n8n
```

### Problem: ngrok visar "error binding to port"

**Lösning:**
```bash
# Kontrollera vad som använder port 5678
lsof -i :5678

# Döda processen om den inte är n8n
kill -9 [PID]

# Starta ngrok igen
ngrok http 5678
```

### Problem: Signature App säger "Missing script: dev"

**Lösning:**
```bash
cd signature-app
npm install
npm run dev
```

### Problem: Quotation page visar "Offert ej funnen"

**Lösning:**
1. Verifiera att booking har `signing_token`
2. Verifiera URL är exakt: `/quotation/[token]`
3. Checka Supabase RLS policies

### Problem: Webhook triggar inte

**Lösning:**
1. Verifiera ngrok URL är korrekt i Supabase webhook
2. Verifiera webhook status i Supabase (se sent events)
3. Kontrollera n8n Webhook URL: `http://localhost:5678/webhook/quotation-webhook`

---

## 📊 Verify Checklist

```
□ Terminal 1: n8n körs på http://localhost:5678
□ Terminal 2: ngrok körs och tunnel är aktiv
□ Terminal 3: Signature App körs på http://localhost:3000

□ Workflow 1 importerad (01-email-classification-FINAL)
□ Workflow 2 importerad (02-quotation-generation)

□ Supabase webhook konfigurerad med ngrok URL
□ Test booking skapad och quotation genererad
□ Quotation page öppnas (http://localhost:3000/quotation/[token])

□ Signering fungerar
□ PDF genereras
□ Booking status uppdateras
```

---

## 🎉 You're Ready!

När allt är verifierat kan du:

1. **Testa hela flödet** från email → booking → quotation → signature
2. **Testa error-handling** (ogiltiga tokens, etc.)
3. **Testa addons-selection** och prisberäkning
4. **Verifiera PDF-output**

---

## 🚀 Next Steps

1. **Testing lokalt** - Se `PHASE_3_SUMMARY.md`
2. **Deploy till produktion** - Se `N8N_SETUP_GUIDE.md`
3. **Customer testing** - Skicka quotation-link till test-kund

---

**Behöver du hjälp?** Kontrollera:
- ✅ `QUICK_N8N_SETUP.md` - Quick start
- ✅ `N8N_SETUP_GUIDE.md` - Detaljerad guide
- ✅ `PHASE_3_SUMMARY.md` - Full overview
