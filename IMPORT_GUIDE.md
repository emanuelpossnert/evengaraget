# Guide: Importera Fixade Workflows till n8n

## 📦 Filer att Importera

| Fil | Beskrivning | Status |
|-----|-------------|--------|
| `main-booking-agent-FIXED.json` | Huvudflöde med alla fixes | ✅ Redo att importera |
| `signature-webhook.json` | Webhook för signering | ✅ Redo att importera |
| `crm-analytics-workflow.json` | CRM automation (Professional) | ✅ Redo att importera |

---

## 🚀 Importera till n8n

### Steg 1: Öppna n8n
Gå till din n8n instance (t.ex. `http://localhost:5678` eller `https://your-instance.app.n8n.cloud`)

### Steg 2: Import Workflow
1. Klicka på **Workflows** i vänster sidebar
2. Klicka på **"..."** (tre prickar) top-right
3. Välj **"Import from File"**
4. Browse till:
   ```
   /Users/emanuelpossnert/Documents/Dev projects/Eventgaraget/workflows/main-booking-agent-FIXED.json
   ```
5. Klicka **Open**
6. Workflow importeras!

### Steg 3: Upprepa för Övriga Workflows
- `signature-webhook.json`
- `crm-analytics-workflow.json` (om Professional-paket)

---

## ⚙️ Konfigurera Efter Import

### 1. Environment Variables (VIKTIGT!)

I n8n: **Settings** → **Variables** → Lägg till:

```
SUPABASE_URL = https://your-project.supabase.co
COMPANY_EMAIL = info@eventgaraget.se
COMPANY_PHONE = 08-123 456 78
```

### 2. Credentials (Alla måste konfigureras!)

#### A. Gmail OAuth2
1. **Credentials** → **Add Credential**
2. Type: `Gmail OAuth2 API`
3. Fyll i Client ID & Secret från Google Cloud
4. **Connect Account** → Authorize

#### B. OpenAI
1. **Credentials** → **Add Credential**
2. Type: `OpenAI`
3. API Key: `sk-...` (från OpenAI)

#### C. Supabase (HTTP Header Auth)
1. **Credentials** → **Add Credential**
2. Type: `HTTP Header Auth`
3. Name: `Supabase EventGaraget`
4. **Add Header:**
   ```
   Name: apikey
   Value: [Din Supabase service_role key]
   ```
5. **Add Header:**
   ```
   Name: Authorization
   Value: Bearer [Samma service_role key]
   ```

#### D. Google Sheets OAuth2
1. Same as Gmail OAuth2
2. Will use same Google account

#### E. Slack API (Optional)
1. Type: `Slack API`
2. Access Token från Slack App

### 3. Koppla Credentials till Nodes

För varje workflow, gå igenom noderna och välj rätt credential:

**Gmail nodes:**
- Gmail Trigger
- Send Follow-up Email
- Send Booking Email
→ Välj: Gmail OAuth2 credential

**OpenAI nodes:**
- AI Classifier
- AI Agent - Quote Generator
- AI Agent - Support
→ Välj: OpenAI credential

**HTTP Request nodes (Supabase):**
- Create Customer
- Create Conversation
- Log Message
- Create Booking
→ Välj: Supabase (HTTP Header Auth) credential

**Google Sheets nodes:**
- Get FAQ Data
- Get Price List
→ Välj: Google Sheets OAuth2 credential

### 4. Aktivera Workflows

För varje workflow:
1. Öppna workflowet
2. Klicka på **toggle** (switch) top-right
3. Grön = Active ✅

---

## 🎯 Vad som Är Fixat i main-booking-agent-FIXED.json

### ✅ Fix 1: Parse AI Response
- Robust error handling för olika OpenAI response-format
- Hanterar single quotes → double quotes
- Tar bort trailing commas
- Försöker alla möjliga response-locations

### ✅ Fix 2: Router Fallback Output
- Ändrat från `4` till `3`
- Nu fungerar routing korrekt

### ✅ Fix 3: Code Nodes för Data Preparation
Alla Supabase HTTP requests har nu egna "Prepare" code nodes:
- **Prepare Customer Data** → Formaterar customer innan insert
- **Prepare Conversation** → Formaterar conversation
- **Prepare Message Log** → Formaterar message

Detta löser "JSON parameter needs to be valid JSON" problem!

