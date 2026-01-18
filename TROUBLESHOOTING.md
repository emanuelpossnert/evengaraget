# EventGaraget - Felsökning

## 🔧 Vanliga Problem & Lösningar

---

## ❌ Problem: "undefined is not valid JSON" i Parse AI Response

### Symptom:
```
"undefined" is not valid JSON [line 1]
SyntaxError
```

I noden "Parse AI Response" efter AI-klassificering.

### Orsak:
OpenAI-noden kan returnera data i olika format beroende på:
- n8n version
- OpenAI node version
- Vilken OpenAI model som används

### ✅ Lösning:
Workflowet `main-booking-agent.json` är nu uppdaterat med robust error handling som hanterar alla format automatiskt.

**Om du fortfarande får felet:**

1. **Kontrollera AI-nodens output:**
   - Klicka på "AI Agent - Email Classifier & Info Check" noden
   - Kolla "Output" → Se vad som finns i `json`
   - Leta efter: `response`, `choices[0].message.content`, `message.content`, eller `text`

2. **Debugga i Parse AI Response noden:**
   
   Ersätt koden med detta för att se vad som kommer in:
   
   ```javascript
   // DEBUG: Se exakt vad som kommer från AI
   console.log('Full input:', JSON.stringify($input.first().json, null, 2));
   
   return $input.first().json;
   ```
   
   Kör workflowet → Kolla browser console → Se vad som loggas

3. **Uppdatera till rätt format:**
   
   När du vet var AI-svaret finns, uppdatera koden:
   
   ```javascript
   const input = $input.first().json;
   let aiResponse;
   
   // Byt ut "response" med rätt path du hittade
   if (input.response) {
     aiResponse = JSON.parse(input.response);
   } else if (input.choices?.[0]?.message?.content) {
     aiResponse = JSON.parse(input.choices[0].message.content);
   } else {
     throw new Error('Could not find AI response. Check console.log output');
   }
   
   return {
     ...aiResponse,
     original_email: input,
     processed_at: new Date().toISOString()
   };
   ```

---

## ❌ Problem: Gmail Trigger Fungerar Inte

### Symptom:
Nya emails detekteras inte av n8n

### Möjliga Orsaker:

1. **OAuth inte godkänd:**
   - Gå till Gmail credential i n8n
   - Klicka "Connect my account"
   - Authorize i Google popup

