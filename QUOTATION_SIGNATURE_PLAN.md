# 📋 Quotation & Signature System - Detailed Plan

## 🎯 Overview
Den här planen beskriver hela processen från booking till signerad offert i PDF-format.

---

## 🔄 Architecture Decision: Separate Workflows

### ❓ Ska vi använda ett eller två workflows?
**SVAR: TVÅ SEPARATA WORKFLOWS** ✅

**Varför:**
1. **Klarare separation** - Booking-klassificering vs offertgenerering
2. **Enklare debugging** - Två småare workflows istället för ett stort
3. **Unependent scaling** - Kan köra dem parallellt
4. **Bättre error handling** - Om quotation-flowen felar, påverkas inte booking-flowen
5. **Webhook-trigger** - Quotation-flowen triggas från booking-insertion i Supabase

**Workflow 1:** `01-email-classification-FINAL.json` ← Spara booking
**Workflow 2:** `02-quotation-generation.json` (NY) ← Generera offert + skicka email

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────┐
│ 1️⃣  Email Classification Workflow   │
│     (01-email-classification)       │
├─────────────────────────────────────┤
│ • Motta email från kund             │
│ • Klassificera booking              │
│ • SPARA BOOKING → Supabase          │
└──────────────┬──────────────────────┘
               │
               ↓ (Webhook trigger)
┌──────────────────────────────────────┐
│ 2️⃣  Quotation Generation Workflow   │
│     (02-quotation-generation) - NY   │
├──────────────────────────────────────┤
│ • Motta booking från Supabase webhook│
│ • Generera signing token            │
│ • Skapa quotation URL               │
│ • Skicka email med länk             │
│ • Uppdatera booking status          │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│ 3️⃣  Signature App (Next.js)         │
│     /quotation/[token]              │
├──────────────────────────────────────┤
│ • Visa offert med produkter + addons │
│ • Kund fyller in resterande info    │
│ • Kund signerar digitalt            │
│ • Spara signature → Supabase        │
│ • Generera PDF                      │
│ • Skicka signerad PDF till kund     │
└──────────────────────────────────────┘
```

---

## 📝 Database Changes Needed

### 1. New Table: `addons`
```sql
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Exempel data:**
- Grillstation → Grillkol (350 SEK)
- Grillstation → Grilltændstikker (50 SEK)
- Partytält → Värmefläkt (250 SEK)

### 2. Update Table: `quotations`
```sql
ALTER TABLE quotations ADD COLUMN signing_token VARCHAR(255) UNIQUE;
ALTER TABLE quotations ADD COLUMN signature_url TEXT;
ALTER TABLE quotations ADD COLUMN customer_signature BYTEA; -- För digital signatur
ALTER TABLE quotations ADD COLUMN signed_at TIMESTAMP;
ALTER TABLE quotations ADD COLUMN pdf_url TEXT;
```

### 3. New Table: `quotation_addons`
```sql
CREATE TABLE quotation_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INT DEFAULT 1,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Workflow 2: `02-quotation-generation.json` - Nodes

### Trigger: Webhook (Supabase Insert)
```
Event: booking.INSERT
Payload: booking_id, customer_id, products_requested, etc.
```

### Nodes:

1. **Webhook Trigger** - Motta booking från Supabase
   - Input: `booking_id`

2. **Fetch Booking Details** - Hämta booking + customer från Supabase
   - Query: `bookings + customers JOIN`

3. **Fetch Products & Addons** - Hämta produkter och tillgängliga addons
   - Query: `products LEFT JOIN addons`

4. **Generate Signing Token** - Skapa unik token för offert
   - Code node: UUID v4
   - Spara token i `quotations` table

5. **Create Quotation URL** - Skapa länk till signature-app
   - Format: `https://eventgaraget.se/quotation/[token]`

6. **Generate Quotation HTML** - Bygg offert-HTML
   - Produkter + priser
   - Addons tillgängliga
   - Villkor (minimerad)

7. **Send Email with Link** - Skicka till kund
   - Subject: "Din offert är klar - klicka här för att signera"
   - Body: Quotation URL + kort info

8. **Update Booking Status** - Sätt status → `quotation_sent`
   - Update: `bookings.booking_status = 'quotation_sent'`

---

## 🎨 Frontend: Signature App Pages

### Page 1: `/quotation/[token]`
```
┌────────────────────────────────────┐
│ EVENTGARAGET OFFERT                │
├────────────────────────────────────┤
│                                    │
│ 📦 PRODUKTER:                      │
│ • Grillstation (2x) - 5000 SEK    │
│                                    │
│ ➕ ADDONS (VALFRITT):              │
│ □ Grillkol - 350 SEK              │
│ □ Värmefläkt - 250 SEK            │
│                                    │
│ 📋 KUND INFO:                      │
│ [Namn] [Phone] [Company]          │
│ [Adress] [Leveransdatum]          │
│                                    │
│ ⚠️ VILLKOR (minimerad):            │
│ [Click to expand...]              │
│                                    │
│ ✍️ SIGNERA:                         │
│ [Canvas för signatur]             │
│ [Clear] [Sign]                    │
│                                    │
│ [✓ Acceptera] [Skicka offert]     │
└────────────────────────────────────┘
```

---

## 📋 Checklist - Nästa Steg

### Fas 1: Database Setup ✅
- [ ] Skapa `addons` table
- [ ] Uppdatera `quotations` table
- [ ] Skapa `quotation_addons` table
- [ ] Lägg in exempel-addons

### Fas 2: n8n Workflow ✅
- [ ] Skapa `02-quotation-generation.json`
- [ ] Webhook trigger
- [ ] Fetch nodes
- [ ] Token generation
- [ ] Email send
- [ ] Booking status update

### Fas 3: Frontend - Signature App ✅
- [ ] Skapa `/quotation/[token]` page
- [ ] Fetch quotation data från Supabase
- [ ] Visa produkter + addons
- [ ] Form för kund-info
- [ ] Signatur-canvas
- [ ] PDF generation
- [ ] Email send (signerad PDF)

---

## 🚀 Start Order

1. **FÖRST:** Database setup (SQL)
2. **SEDAN:** n8n Workflow 2
3. **SIST:** Frontend - Signature App

**Tid för varje fas:**
- DB: ~15 min
- n8n: ~30 min
- Frontend: ~2-3 timmar

---

## 📞 Questions/Decisions

- [ ] Vilka addons ska finnas för vilka produkter?
- [ ] Hur ska villkoren se ut?
- [ ] Signatur-metod: Canvas eller altra (t.ex. DocuSign)?
- [ ] PDF-format: Helt från kod eller mall?

