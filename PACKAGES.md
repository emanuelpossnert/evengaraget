# EventGaraget - Paket & Priser

Detta dokument beskriver de två paketen som erbjuds och hur implementationen mappar till varje paket.

## 🚀 STARTUP-PAKETET

**Pris**: 65,000 SEK (exkl. moms)  
**Leveranstid**: 3 veckor  
**Driftskostnad**: 890 SEK/månad

### Vad som ingår

#### 🤖 AI Bokningsagent
✅ **Implementerat i**: `workflows/main-booking-agent.json`
- Gmail trigger (varje minut)
- AI-klassificering med GPT-3.5-turbo
- Automatisk routing (booking/support/quote)
- FAQ-baserade svar från Google Sheets
- Smart följdfrågehantering
- 24/7 automatisk hantering

#### ✍️ Digital Signeringstjänst  
✅ **Implementerat i**: `signature-app/`
- Next.js app på sign.eventgaraget.se
- Touch-kompatibel signering (mobil & desktop)
- Automatisk PDF-generering
- Magic link (inget lösenord behövs)
- SHA-256 dokumenthashing
- Tidsstämplingoch IP-loggning
- Säker lagring i Supabase Storage

#### 📊 Google Sheets Integration
✅ **Implementerat i**: Workflow + templates
- FAQ sheet för kunskapsbas
- Price list för automatiska offerter  
- Enkel ärendeöversikt (kan exportera från Supabase)

#### 📚 Support & Utbildning
✅ **Dokumentation skapad**:
- README.md - Systemöversikt
- SETUP_GUIDE.md - Steg-för-steg installation
- Workflow-dokumentation
- Google Sheets templates

### Integrationer

- ✅ Gmail (OAuth2)
- ✅ Google Sheets (OAuth2)
- ✅ OpenAI GPT-3.5-turbo
- ✅ Supabase (databas + storage)
- ✅ Vercel (hosting för signature-app)
- ✅ Resend/SMTP (email)

### Månadskostnader (drift)

| Tjänst | Kostnad |
|--------|---------|
| n8n Cloud | 250 SEK |
| OpenAI GPT-3.5 | 200 SEK |
| Supabase | 190 SEK |
| Vercel | 200 SEK |
| Resend (email) | 50 SEK |
| **TOTALT** | **890 SEK/mån** |

---

## 💎 PROFESSIONAL-PAKETET MED CRM

**Pris**: 125,000 SEK (exkl. moms)  
**Leveranstid**: 5 veckor  
**Driftskostnad**: 1,490 SEK/månad

### Allt från Startup PLUS:

#### 🎯 Komplett CRM-system
✅ **Implementerat i**: `crm-dashboard/` + Supabase
- **Dashboard** - Översikt av alla kunder
- **Kundprofiler** med fullständig historik
- **Chatthistorik** - Alla AI-konversationer
- **Bokningshistorik** per kund
- **Ekonomisk översikt** (CLV, total spenderat)
- **Anteckningar & taggar**
- **Avancerad sökning** och filtrering
- **Export-funktion** för kunddata

#### 💬 AI-Chat Interface  
✅ **Implementerat i**: `crm-dashboard/conversations`
- Realtidsvy av pågående konversationer
- Möjlighet att ta över från AI
- **Sentimentanalys** per konversation
- Flaggning av problematiska ärenden
- Historik för AI-träning

#### 📈 Analytics & Rapportering
✅ **Implementerat i**: `workflows/crm-analytics-workflow.json`
- Bokningsstatistik (vecka/månad/år)
- Konverteringsanalys (förfrågan → bokning)
- Populära produkter
- Kundbeteendeanalys
- AI-prestanda (svarstid, lösta ärenden)
- **Automatiska veckorapporter** (måndag 08:00)

#### 🧠 Förbättrad AI-agent
✅ **Upgrade till GPT-4**:
- Bättre förståelse av komplexa förfrågningar
- Personaliserade svar baserat på kundhistorik
- Proaktiva merförsäljningsförslag
- Multi-språk (svenska & engelska)

#### 🎓 Utökad Support
- 60 dagars support efter lansering
- 4 timmars personalutbildning
- Månadsvis optimering första kvartalet
- Dedikerad Slack-kanal

### Månadskostnader (drift)

| Tjänst | Kostnad |
|--------|---------|
| n8n Cloud Pro | 450 SEK |
| OpenAI GPT-4 | 500 SEK |
| Supabase Pro | 290 SEK |
| Vercel Pro | 200 SEK |
| Resend | 50 SEK |
| **TOTALT** | **1,490 SEK/mån** |

---

## 📂 Filstruktur per paket

### Startup-paketet använder:

```
Eventgaraget/
├── workflows/
│   └── main-booking-agent.json          ← AI bokningsagent
├── signature-app/                       ← Digital signering
│   ├── app/sign/[token]/page.tsx
│   └── package.json
├── supabase/
│   └── schema.sql                       ← Databas (customers, bookings)
├── google-sheets-templates/
│   ├── FAQ_template.csv
│   └── PriceList_template.csv
└── docker-compose.yml                   ← n8n deployment
```