2. **Gmail API inte aktiverat:**
   - Gå till [console.cloud.google.com](https://console.cloud.google.com)
   - **APIs & Services** → **Library**
   - Sök "Gmail API"
   - **Enable**

3. **Fel scopes:**
   - I Google Cloud Console → OAuth consent screen
   - Scopes måste inkludera:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`

4. **Quota limits:**
   - Google Cloud Console → **APIs & Services** → **Gmail API** → **Quotas**
   - Default: 1 billion units/day (mer än tillräckligt)
   - Om du når limit: Öka i console

### ✅ Lösning:
```bash
# Test Gmail connection
# I n8n, kör workflow manuellt med "Execute Workflow" button
# Kolla execution log för errors
```

---

## ❌ Problem: AI Svarar Konstigt/Irrelevant

### Symptom:
AI genererar felaktiga svar eller klassar emails fel

### Möjliga Orsaker:

1. **För hög/låg temperature:**
   - Hög (0.7-1.0) = Kreativt men opålitligt
   - Låg (0.1-0.3) = Precist men stelt

2. **System prompt behöver förbättras:**
   - Lägg till fler exempel
   - Var mer specifik om vad du vill

3. **FAQ-databasen är tom/gammal:**
   - Uppdatera Google Sheets
   - Lägg till vanliga frågor

### ✅ Lösning:

**1. Justera temperature:**

I AI-noden (t.ex. "AI Agent - Email Classifier & Info Check"):
```json
"options": {
  "temperature": 0.3  // Låg = Mer konsekvent
}
```

**2. Förbättra system prompt:**

Lägg till exempel i system message:
```
Du är EventGaragets AI-agent. Analysera emails...

EXEMPEL:

Email: "Hej, vad kostar ett tält?"
→ classification: "support_question"
→ extracted_questions: ["Vad kostar partytält?"]

Email: "Vi vill boka tält till 15 juni"
→ classification: "booking_request"
→ missing_info: ["contact_info", "products"]
```

**3. Uppdatera FAQ:**

Gå till Google Sheet → "FAQ" tab → Lägg till:
| Fråga | Svar | Kategori | Tags |
|-------|------|----------|------|
| Vad kostar partytält? | Från 2500 kr/dag | priser | tält,hyra |

---

## ❌ Problem: Supabase Connection Error

### Symptom:
```
Request failed with status code 401
```

### Möjliga Orsaker:

1. **Fel API key:**
   - Använder du `anon` key eller `service_role` key?
   - För n8n: **Använd service_role key**

2. **RLS policies blockerar:**
   - Row Level Security kan blockera queries

### ✅ Lösning:

**1. Kontrollera API key:**

I n8n → Credentials → Supabase:
```
Header: apikey
Value: eyJhbG... (service_role key, INTE anon)

Header: Authorization  
Value: Bearer eyJhbG... (samma service_role key)
```

**2. Kolla RLS policies:**

I Supabase → Table Editor → customers → RLS:
- Disable RLS temporärt för test
- Om det funkar: Fixa policies
- Enable RLS igen

**Bra policy för service_role:**
```sql
CREATE POLICY "Service role has full access"
ON customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## ❌ Problem: Signature App - "Booking not found"

### Symptom:
När kund klickar på signeringslänk: "Bokningen kunde inte hittas"

### Möjliga Orsaker:

1. **Booking finns inte i Supabase**
2. **Fel booking_number i URL**
3. **RLS policies blockerar läsning**

### ✅ Lösning:

**1. Verifiera booking finns:**

I Supabase → Table Editor → bookings:
- Sök efter booking_number (t.ex. "BK-2024-123456")
- Om den inte finns: Kolla varför AI inte skapade bokningen

**2. Test RLS policies:**

```sql
-- I Supabase SQL Editor
-- Kolla att anon key kan läsa bookings
SELECT * FROM bookings WHERE booking_number = 'BK-2024-123456';
```

Om du får error: RLS blockerar.

**Fix:**
```sql
-- Tillåt publik läsning av bookings (för signeringslänkar)
CREATE POLICY "Anyone can read bookings for signing"
ON bookings
FOR SELECT
TO anon
USING (contract_signed = false);  -- Endast osignerade
```

**3. Debug i signature-app:**

Lägg till console.log i `signature-app/app/sign/[token]/page.tsx`:

```typescript
const loadBooking = async () => {
  console.log('Looking for booking:', token);
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`...`)
    .eq('booking_number', token)
    .single();
  
  console.log('Supabase response:', { data, error });
  // ...
};
```

---

## ❌ Problem: Webhook Inte Triggar Efter Signering

### Symptom:
Kund signerar, men inga confirmation-emails skickas

### Möjliga Orsaker:

1. **Fel webhook URL:**
   - URL i `.env.local` stämmer inte med n8n

2. **Webhook workflow inte aktivt:**
   - Workflow "Signature Completion Webhook" är inte påslaget

3. **n8n instance inte nåbar:**
   - Localhost funkar inte från Vercel
   - Behöver publikt tillgänglig URL

### ✅ Lösning:

**1. Hämta rätt webhook URL:**

I n8n:
- Öppna "Signature Completion Webhook" workflow
- Klicka på "Webhook Trigger" noden
- **Copy Webhook URL**
- Exempel: `https://your-instance.app.n8n.cloud/webhook/signature-completed`

**2. Uppdatera .env.local:**

```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/signature-completed
```

**3. Verifiera webhook är aktiv:**

I n8n:
- Workflow måste vara "Active" (grön toggle)
- Test webhook manuellt:

```bash
curl -X POST https://your-n8n.com/webhook/signature-completed \
  -H "Content-Type: application/json" \
  -d '{
    "booking_number": "BK-2024-TEST",
    "customer_email": "test@example.com",
    "customer_name": "Test Customer"
  }'
```

Kolla n8n executions → Ska se en ny execution

**4. För local development:**

Om du kör n8n lokalt (`localhost:5678`), använd ngrok:

```bash
ngrok http 5678
# Använd ngrok URL i .env.local
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://abc123.ngrok.io/webhook/signature-completed
```

---

## ❌ Problem: Google Sheets Inte Hittas

### Symptom:
```
Error: Unable to find spreadsheet
```

### Möjliga Orsaker:

1. **Fel Sheet ID**
2. **Sheet inte delad med n8n Gmail-konto**
3. **Google Sheets API inte aktiverat**

### ✅ Lösning:

**1. Hämta korrekt Sheet ID:**

From URL: `https://docs.google.com/spreadsheets/d/ABC123XYZ/edit`

Sheet ID = `ABC123XYZ`

**2. Dela sheet:**

I Google Sheets:
- **Share** button (top-right)
- Lägg till email: Din Gmail som n8n använder
- Role: **Editor**
- **Send**

**3. Aktivera Google Sheets API:**

Google Cloud Console → APIs & Services → Library → "Google Sheets API" → **Enable**

**4. Uppdatera n8n environment:**

```
GOOGLE_SHEETS_FAQ_ID=ABC123XYZ
GOOGLE_SHEETS_PRICE_LIST_ID=DEF456UVW
```

---

## 🐛 Generell Debug-Strategi

### Steg 1: Kolla n8n Execution Log
1. n8n → **Executions** (left sidebar)
2. Klicka på senaste execution
3. Se vilken node som failade
4. Kolla input/output för varje node

### Steg 2: Lägg till console.log
I Code-noder, lägg till:
```javascript
console.log('Debug:', JSON.stringify($input.all(), null, 2));
// Din kod här
```

Öppna browser console → F12 → Console tab

### Steg 3: Test Credentials
I n8n → Credentials → Välj credential → **Test**

### Steg 4: Kolla Environment Variables
I n8n → Settings → Variables
- Verifiera alla är ifyllda
- Inga stavfel

### Steg 5: Restart n8n
```bash
# Om self-hosted
docker-compose restart n8n

# Om n8n.cloud
Gå till n8n.cloud dashboard → Restart instance
```

---

## 📞 Fortfarande Problem?

### Kontrollera:
1. ✅ Alla credentials är konfigurerade i n8n
2. ✅ Alla APIs är aktiverade i Google Cloud
3. ✅ Supabase tabeller finns och RLS är korrekt
4. ✅ Google Sheets är delade
5. ✅ Workflows är aktiva (grön toggle)
6. ✅ Environment variables är korrekta

### Debug-checklist:
- [ ] Kolla n8n execution logs
- [ ] Lägg till console.log
- [ ] Testa credentials
- [ ] Verifiera API keys
- [ ] Kolla browser console
- [ ] Restart n8n/workflows

### Dokumentation:
- `COMPLETE_SETUP.md` - Komplett setup-guide
- `WORKFLOW_OVERVIEW.md` - Hur workflows fungerar
- `BOOKING_FLOW.md` - Steg-för-steg flöde

---

**Pro tip:** Starta alltid med att kolla n8n execution logs - de visar EXAKT var problemet är! 🎯

