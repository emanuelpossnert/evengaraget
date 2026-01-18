# 🔧 WEBHOOK FIX - Production Mode

## Problem
Webhooks är "active" men triggar inte automatiskt

## Orsak
Webhook-noderna är inte i **Production Mode**

---

## ✅ FIX 1: Aktivera Production Mode på Flöde 02

### I n8n:
1. Öppna **Workflow 02 - Quotation Generation**
2. Klicka på **Webhook-noden** (första noden)
3. **VIKTIGT:** Klicka på **🚪 (dörrsymbolen)** i noden
   - Du ska se en toggle för "Production active"
4. **Sätt den till ON/Active** ✅
5. Du ska se: "Production webhook is active"
6. **Spara workflow** (Ctrl+S / Cmd+S)

### Webhook URL för Production:
```
Om du använder localhost (ngrok):
https://YOUR-NGROK-URL.ngrok-free.dev/webhook/quotation-generation

Om du använder n8n-cloud eller production self-hosted:
https://your-n8n-domain.com/webhook/quotation-generation
```

---

## ✅ FIX 2: Skapa quotation_events tabell

Kör denna SQL i Supabase SQL Editor:

```sql
-- Skapa quotation_events tabell
CREATE TABLE IF NOT EXISTS public.quotation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quotation_events ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anonymous users (för signing-sidan)
CREATE POLICY "Allow inserts from anonymous users"
ON public.quotation_events
FOR INSERT
TO anon
WITH CHECK (true);

-- Verify
SELECT * FROM public.quotation_events LIMIT 1;
```

---

## ✅ FIX 3: Aktivera Production Mode på Flöde 03

### I n8n:
1. Öppna **Workflow 03 - Quotation Signed Email**
2. Klicka på **Webhook-noden** (första noden)
3. Klicka på **🚪 (dörrsymbolen)**
4. **Sätt till ON/Active** ✅
5. **Spara workflow**

---

## ✅ FIX 4: Verifiera Supabase Webhooks

### I Supabase Dashboard:

**Database → Webhooks**

Du ska se TWO webhooks:

#### Webhook 1: bookings INSERT
```
Name: n8n-quotation-generation
Table: bookings
Events: ✓ INSERT
HTTP Method: POST
URL: YOUR-PRODUCTION-N8N-URL/webhook/quotation-generation
Status: ✓ Active
```

#### Webhook 2: quotation_events INSERT
```
Name: n8n-quotation-signed
Table: quotation_events
Events: ✓ INSERT
HTTP Method: POST
URL: YOUR-PRODUCTION-N8N-URL/webhook/quotation-signed
Status: ✓ Active
```

---

## 🧪 Test

### Test 1: Manual Booking
```sql
INSERT INTO public.bookings (
  customer_id,
  products_requested,
  event_date,
  location,
  booking_status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '[{"name": "Partytält", "quantity": 1}]'::jsonb,
  '2025-12-01'::date,
  'Stockholm',
  'pending_quotation'
);
```

### Test 2: Check n8n Executions
```
n8n → Workflow 02 → Executions
Du ska se nyss skapade booking trigga flödet automatiskt ✅
```

### Test 3: Check Quotation Created
```sql
SELECT id, booking_id, status, signing_token
FROM quotations
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🚨 Troubleshooting

### Q: Webhook URL får 404
- **A:** Webhook-noden är inte i Production mode

### Q: ngrok URL är dead
- **A:** ngrok stängs ned efter ~2 timmar
  - Lösning: Använd permanent n8n domain eller starta ngrok igen

### Q: Supabase webhook shows "FAILED"
- **A:** N8n webhook är inte active
  - Fixa med steg 1 ovan

### Q: Event sparas men flöde triggar inte
- **A:** quotation_events tabell saknas eller webhook inte konfigurerad
  - Kör steg 2 och 4

---

## Permanent Production Setup (Rekommenderat)

Istället för ngrok, använd:
1. **n8n Cloud** (enkelt)
2. **Self-hosted n8n** med public domain
3. **Railway/Render** med production URL

Se WEBHOOK_PERMANENT_SETUP.md för detaljer.
