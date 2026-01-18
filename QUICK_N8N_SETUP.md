# ⚡ Quick n8n Setup - 5 Minuter

## 🚀 Instant Setup

### 1️⃣ Start n8n (30 sekunder)
```bash
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget
docker-compose up -d n8n
# Vänta 30 sekunder...
# Gå till: http://localhost:5678
```

### 2️⃣ Installera ngrok (1 minut)
```bash
brew install ngrok
# Eller om redan installerad:
ngrok http 5678
```

### 3️⃣ Kopiera ngrok URL
Du får något som:
```
https://abc123def456.ngrok.io
```
**SPARA denna URL! 📋**

### 4️⃣ Importera Workflows i n8n (2 minuter)

**Workflow 1 - Email Classification:**
- Gå till http://localhost:5678
- Workflows → + New → ⋮ → Import from file
- Välj: `workflows/01-email-classification-FINAL.json`
- Click "Save"

**Workflow 2 - Quotation Generation:**
- Workflows → + New → ⋮ → Import from file
- Välj: `workflows/02-quotation-generation.json`
- Click "Save"

### 5️⃣ Setup Supabase Webhook (1 minut)

**I Supabase Console:**

1. Database → bookings tabell
2. ⋮ Menu → Webhooks → + New Webhook
3. Fyll i:
   - **Name:** `quotation-trigger`
   - **Events:** CHECK ✓ INSERT
   - **HTTP Method:** POST
   - **URL:** `https://abc123def456.ngrok.io/webhook/quotation-webhook`
4. Click "Create"

✅ **DONE!**

---

## 🧪 Testa Omedelbar

### Test 1: Skapa Booking Manuellt

I Supabase SQL Editor:
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

### Test 2: Se Quotation Skapad

```sql
SELECT id, booking_id, signing_token, status 
FROM quotations 
ORDER BY created_at DESC 
LIMIT 1;
```

Du bör se en ny quotation! ✅

### Test 3: Kontrollera Email Logs

I n8n:
- Workflow 2 → Executions
- Du bör se execution med status ✅

---

## 🐛 Quick Troubleshooting

| Problem | Lösning |
|---------|---------|
| ngrok kopplas inte | `ngrok http 5678` - kolla output |
| n8n startar inte | `docker-compose down` → `docker-compose up` |
| Webhook triggar inte | Verifiera URL i Supabase webhook |
| Email skickas inte | Verifiera Gmail-credentials i n8n |

---

## 📞 Nästa Steg

✅ Fas 1: Database Setup - **DONE**
✅ Fas 2: n8n Workflows - **DONE**
🚀 Fas 3: Frontend - Signature App - **NÄSTA**

Redo? → **Gå vidare till Fas 3!**