### ✅ Fix 4: Förenklad Struktur
- Bara 2 outputs från Router implementerade (Follow-up + Create Quote)
- Övriga outputs kan läggas till senare
- Fokus på att få grundflödet att fungera först

---

## 🧪 Testa Efter Import

### Test 1: Kolla att Credentials Fungerar

Skapa test-workflow:
```
Manual Trigger
  → HTTP Request
    Method: GET
    URL: ={{$env.SUPABASE_URL}}/rest/v1/customers
    Auth: Supabase credential
```
Execute → Ska returnera customers (eller tom array)

### Test 2: Testa Workflow med Test-Email

Skicka email till din Gmail som n8n lyssnar på:
```
To: din-gmail@gmail.com
Subject: Bokningsförfrågan test

Hej!

Vi vill boka partytält till fest 15 juni.
Ca 50 gäster.

Kund: Test Testsson
Email: test@example.com
Telefon: 070-123 45 67
Adress: Testgatan 1, Stockholm

MVH Test
```

### Test 3: Övervaka Execution

1. n8n → **Executions** (left sidebar)
2. Se senaste execution
3. Klicka för detaljer
4. Kolla varje node:
   - Grön = Success ✅
   - Röd = Error ❌

---

## 🐛 Troubleshooting

### Problem: "Environment variable not found"
**Lösning:** Gå till Settings → Variables och lägg till `SUPABASE_URL`

### Problem: "Credential not found"
**Lösning:** Gå igenom alla nodes och välj rätt credential från dropdown

### Problem: "Authentication failed"
**Lösning:** 
1. Kolla att credentials är rätt konfigurerade
2. Test credentials: Credentials → Click credential → Test
3. För OAuth: Re-authorize med **Connect Account**

### Problem: Supabase 401 Error
**Lösning:**
1. Använder du `service_role` key? (INTE anon key)
2. Är `Authorization: Bearer [key]` header korrekt?
3. Finns tabellerna i Supabase? (Kör SQL schemas)

### Problem: Gmail Trigger inte aktiv
**Lösning:**
1. Workflow måste vara "Active" (grön toggle)
2. Gmail OAuth2 måste vara authorized
3. Gmail API måste vara enabled i Google Cloud

---

## 📋 Checklista Efter Import

- [ ] Alla 3 workflows importerade
- [ ] Environment variables satta (SUPABASE_URL)
- [ ] Gmail OAuth2 credential skapad & authorized
- [ ] OpenAI credential skapad med API key
- [ ] Supabase HTTP Header Auth credential skapad
- [ ] Google Sheets OAuth2 credential skapad & authorized
- [ ] Alla nodes har rätt credential vald
- [ ] Alla workflows aktiverade (grön toggle)
- [ ] SQL schemas körda i Supabase
- [ ] Testat med test-email
- [ ] Execution log visar success

---

## ✨ Nästa Steg

När allt fungerar:

1. **Lägg till fler outputs i Router:**
   - Output 2: Support Questions → FAQ Response
   - Output 3: Requires Human → Slack Alert

2. **Expandera Quote-flödet:**
   - Get Price List från Google Sheets
   - AI Generate Quote
   - Create Booking i Supabase
   - Send Quote Email med signering-länk

3. **Setup Google Sheets:**
   - Skapa FAQ-sheet
   - Skapa PriceList-sheet
   - Importera templates från `google-sheets-templates/`

4. **Deploy Frontend Apps:**
   - Signature app till Vercel
   - CRM dashboard till Vercel (Professional)

5. **Setup Slack (Optional):**
   - Skapa Slack App
   - Add till workspace
   - Kopiera Bot Token
   - Konfigurera Slack credential i n8n

---

## 💡 Pro Tips

1. **Alltid testa credentials först** med enkla GET-requests
2. **Kolla Execution logs** när något går fel - de visar exakt vad som hände
3. **Använd console.log()** i Code nodes för debugging
4. **Börja enkelt** - Få grundflödet att fungera först, lägg till features sen
5. **Backup workflows** - Export regelbundet till JSON

---

**Lycka till med implementationen! 🚀**

För frågor, se:
- `TROUBLESHOOTING.md` - Felsökningsguide
- `COMPLETE_SETUP.md` - Komplett setup från scratch
- `WORKFLOW_OVERVIEW.md` - Förståelse av flödet

