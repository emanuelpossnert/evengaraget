# EventGaraget - Quick Start Guide

## 🎯 Välj ditt paket

### 🚀 STARTUP (65,000 SEK) - Kom igång snabbt
**För dig som vill:**
- Automatisera bokningshantering
- Spara tid på rutinuppgifter
- Testa AI-lösning först
- Ha ett komplett grundsystem

**Du får:**
- AI Bokningsagent (GPT-3.5)
- Digital signeringstjänst
- Gmail + Google Sheets integration
- Supabase databas
- 3 veckors implementation

### 💎 PROFESSIONAL (125,000 SEK) - Full kontroll
**För dig som vill:**
- Ha full översikt över alla kunder
- Data-driven beslut
- Avancerad analytics
- Maximera kundvärde
- Churn prevention

**Du får:**
- Allt från Startup
- CRM Dashboard (UI)
- GPT-4 (bättre AI)
- Veckorapporter
- Customer segmentation
- Churn prediction
- Follow-up automation
- 5 veckors implementation

---

## ⚡ Snabbstart - Startup-paketet

### Steg 1: Förberedelser (10 min)
```bash
# Klona/öppna projektet
cd Eventgaraget

# Kopiera environment-mall
cp .env.example .env
```

**Fyll i .env med:**
- Supabase URL och keys
- OpenAI API key
- Google Client ID/Secret
- Gmail-adress

### Steg 2: Deploy n8n (15 min)
```bash
# Starta Docker containers
./scripts/deploy.sh

# Vänta på att n8n startar
# Öppna: http://localhost:5678
```