### Professional-paketet använder ALLT ovan PLUS:

```
├── workflows/
│   └── crm-analytics-workflow.json      ← Analytics & rapporter
├── crm-dashboard/                       ← CRM UI (frontend)
│   ├── app/dashboard/page.tsx          ← Huvudvy
│   ├── app/customers/page.tsx          ← Kundlista
│   ├── app/customers/[id]/page.tsx     ← Kundprofil
│   ├── app/conversations/page.tsx      ← Chatthistorik
│   ├── app/analytics/page.tsx          ← Rapporter
│   └── package.json
└── supabase/schema.sql                  ← Utökat med CRM-tabeller
```

---

## 🎯 ROI-kalkyl

### Startup-paketet

**Investering**: 65,000 SEK  
**Månadsbesparing**: 42,000 SEK (120h × 350 SEK/h)  
**ROI**: **7 veckor** (65,000 / (42,000 × 12 / 52))

**Första året**:
- Investering: 65,000 SEK
- Drift: 10,680 SEK (890 × 12)
- Total kostnad: 75,680 SEK
- Besparing: 504,000 SEK
- **Nettobesparing: 428,320 SEK**

### Professional med CRM

**Investering**: 125,000 SEK  
**Månadsbesparing**: 42,000 SEK + merförsäljning ~15,000 SEK = 57,000 SEK  
**ROI**: **9 veckor** (125,000 / (57,000 × 12 / 52))

**Första året**:
- Investering: 125,000 SEK
- Drift: 17,880 SEK (1,490 × 12)
- Total kostnad: 142,880 SEK
- Besparing: 684,000 SEK (inkl. merförsäljning)
- **Nettobesparing: 541,120 SEK**

---

## 🔄 Implementation Timeline

### Startup-paketet (3 veckor)

**Vecka 1**: Uppsättning & Analys
- [x] Kravspecifikation
- [x] Supabase-projekt skapas
- [x] n8n workflows utvecklas
- [x] AI-prompts tränas

**Vecka 2**: Utveckling
- [x] Bokningsagent implementation
- [x] Signeringstjänst utvecklas
- [x] Google Sheets-integration

**Vecka 3**: Test & Lansering
- [ ] Systemtestning
- [ ] Användarutbildning
- [ ] Produktionssättning
- [ ] Go-live!

### Professional med CRM (5 veckor)

**Vecka 1-2**: Grund + CRM
- [x] Allt från Startup-paketet
- [x] CRM-databas design
- [x] Dashboard grundstruktur

**Vecka 3**: CRM-funktioner
- [x] Kundprofiler
- [x] Chatthistorik
- [x] Analytics

**Vecka 4**: AI & Analytics
- [x] GPT-4 upgrade
- [x] Automatiska rapporter
- [x] Kundsegmentering

**Vecka 5**: Polish & Lansering
- [ ] Användartester
- [ ] Optimering
- [ ] Utbildning (4h)
- [ ] Go-live!

---

## 📞 Nästa Steg

### 1. Val av Paket

**Startup** passar för:
- Mindre företag med 50-200 bokningar/mån
- Focus på automation av grundprocesser
- Budget-medvetna
- Vill testa AI-lösning först

**Professional** passar för:
- Etablerade företag med >200 bokningar/mån
- Behov av full kundöversikt
- Data-driven beslutsfattning
- Vill maximera kundvärde

### 2. Uppstartsmöte (2 timmar)

Vi går igenom:
- Nuvarande bokningsprocess
- Integration med befintliga system
- Anpassningar och specialbehov
- Tidsplan och milstolpar

### 3. Avtalstecknande

- Signering av avtal
- 50% betalning vid projektstart
- 50% betalning vid go-live
- All källkod överlämnas

### 4. Kickoff (inom 3 dagar)

- Teknisk genomgång
- Access till system
- Projektplan fastställs
- Utveckling startar

---

## ✅ Checklista för Go-Live

### Startup-paketet

- [ ] n8n workflows importerade och aktiva
- [ ] Gmail-integration konfigurerad
- [ ] Google Sheets med FAQ och prislista
- [ ] Supabase databas uppsatt
- [ ] Signature-app deployad till Vercel
- [ ] Test-bokningar genomförda
- [ ] Team utbildat i systemet
- [ ] Backup-rutin etablerad

### Professional-paketet (+ allt ovan)

- [ ] CRM dashboard deployat
- [ ] Analytics-workflow aktivt
- [ ] Veckorapporter konfigurerade
- [ ] Slack-integration för alerts
- [ ] GPT-4 API konfigurerad
- [ ] Team utbildat i CRM (4h)
- [ ] Första månadens optimering schemalagd

---

**Kontakt för frågor**:  
📧 info@eventgaraget.se  
📞 08-123 456 78

**Support under implementation**:  
Slack-kanal: #eventgaraget-implementation

