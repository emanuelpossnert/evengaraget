# 🔗 Permanent Webhook Setup - Supabase → n8n

## Problem
- Test-webhooks disaktiveras efter ~1 minut
- Måste trigga manuellt varje gång
- Flöden körs bara under test

## Lösning
Använd **Supabase Database Webhooks** för att trigga n8n automatiskt när data ändras

---

## 📋 FLÖDE 02: Quotation Generation (när bokning skapas)

### Steg 1: Skapa n8n Production Webhook
```
1. Öppna n8n → Workflow 02
2. Klicka på Webhook-noden
3. Klicka på dörrsymbolen 🚪 (Production Toggle)
4. Status ska visa: "Production active"
5. Kopiera Webhook URL
```

**Production Webhook URL ser ut så här:**
```
https://YOUR-N8N-DOMAIN/webhook/quotation-generation
```
(eller localhost:5678 för lokal test)

### Steg 2: Skapa Supabase Webhook (för bookings INSERT)

Gå till **Supabase Dashboard → Database → Webhooks**

```
1. Klicka "+ New Webhook"

2. Fyll i:
   - Webhook name: "n8n-quotation-generation"
   - Table: "bookings"
   - Events: ✓ INSERT (checka ENDAST INSERT)
   - HTTP method: POST
   - HTTPS URL: Ditt n8n Production Webhook URL
   
3. Headers (optional men rekommenderat):
   Authorization: Bearer YOUR-SECRET-TOKEN
   
4. Klicka "Save webhook"
```

**Payload som skickas till n8n:**
```json
{
  "type": "INSERT",
  "schema": "public",
  "table": "bookings",
  "record": { /* hela booking-raden */ },
  "old_record": null
}
```

### Steg 3: Uppdatera n8n Webhook Node (02)

I n8n, ändra Webhook-noden för att läsa från `.json.record` istället för `.json.body`:

```javascript
// Ändra från:
const booking = $json.body.record;

// Till:
const booking = $json.record;
```

---

## 📋 FLÖDE 03: Quotation Signed Email (när offert signeras)

### Problem
Signing-sidan skickar webhook POST direkt från frontend. Vi behöver göra denna **persistent**.

### Lösning A: Via Supabase Webhook (REKOMMENDERAT)

#### Steg 1: Uppdatera signing-sidan
Istället för att skicka webhook direkt, spara en `signed` event i Supabase:

**Lägg till denna tabell i Supabase:**
```sql
CREATE TABLE IF NOT EXISTS quotation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'signed', 'sent', etc.
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Steg 2: I signing-sidan, spara event istället för webhook
```javascript
// Istället för fetch to n8n, gör:
await fetch(`${url}/rest/v1/quotation_events`, {
  method: 'POST',
  headers: { 'apikey': apiKey!, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quotation_id: quotation.id,
    event_type: 'signed',
    event_data: {
      customer_email: formData.email,
      customer_name: formData.name,
      pdf_url: pdfUrl,
      total_amount: grandTotal,
      signed_at: new Date().toISOString(),
    }
  })
});
```

#### Steg 3: Skapa Supabase Webhook för quotation_events
```
1. Gå till Supabase Webhooks
2. "+ New Webhook"
3. Fyll i:
   - Name: "n8n-quotation-signed"
   - Table: "quotation_events"
   - Events: ✓ INSERT
   - HTTP method: POST
   - HTTPS URL: Ditt n8n Production Webhook för Flöde 03
4. Save
```

#### Steg 4: Uppdatera n8n Flöde 03
Extract Data-noden ändras till:
```javascript
const data = $json.record.event_data;
return [{ json: data }];
```

---

## 🔐 PRODUKTION (med ngrok lokal)

### För lokal testing med ngrok:

1. **Starta ngrok:**
   ```bash
   ngrok http 5678
   ```

2. **Kopiera URL från ngrok:**
   ```
   https://xxxxx-xxxxx-xxxxx.ngrok-free.dev
   ```

3. **I Supabase Webhooks, använd ngrok-URL:**
   ```
   https://xxxxx-xxxxx-xxxxx.ngrok-free.dev/webhook/quotation-generation
   https://xxxxx-xxxxx-xxxxx.ngrok-free.dev/webhook-test/quotation-signed
   ```

4. **OBS:** ngrok-URL ändras varje gång du startar om! Uppdatera Supabase webhook varje gång.

---

## ✅ CHECKLISTA

### Flöde 02 (Quotation Generation)
- [ ] n8n Webhook är i **Production** (dörrikon aktiverat)
- [ ] Supabase Webhook skapad för `bookings` INSERT
- [ ] Webhook URL är korrekt (production, inte localhost)
- [ ] n8n Webhook-nod läser från `.json.record`
- [ ] Testat: Skapa booking → offert genereras automatiskt ✅

### Flöde 03 (Quotation Signed Email)
- [ ] Supabase `quotation_events` tabell skapad
- [ ] Signing-sidan sparar event i Supabase
- [ ] n8n Webhook är i **Production**
- [ ] Supabase Webhook skapad för `quotation_events` INSERT
- [ ] n8n Extract Data läser från `.json.record.event_data`
- [ ] Testat: Signera → email skickas automatiskt ✅

---

## 🧪 TEST

### Test Flöde 02:
```bash
1. Gå till CRM (när vi bygger den) eller skapa booking direkt i Supabase
2. INSERT ny booking-rad
3. Kontrollera n8n Logs → "Execution successful"
4. Kontrollera Supabase quotations → ny rad skapad
```

### Test Flöde 03:
```bash
1. Gå till quotation-sidan
2. Signera offert
3. Kontrollera Supabase quotation_events → ny rad skapad
4. Kontrollera n8n Logs → email skickat
5. Kontrollera Gmail → email mottagen
```

---

## 🐛 Debugging

### Webhook triggades inte?
```bash
# 1. Kontrollera n8n Logs
# 2. Aktivera "Show Full Logs" i Supabase Webhook
# 3. Kontrollera HTTP Status
# 4. Kontrollera ngrok är aktiv (om lokal)
```

### Webhook returnerar fel?
```sql
-- Kontrollera webhook history i Supabase
SELECT * FROM INFORMATION_SCHEMA.WEBHOOKS 
WHERE STATUS = 'ERROR'
LIMIT 10;
```

### ngrok URL ändras?
```bash
# Starta ngrok med permanent URL:
ngrok http 5678 --region us --authtoken YOUR_TOKEN
```

---

## 📚 SLUTSATS

| Setup | Pros | Cons |
|-------|------|------|
| **Test Webhook** | Enkel att testa | Stängs av efter 1 min |
| **Production Webhook** | Kör alltid när jag triggar manuellt | Måste trigga från n8n UI |
| **Supabase Webhook** | Körs AUTOMATISKT när data ändras ✅ | Kräver Supabase-tabell |

**REKOMMENDATION: Använd Supabase Webhooks för både Flöde 02 och 03** ✅

