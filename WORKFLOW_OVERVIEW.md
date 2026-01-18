# EventGaraget - Workflow Översikt

## 📧 Main Booking Agent Workflow
**Fil:** `workflows/main-booking-agent.json`

Detta är **huvudworkflowet** som hanterar ALLT:

### 🔄 Komplett Flöde

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. Gmail Trigger (varje minut)               │
│                   Läser nya emails från inbox                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. Extract Email Data                              │
│           Parsar from, subject, body, thread_id                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│     3. 🤖 AI Agent - Email Classifier & Info Check              │
│                                                                 │
│  • Klassificerar email (booking/quote/support/complaint/other)  │
│  • Extraherar kundinfo & bokningsdetaljer                      │
│  • Kollar om ALL nödvändig info finns (has_all_info)           │
│  • Identifierar vad som saknas (missing_info)                  │
│  • Genererar follow-up meddelande om info saknas               │
│                                                                 │
│  Output: JSON med classification, customer_info,               │
│          booking_details, has_all_info, missing_info           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. Parse AI Response                               │
│         Konverterar AI-svar till JSON-objekt                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│     5. Router - Classification & Info Check                     │
│                                                                 │
│  Output 0: Booking/Quote MED saknad info                       │
│  Output 1: Booking/Quote MED all info                          │
│  Output 2: Support question                                     │
│  Output 3: Requires human takeover                             │
│  Output 4: Fallback (other)                                    │
└─────┬───────┬──────────┬──────────┬──────────────────────────────┘
      │       │          │          │
      ▼       ▼          ▼          ▼
   ┌────┐  ┌────┐    ┌────┐    ┌────┐
   │ 0  │  │ 1  │    │ 2  │    │ 3  │
   └─┬──┘  └─┬──┘    └─┬──┘    └─┬──┘
     │       │          │          │
```

---

## 🔀 Output 0: Booking/Quote - SAKNAD INFO

**Trigger:** `classification = booking_request/quote_request` OCH `has_all_info = false`

```
┌─────────────────────────────────────────┐
│   📧 Format Follow-up Email             │
│                                         │
│  • Hämtar missing_info från AI          │
│  • Skapar vänligt email                 │
│  • Listar vad som saknas                │
│  • Be kunden svara med info             │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   ✉️ Send Follow-up Email               │
│   (Gmail node)                          │
└─────────────────────────────────────────┘
```

**Exempel-email:**
```
Hej Anna!

Tack för din bokningsförfrågan! 🎉

För att skapa en exakt offert behöver jag lite mer information:

📝 Vi behöver följande:
• Telefonnummer
• Organisationsnummer
• Fakturaadress

Svara bara på detta mail så återkommer jag direkt! 😊

Vänligen,
EventGaraget (AI-assistent)
```

---

## 🔀 Output 1: Booking/Quote - ALL INFO FINNS

**Trigger:** `classification = booking_request/quote_request` OCH `has_all_info = true`

```
┌─────────────────────────────────────────┐
│   Create/Update Customer                │
│   (Supabase POST)                       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Create Conversation                   │
│   (Supabase - conversations tabell)     │
└─────────────┬───────────────────────────┘
              │
              ├────────────────┐
              │                │
              ▼                ▼
     ┌──────────────┐   ┌──────────────┐
     │ Get Price    │   │ Log Message  │
     │ List         │   │ (Supabase)   │
     │ (G Sheets)   │   └──────────────┘
     └──────┬───────┘
            │
            ▼
     ┌──────────────────────────┐
     │ 🤖 AI Agent - Quote      │
     │    Generator             │
     │                          │
     │ • Matchar produkter      │
     │ • Beräknar priser        │
     │ • Lägger till setup fee  │
     │ • Genererar offerttext   │
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Prepare Booking Data     │
     │ • Skapar booking_number  │
     │ • Formaterar för DB      │
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Create Booking           │
     │ (Supabase - bookings)    │
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Prepare Products         │
     │ (Formaterar produkter)   │
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Insert Products          │
     │ (booking_products tabell)│
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Format Booking Email     │
     │ • Skapar HTML-offert     │
     │ • Produkttabell          │
     │ • Signeringslänk         │
     │ • Villkor                │
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Send Booking Email       │
     │ (Gmail)                  │
     └──────────────────────────┘
```

**Email innehåller:**
- Snygg HTML-offert
- Produkttabell med priser
- Total summa + handpenning
- **Signeringslänk:** `https://sign.eventgaraget.se/sign/BK-2024-123456`
- Villkor

