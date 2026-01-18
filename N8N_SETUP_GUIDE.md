# 🚀 n8n Setup Guide - Lokalt (Localhost)

## 📋 Förutsättningar

- ✅ n8n installerat och körande på `http://localhost:5678`
- ✅ Supabase projekt konfiguerat och kopplat till n8n
- ✅ Gmail-konto kopplat till n8n för email-sändning
- ✅ Database setup klarat (Fas 1 ✅)

---

## 🔧 **Steg 1: Starta n8n lokalt**

```bash
# Om du använder Docker
docker-compose up -d n8n

# Eller om n8n är installerat globalt
n8n start

# Gå till http://localhost:5678
```

---

## 📥 **Steg 2: Importera Workflow 1 - Email Classification**

### File: `01-email-classification-FINAL.json`

1. Gå till **Workflows** → **+ New**
2. Klicka på **⋮ (Menu)** → **Import from file**
3. Välj `workflows/01-email-classification-FINAL.json`
4. **Spara** och **Testa**

✅ **Verify:** Workflow ska nu visas i listan med alla nodes

---

## 📥 **Steg 3: Importera Workflow 2 - Quotation Generation**

### File: `02-quotation-generation.json`

1. Gå till **Workflows** → **+ New**
2. Klicka på **⋮ (Menu)** → **Import from file**
3. Välj `workflows/02-quotation-generation.json`

---

## 🔌 **Steg 4: Konfigurera Webhook för Quotation Generation**

### Vad är en Webhook?
En webhook är en URL som Supabase anropar **automatiskt** när en booking skapas.

### Setup:

1. **Öppna Workflow 2** (02-quotation-generation)
2. **Klicka på Webhook-noden** (första noden)
3. **Kopiera webhookId:** `quotation-webhook`
4. Klicka på **"Copy Webhook URL"** 📋

Du får något som:
```
http://localhost:5678/webhook/quotation-webhook
```

⚠️ **OBS:** För att Supabase ska nå localhost behöver du:
- **Option A:** Publicera med `ngrok` (se nedan)
- **Option B:** Köra n8n på VPS/server (för produktion)

---

## 🌐 **Steg 5: Exponera Localhost med ngrok (För Supabase Webhook)**

### Installera ngrok:

```bash
# Mac (Homebrew)
brew install ngrok

# Linux
snap install ngrok
```

### Starta ngrok:

```bash
ngrok http 5678
```

Du får output som:
```
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:5678
```

### Uppdatera Webhook URL i n8n:

1. Öppna Workflow 2 i n8n
2. Klicka på **Webhook-noden**
3. Webhook URL blir nu:
```
https://abc123def456.ngrok.io/webhook/quotation-webhook
```

---

## 🔗 **Steg 6: Sätt upp Supabase Webhook**

### I Supabase Dashboard:

1. Gå till **Database** → **bookings** tabell
2. Klicka på **⋮ (Menu)** → **Webhooks**
3. Klicka på **+ New Webhook**

### Fyll i:

| Feld | Värde |
|------|-------|
| **Name** | `quotation-trigger` |
| **Events** | ☑️ INSERT |
| **HTTP Method** | POST |
| **URL** | `https://abc123def456.ngrok.io/webhook/quotation-webhook` |

### Headers (lägg till):

```
Content-Type: application/json
Authorization: Bearer your-secret-token
```

✅ **Spara**

---

## 🧪 **Steg 7: Testa Workflow Lokalt**

### Metod 1: Via n8n Test Mode

1. Öppna **Workflow 2** → **01-email-classification-FINAL** (för att testa booking creation)
2. Klicka på **Webhook-noden** i Workflow 1
3. Klicka på **"Listen for Test Event"** 🎧
4. Kör Workflow 1 (genom att skicka test-email eller manuell trigger)
5. En booking bör skapas
6. Webhook från Supabase triggar Workflow 2 automatiskt

### Metod 2: Manuell HTTP Request

```bash
curl -X POST \
  https://abc123def456.ngrok.io/webhook/quotation-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_id": "123e4567-e89b-12d3-a456-426614174000",
      "products_requested": "[{\"name\": \"Partytält 4x4m\", \"quantity\": 1, \"price\": 800}]",
      "event_date": "2025-11-15"
    }
  }'
```

---

## ✅ **Steg 8: Verifiering**

### Kontrollera i Supabase:

```sql
-- Se skapade quotations
SELECT id, booking_id, signing_token, status 
FROM quotations 
ORDER BY created_at DESC 
LIMIT 5;

-- Se att booking status uppdaterades
SELECT id, booking_status, quotation_sent_at 
FROM bookings 
WHERE booking_status = 'quotation_sent' 
LIMIT 5;
```

### Kontrollera n8n Logs:

1. Öppna **Workflow 2** → **Executions**
2. Du bör se senaste kör med status ✅ (grön)
3. Klicka på execution för att se detaljer

---

## 🐛 **Troubleshooting**

### Problem: "Webhook failed"

**Lösning:**
- Kontrollera att n8n körs på `localhost:5678`
- Kontrollera ngrok connection (`ngrok http 5678`)
- Verifiera webhook URL i Supabase

### Problem: "Supabase returns 401 Unauthorized"

**Lösning:**
- Verifiera Supabase credentials i n8n
- Kontrollera RLS policies i Supabase

### Problem: "Email inte skickat"

**Lösning:**
- Verifiera Gmail-account är kopplat i n8n
- Kontrollera Gmail credentials och 2FA

---

## 📊 **Workflow Flow Recap**

```
┌─────────────────────────────────────────┐
│ 1️⃣ Email Classification Workflow       │
│ (01-email-classification-FINAL.json)    │
│                                         │
│ Email → Extract → Classify → SAVE BOOKING
└────────────────┬────────────────────────┘
                 │
                 ↓ (Supabase Webhook)
┌────────────────────────────────────────┐
│ 2️⃣ Quotation Generation Workflow       │
│ (02-quotation-generation.json)         │
│                                        │
│ Webhook → Get Booking → Generate Token │
│ → Create Quotation → Build Email       │
│ → Send Email → Update Status           │
└────────────────────────────────────────┘
                 ↓
              Gmail Inbox
                 ↓
         Customer receives quotation
                 ↓
            ✍️ Signs & Returns
```

---

## 🎯 **Next Steps**

- [ ] Workflow 1 importerad & testad ✅
- [ ] Workflow 2 importerad ✅
- [ ] ngrok konfigurerad
- [ ] Supabase webhook satt upp
- [ ] Test booking skapad
- [ ] Email mottaget
- [ ] Quotation skapad i DB
- [ ] Gå vidare till **Fas 3: Frontend - Signature App** ✅

---

## 📞 **Support & Debugging**

### Logga in Workflow Execution:

```bash
# Se console logs från n8n
docker logs n8n

# Eller i n8n UI:
# Workflow → Executions → Klick på execution → Se Details
```

### Enable Debug Logging:

I n8n settings kan du aktivera DEBUG mode för mer detaljerade logs.

---

## 🎓 **Nödvändiga n8n Credentials**

Se till att du har dessa konfigurerade i n8n:

1. **Supabase** - `Eventgaraget` (service_role key)
2. **Gmail** - `Gmail-Admin` (OAuth2)
3. **Google Sheets** (om du använder FAQ/PriceList)

Kontrollera via **Settings** → **Credentials** 🔐

---

**Status:** ✅ Ready to Deploy
**Last Updated:** 2025-11-03
