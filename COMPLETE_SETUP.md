# EventGaraget - Komplett Setup Guide

## 🎯 Översikt

Denna guide täcker ALLT du behöver för att få systemet igång från scratch.

---

## 📋 Förberedelser

### 1. Konton du behöver skapa:

- ✅ **Google Cloud Console** (för Gmail & Google Sheets API)
- ✅ **OpenAI** (för GPT-4 API)
- ✅ **Supabase** (databas & storage)
- ✅ **n8n** (n8n.cloud eller self-hosted)
- ✅ **Vercel** (för hosting av Next.js apps)
- ✅ **Slack** (optional - för alerts)

---

## 1️⃣ Google Cloud Setup (Gmail & Sheets)

### A. Skapa projekt
1. Gå till [console.cloud.google.com](https://console.cloud.google.com)
2. Skapa nytt projekt: "EventGaraget"
3. Aktivera följande APIs:
   - Gmail API
   - Google Sheets API

### B. OAuth Credentials
1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "EventGaraget n8n"
5. **Authorized redirect URIs:**
   ```
   https://your-n8n-instance.app.n8n.cloud/rest/oauth2-credential/callback
   ```
6. **Create** → Spara Client ID och Client Secret

### C. Konfigurera OAuth Consent Screen
1. **OAuth consent screen**
2. User Type: **External**
3. App name: "EventGaraget"
4. User support email: din email
5. Scopes: Lägg till:
   - `.../auth/gmail.send`
   - `.../auth/gmail.readonly`
   - `.../auth/spreadsheets.readonly`
6. Add test users: Din Gmail-adress
7. **Save**

---

## 2️⃣ OpenAI Setup

1. Gå till [platform.openai.com](https://platform.openai.com)
2. **API Keys** → **Create new secret key**
3. Namn: "EventGaraget"
4. Spara nyckeln säkert!
5. Sätt upp billing om du inte redan gjort det

**Kostnad:** ~200-500 SEK/månad beroende på användning

---

## 3️⃣ Supabase Setup

### A. Skapa projekt
1. Gå till [supabase.com](https://supabase.com)
2. **New Project**
3. Name: "EventGaraget"
4. Database Password: **Stark lösenord** (spara!)
5. Region: **Europe (Stockholm)** för bästa prestanda
6. **Create project**

### B. Kör SQL Schema
1. Vänta tills projektet är klart (~2 min)
2. Gå till **SQL Editor**
3. Öppna `supabase/schema.sql` från projektet
4. Kopiera ALLT innehåll
5. Klistra in i SQL Editor
6. **Run**
7. Upprepa för `supabase/additional-tables.sql` (Professional-paketet)

### C. Setup Storage Bucket
1. Gå till **Storage**
2. **Create bucket**
3. Name: `documents`
4. Public bucket: **Ja** (för att kunna skicka PDF-länkar)
5. **Create bucket**
6. Gå till **Policies**
7. Lägg till policy:
   ```sql
   -- Allow public read access
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'documents' );
   
   -- Allow authenticated insert
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   WITH CHECK ( bucket_id = 'documents' AND auth.role() = 'anon' );
   ```

### D. Hämta API Keys
1. **Settings** → **API**
2. Spara:
   - **Project URL** (typ: `https://abc123.supabase.co`)
   - **anon public** key
   - **service_role** key (HEMLIG!)

---

## 4️⃣ n8n Setup

### Option A: n8n Cloud (Rekommenderat för start)
1. Gå till [n8n.cloud](https://n8n.cloud)
2. Skapa konto
3. **New instance**
4. Välj plan (Startup: ~$20/månad)

### Option B: Self-hosted (Docker)
```bash
cd Eventgaraget
./scripts/deploy.sh
```

Öppna: `http://localhost:5678`

### Konfigurera n8n

#### A. Environment Variables
I n8n Settings → **Variables**:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_SHEETS_FAQ_ID=your-sheet-id-here
GOOGLE_SHEETS_PRICE_LIST_ID=your-sheet-id-here
COMPANY_EMAIL=info@eventgaraget.se
COMPANY_PHONE=08-123 456 78
SMTP_FROM_EMAIL=bokningar@eventgaraget.se
SLACK_SUPPORT_CHANNEL=#support-team
```

#### B. Credentials Setup

**1. Gmail OAuth2:**
- Type: `Gmail OAuth2 API`
- Client ID: (från Google Cloud)
- Client Secret: (från Google Cloud)
- **Connect my account** → Authorize

**2. OpenAI:**
- Type: `OpenAI`
- API Key: (från OpenAI)

**3. Supabase:**
- Type: `HTTP Header Auth`
- Name: `apikey`
- Value: (Supabase anon key)
- Header Auth → Add another:
  - Name: `Authorization`
  - Value: `Bearer {service_role_key}`

**4. Google Sheets OAuth2:**
- Type: `Google Sheets OAuth2 API`
- Same credentials as Gmail
- **Connect my account**

**5. Slack (optional):**
- Type: `Slack API`
- Access Token: (från Slack App)

#### C. Import Workflows

1. **Main Booking Agent:**
   - **Workflows** → **Import from File**
   - Välj `workflows/main-booking-agent.json`
   - För varje node: Välj rätt credential
   - **Save**
   - **Activate** (toggle top-right)

2. **Signature Webhook:**
   - Import `workflows/signature-webhook.json`
   - Assign credentials
   - **Save & Activate**
   - **Webhook node** → Klicka → **Copy Webhook URL**
   - Spara URL:en (behövs för signature-app)

3. **CRM Analytics** (Professional):
   - Import `workflows/crm-analytics-workflow.json`
   - Assign credentials
   - **Save & Activate**

---

## 5️⃣ Google Sheets Setup

### A. Skapa Knowledge Base Sheet
1. Gå till [sheets.google.com](https://sheets.google.com)
2. **Blank spreadsheet**
3. Namn: "EventGaraget Knowledge Base"

### B. Skapa FAQ Sheet
1. **Add sheet** → Namn: "FAQ"
2. Importera `google-sheets-templates/FAQ_template.csv`:
   - **File** → **Import** → **Upload**
   - Välj fil
   - Import location: **Replace current sheet**
3. Fyll i egna FAQ:or

### C. Skapa PriceList Sheet
1. **Add sheet** → Namn: "PriceList"
2. Importera `google-sheets-templates/PriceList_template.csv`
3. Uppdatera med era priser

### D. Dela Sheet
1. **Share** (top-right)
2. Add email: **Gmail-adressen som n8n använder**
3. Role: **Editor**
4. **Send**

### E. Kopiera Sheet ID
From URL: `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

Uppdatera i n8n environment variables:
- `GOOGLE_SHEETS_FAQ_ID`
- `GOOGLE_SHEETS_PRICE_LIST_ID`

---

## 6️⃣ Deploy Signature App

### A. Setup Lokalt
```bash
cd signature-app
npm install

# Skapa .env.local
cp .env.local.example .env.local
```

### B. Fyll i .env.local
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/signature-completed
```

### C. Testa Lokalt
```bash
npm run dev
```
Öppna: `http://localhost:3000`

### D. Deploy till Vercel
```bash
# Installera Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod
```

Eller via Vercel Dashboard:
1. **Import Project** → GitHub repo
2. Framework: **Next.js**
3. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_N8N_WEBHOOK_URL`
4. **Deploy**

Spara URL:en (t.ex. `https://eventgaraget-sign.vercel.app`)

---

## 7️⃣ Deploy CRM Dashboard (Professional)

```bash
cd crm-dashboard
npm install

# .env.local
cp .env.local.example .env.local
# Fyll i Supabase credentials

# Test lokalt
npm run dev

# Deploy till Vercel
vercel deploy --prod
```

Spara URL:en (t.ex. `https://eventgaraget-crm.vercel.app`)

---

## 8️⃣ Testing

### Test 1: Support Question
Skicka email till `bokningar@eventgaraget.se`:

```
Subject: Fråga om priser
Body: 
Hej! 

Vad kostar det att hyra ett partytält för en helg?

MVH Anna
```

**Förväntat:**
- AI läser email
- Klassificerar som "support_question"
- Söker i FAQ
- Skickar svar inom 1-2 min

### Test 2: Incomplete Booking Request
```
Subject: Bokningsförfrågan
Body:
Hej!

Vi vill boka partytält och stolar till fest 15 juni.
Ca 50 gäster.

Leveransadress: Storgatan 1, Stockholm

MVH Anna (anna@example.com)
```

**Förväntat:**
- AI identifierar saknad info (telefon, org.nr, etc.)
- Skickar follow-up email med frågor
- Väntar på svar

### Test 3: Complete Booking Request
```
Subject: Bokningsförfrågan fest
Body:
Hej!

Vi vill boka:
- Partytält 6x12m
- 10 bord
- 50 stolar

Event: Födelsedagsfest
Gäster: 50 personer
Datum: 15 juni - 16 juni 2024
Leverans: Storgatan 1, 111 22 Stockholm
Faktura: Samma adress

Kund: Anna Svensson
Email: anna@example.com
Telefon: 070-123 45 67
Företag: EventAB
Org.nr: 556677-8899

MVH Anna
```

**Förväntat:**
- AI skapar offert direkt
- Skickar email med priser
- Inkluderar signeringslänk
- Kunden kan signera direkt

### Test 4: Signature Flow
1. Öppna signeringslänken från email
2. Granska offert
3. Kryssa i "Jag godkänner"
4. Signera
5. Klicka "Signera & Bekräfta"

**Förväntat:**
- PDF genereras
- Sparas i Supabase
- Success-sida visas
- Kunden får bekräftelse-email med PDF
- EventGaraget får intern notification

---

## 9️⃣ Monitoring & Underhåll

### Daily Checks
- [ ] Kolla n8n executions för errors
- [ ] Verifiera att emails skickas
- [ ] Kontrollera Supabase storage usage

### Weekly Tasks
- [ ] Review AI-svar kvalitet
- [ ] Uppdatera FAQ om nya frågor kommer
- [ ] Kolla customer churn reports (Professional)

### Monthly Tasks
- [ ] Backup Supabase databas
- [ ] Review & optimera AI prompts
- [ ] Analysera boknings-statistik

---

## 🔧 Troubleshooting

### Gmail inte triggar workflow
**Problem:** Nya emails detekteras inte

**Lösningar:**
1. Kolla Gmail API är aktiverat
2. Verifiera OAuth är authorized
3. Test credentials i n8n
4. Kolla quota limits i Google Cloud

### AI svarar konstigt
**Problem:** Dåliga/irrelevanta svar

**Lösningar:**
1. Review system prompt
2. Öka temperature för mer kreativitet
3. Eller minska för mer precision
4. Uppdatera FAQ-databasen

### Signature app ger 404
**Problem:** Kan inte hitta booking

**Lösningar:**
1. Kolla att booking finns i Supabase
2. Verifiera booking_number är korrekt
3. Check RLS policies i Supabase
4. Testa med anon key i browser console

### Webhook inte skickar emails
**Problem:** Efter signering kommer inga emails

**Lösningar:**
1. Kolla webhook URL är korrekt i .env.local
2. Test webhook manuellt med curl
3. Check n8n execution log
4. Verifiera Gmail credentials

---

## 📊 Kostnader (månad)

### Startup-paketet:
- n8n Cloud Starter: ~$20 (~200 SEK)
- OpenAI GPT-3.5: ~$10-30 (~100-300 SEK)
- Supabase Free tier: $0 (up to 500MB)
- Vercel Hobby: $0
- **Total: ~300-500 SEK/månad**

### Professional-paketet:
- n8n Cloud Pro: ~$50 (~500 SEK)
- OpenAI GPT-4: ~$30-80 (~300-800 SEK)
- Supabase Pro: $25 (~250 SEK)
- Vercel Pro: $20 (~200 SEK)
- **Total: ~1,250-1,750 SEK/månad**

---

## ✅ Final Checklist

- [ ] Google Cloud project setup
- [ ] Gmail & Sheets APIs aktiverade
- [ ] OAuth credentials konfigurerade
- [ ] OpenAI API key
- [ ] Supabase projekt skapat
- [ ] SQL schema körda
- [ ] Storage bucket setup
- [ ] n8n instance igång
- [ ] n8n credentials konfigurerade
- [ ] Alla 3 workflows importerade & aktiva
- [ ] Google Sheets skapade & delade
- [ ] Sheet IDs uppdaterade i n8n
- [ ] Signature app deployad till Vercel
- [ ] Webhook URL konfigurerad
- [ ] CRM Dashboard deployad (Professional)
- [ ] Alla test-scenarion körda
- [ ] Backup-rutiner setupade

---

## 🎉 KLAR!

Nu är hela systemet igång! 

**Nästa steg:**
1. Lägg till riktig info i Google Sheets (FAQ & Priser)
2. Testa med riktiga bokningar
3. Träna teamet i systemet
4. Monitor & optimera

**Dokumentation:**
- `README.md` - Översikt
- `QUICK_START.md` - Snabbguide
- `BOOKING_FLOW.md` - Detaljerat flöde
- `WORKFLOW_OVERVIEW.md` - Workflow-struktur

**Support:**
Vid problem, kolla n8n execution logs först - de visar exakt var något går fel!

Lycka till! 🚀