### Steg 3: Setup Supabase (10 min)
1. Gå till [supabase.com](https://supabase.com)
2. Skapa nytt projekt
3. Öppna SQL Editor
4. Kopiera innehållet från `supabase/schema.sql`
5. Kör SQL
6. Verifiera att alla tabeller skapats

### Steg 4: Google Sheets (15 min)
1. Skapa ny Google Sheet: "EventGaraget Knowledge Base"
2. Skapa sheet "FAQ"
3. Importera `google-sheets-templates/FAQ_template.csv`
4. Skapa sheet "PriceList"
5. Importera `google-sheets-templates/PriceList_template.csv`
6. Dela sheet med Gmail-kontot (Editor)
7. Kopiera Sheet ID från URL

### Steg 5: n8n Credentials (20 min)
I n8n UI (http://localhost:5678):

1. **Gmail OAuth2**
   - Credentials → Add Credential
   - Typ: Gmail OAuth2
   - Client ID/Secret från Google Cloud
   - Authorize

2. **OpenAI**
   - Add Credential
   - Typ: OpenAI
   - API Key

3. **Supabase**
   - Add Credential
   - Typ: HTTP Header Auth
   - Header: `apikey` = Supabase anon key
   - Header: `Authorization` = `Bearer service_role_key`

4. **Google Sheets**
   - Add Credential
   - Typ: Google Sheets OAuth2
   - Samma Client ID/Secret som Gmail

### Steg 6: Import Workflow (5 min)
1. n8n → Workflows → Import from File
2. Välj `workflows/main-booking-agent.json`
3. För varje node: Välj rätt credential
4. Save workflow
5. Activate (toggle i top right)

### Steg 7: Deploy Signature App (20 min)
```bash
cd signature-app
npm install

# Skapa .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" >> .env.local

# Deploy till Vercel
vercel deploy --prod
```

### Steg 8: Test! (10 min)
```bash
# Skicka test-email
./scripts/test-workflow.sh booking

# Övervaka i n8n
# Gå till: http://localhost:5678/executions

# Kolla Supabase
# Verify: customers, bookings tabeller
```

**Total tid: ~2 timmar**

---

## 🎓 Snabbstart - Professional-paketet

### Gör allt från Startup PLUS:

### Steg 9: Utökad databas (5 min)
```bash
# I Supabase SQL Editor
# Kopiera och kör: supabase/additional-tables.sql
```

### Steg 10: Import CRM Workflow (5 min)
1. n8n → Import `workflows/crm-analytics-workflow.json`
2. Välj credentials
3. Activate

### Steg 11: Deploy CRM Dashboard (20 min)
```bash
cd crm-dashboard
npm install

# Skapa .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" >> .env.local

# Deploy
vercel deploy --prod
```

### Steg 12: Upgrade till GPT-4 (2 min)
I n8n workflows:
1. Öppna main-booking-agent
2. För varje OpenAI node:
   - Ändra model från `gpt-3.5-turbo` till `gpt-4-turbo-preview`
3. Save & Execute

### Steg 13: Test CRM (10 min)
1. Öppna CRM Dashboard URL
2. Navigera genom:
   - Dashboard
   - Customers
   - Conversations
   - Analytics
3. Verifiera data syns

**Total extra tid: ~40 minuter**

---

## 📋 Checklista - Startup

- [ ] .env konfigurerad med alla keys
- [ ] Docker containers kör (n8n, postgres, redis)
- [ ] Supabase databas uppsatt (schema.sql)
- [ ] Google Sheets skapade och delade
- [ ] n8n credentials konfigurerade (4 st)
- [ ] main-booking-agent workflow importerad & aktiv
- [ ] Signature app deployad till Vercel
- [ ] Test-email skickad och fungerande
- [ ] Backup-script testat (`./scripts/backup.sh`)

---

## 📋 Checklista - Professional

- [ ] Allt från Startup ✅
- [ ] additional-tables.sql körda i Supabase
- [ ] crm-analytics-workflow importerad & aktiv
- [ ] CRM Dashboard deployad
- [ ] GPT-4 aktiverat i alla AI-noder
- [ ] Weekly report konfigurerad (måndagar 08:00)
- [ ] Daily follow-ups aktiva (dagligen 09:00)
- [ ] Slack integration konfigurerad (optional)
- [ ] Team utbildat i CRM (4 timmar)

---

## 🆘 Vanliga problem & lösningar

### Problem: "Gmail trigger fungerar inte"
**Lösning:**
1. Kolla att Gmail API är aktiverat i Google Cloud
2. Verifiera OAuth scopes är godkända
3. Testa credentials: Credentials → Gmail → Test

### Problem: "OpenAI timeout"
**Lösning:**
1. Öka timeout i OpenAI node (Settings → Timeout)
2. Kolla API limits på OpenAI dashboard
3. Verifiera API key är korrekt

### Problem: "Supabase connection error"
**Lösning:**
1. Kolla att service_role key används (inte anon)
2. Verifiera RLS policies tillåter access
3. Test connection: HTTP Request → Supabase → GET /rest/v1/

### Problem: "Workflow kör inte automatiskt"
**Lösning:**
1. Verifiera att workflow är "Active" (grön toggle)
2. Kolla executions för error messages
3. Restart n8n: `docker-compose restart n8n`

### Problem: "Signature app visar 'Booking not found'"
**Lösning:**
1. Kolla att booking existerar i Supabase
2. Verifiera token matchar booking_number
3. Kolla RLS policies i Supabase

---

## 📞 Support

### Under implementation:
- **Email**: info@eventgaraget.se
- **Dokumentation**: Läs SETUP_GUIDE.md
- **Logs**: `docker-compose logs -f n8n`
- **Workflow debug**: n8n UI → Executions

### Efter go-live:

**Startup-paketet:**
- Email support första månaden
- Dokumentation & manualer

**Professional-paketet:**
- 60 dagars support
- Dedikerad Slack-kanal
- Månadsvis optimering (3 månader)
- 4h personalutbildning

---

## 🎯 Nästa steg efter setup

### Vecka 1: Testing
- Testa alla scenarion (booking/support/complex)
- Verifiera email-svar är korrekta
- Kolla att signatures fungerar
- Review AI-svar kvalitet

### Vecka 2: Tuning
- Justera AI prompts efter feedback
- Uppdatera FAQ med nya frågor
- Lägg till fler produkter i price list
- Finjustera email-templates

### Vecka 3: Training
- Utbilda team i systemet
- Dokumentera interna rutiner
- Setup backup-schema
- Go-live plan

### Månad 2+: Optimization
- Review weekly reports
- Analyze customer segments (Professional)
- Optimize AI prompts
- Add new features as needed

---

## 💡 Tips & Best Practices

### För AI-agenten:
- ✅ Håll FAQ uppdaterad
- ✅ Review AI-svar veckovis
- ✅ Logga human takeovers för att förbättra AI
- ✅ Monitor OpenAI token usage

### För Supabase:
- ✅ Backup databas veckovis
- ✅ Monitor storage usage
- ✅ Review RLS policies regularly
- ✅ Use indexes för performance

### För n8n:
- ✅ Export workflows efter ändringar
- ✅ Monitor execution errors dagligen
- ✅ Keep environment variables updated
- ✅ Test before deploying changes

### För CRM (Professional):
- ✅ Review customer segments veckovis
- ✅ Act on churn risk alerts
- ✅ Use analytics för beslut
- ✅ Follow up retention campaigns

---

## ✨ Success Metrics

### Mät efter 1 månad:
- [ ] Antal bokningar hanterade av AI
- [ ] Average response time
- [ ] Customer satisfaction score
- [ ] Time saved (hours)
- [ ] Conversion rate (inquiry → booking)

### Mål:
- 📧 95%+ emails hanterade automatiskt
- ⚡ <2 min response time
- 😊 >4.5/5 customer satisfaction
- ⏰ 120+ timmar sparade/månad
- 📈 >20% ökning i bokningar (24/7 tillgänglighet)

---

**Lycka till med implementationen! 🚀**

*För detaljerad teknisk guide, se SETUP_GUIDE.md*
*För paketjämförelse, se PACKAGES.md*