---

## 🔀 Output 2: Support Question

**Trigger:** `classification = support_question`

```
┌─────────────────────────────────────────┐
│   Create/Update Customer                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Create Conversation                   │
└─────────────┬───────────────────────────┘
              │
              ├────────────────┐
              │                │
              ▼                ▼
     ┌──────────────┐   ┌──────────────┐
     │ Get FAQ Data │   │ Log Message  │
     │ (G Sheets)   │   └──────────────┘
     └──────┬───────┘
            │
            ▼
     ┌──────────────────────────┐
     │ 🤖 AI Agent - Support    │
     │    Response              │
     │                          │
     │ • Söker i FAQ            │
     │ • Genererar svar         │
     │ • Vänligt & proffsigt    │
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Format Support Email     │
     └──────┬───────────────────┘
            │
            ▼
     ┌──────────────────────────┐
     │ Send Support Email       │
     │ (Gmail)                  │
     └──────────────────────────┘
```

---

## 🔀 Output 3: Requires Human Takeover

**Trigger:** `requires_human = true` ELLER komplexa ärenden

```
┌─────────────────────────────────────────┐
│   Create/Update Customer                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Format Slack Alert                    │
│   • Visar anledning                     │
│   • Kundinfo                            │
│   • Sentiment & confidence              │
│   • Länk till Gmail                     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Send Slack Alert                      │
│   → #support-team kanal                 │
└─────────────────────────────────────────┘
```

**Slack-meddelande:**
```
🚨 Human Takeover Required

Reason: Complex contract negotiation
From: Anna Svensson (anna@example.com)
Subject: Custom booking - 500 guests
Classification: booking_request
Confidence: 0.65
Sentiment: 0.9

Summary: Customer wants custom package for large event...

[View in Gmail] → direktlänk
```

---

## 📊 CRM Analytics Workflow
**Fil:** `workflows/crm-analytics-workflow.json`

Detta är ett **separat workflow** för Professional-paketet:

### Schemalagda jobb:

#### 1. **Weekly Analytics Report** (Måndagar 08:00)
```
Trigger (Schedule) 
  → Fetch Weekly Data (Supabase RPC: get_weekly_analytics)
  → AI Generate Insights (GPT-4)
  → Send Email Report (Gmail)
  → Post to Slack
```

#### 2. **Churn Risk Calculation** (Dagligen 02:00)
```
Trigger (Schedule)
  → Fetch All Active Customers (Supabase)
  → Calculate Churn Factors (Supabase RPC)
  → Update Customer Profiles
  → Flag High-Risk Customers
```

#### 3. **Automated Retention Emails** (Dagligen 09:00)
```
Trigger (Schedule)
  → Get At-Risk Customers (Supabase)
  → For each customer:
      → AI Generate Personalized Email
      → Send Email
      → Log Outreach
```

#### 4. **Daily Follow-ups** (Dagligen 09:00)
```
Trigger (Schedule)
  → Get Pending Follow-ups (Supabase)
  → For each follow-up:
      → Check Status
      → Send Reminder if needed
      → Update Status
```

---

## 🎯 Sammanfattning

### Main Booking Agent hanterar:
✅ **All inkommande email**  
✅ **Automatisk klassificering**  
✅ **Koll på saknad info** → Follow-up email  
✅ **Komplett info** → Offert + Signeringslänk  
✅ **Support-frågor** → FAQ-svar  
✅ **Komplexa ärenden** → Slack-alert till team  

### CRM Analytics hanterar:
✅ **Veckorapporter** med AI-insights  
✅ **Churn-prediction**  
✅ **Automatiska retention-kampanjer**  
✅ **Follow-up påminnelser**  

---

## 🔑 Viktiga Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key

# Google Sheets
GOOGLE_SHEETS_FAQ_ID=your-sheet-id
GOOGLE_SHEETS_PRICE_LIST_ID=your-sheet-id

# Company Info
COMPANY_EMAIL=info@eventgaraget.se
COMPANY_PHONE=08-123 456 78
SMTP_FROM_EMAIL=bokningar@eventgaraget.se

# Slack (optional)
SLACK_SUPPORT_CHANNEL=#support-team
```

---

## 📝 Nästa Steg

1. **Importera workflows i n8n**
2. **Konfigurera alla credentials** (Gmail, OpenAI, Supabase, Google Sheets, Slack)
3. **Fyll i environment variables**
4. **Aktivera workflows**
5. **Testa med exempel-email**

Se `QUICK_START.md` för detaljerad setup-guide!

