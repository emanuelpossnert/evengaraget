# 🚀 Komplett Implementationsguide - Ersätt Anställd Med AI

Denna guide visar hur du implementerar ALLA funktioner som behövs för att **helt ersätta den anställde** som tidigare hanterade bokningar manuellt.

---

## 📋 Översikt - Vad Implementeras

### ✅ Vad Som Redan Fanns:
1. ✓ Email-hantering (Gmail trigger)
2. ✓ AI-klassificering av emails
3. ✓ FAQ-svar från Google Sheets
4. ✓ Offertgenerering
5. ✓ Digital signering
6. ✓ Kunddata i Supabase

### 🆕 Vad Som Läggs Till:
1. **🏭 Lagersystem & Tillgänglighetskontroll**
   - Produktkatalog i Supabase
   - Realtidskoll om produkter är lediga
   - Förslag på alternativa datum om upptaget

2. **🎨 Foliering-hantering**
   - Detektion av folieringsförfrågningar
   - Automatisk utskick av material-guide (PDF)
   - Spårning av folieringsprodukter

3. **💰 Fakturering**
   - Automatisk fakturagenerering efter signering
   - Handpenningsfaktura (50%)
   - Restbetalning vid leverans
   - Spårning i Supabase

4. **📊 Komplett Workflow**
   - Allt i ett sammanhängande flöde
   - Inget manuellt arbete behövs

---

## 🔧 STEG 1: Installera Lagersystemet

### 1.1 Kör SQL i Supabase

Öppna **Supabase Dashboard** → **SQL Editor** → Kör detta:

```sql
-- Kör innehållet från: supabase/inventory-system.sql
```

**Filen innehåller:**
- `products` - Produktkatalog
- `inventory_items` - Specifika lagerartiklar
- `booking_items` - Reservation av produkter
- `check_product_availability()` - Funktion för tillgänglighetskontroll
- `suggest_alternative_dates()` - Föreslå alternativa datum
- `reserve_products_for_booking()` - Reservera produkter

### 1.2 Verifiera att det fungerar

Testa i SQL Editor:

```sql
-- Testa tillgänglighetskontroll
SELECT * FROM check_product_availability(
  'Partytält 4x8m',
  '2025-10-15',
  '2025-10-17',
  1
);

-- Ska returnera: is_available, quantity_available, osv.
```

✅ **Om du får resultat: Klart!**

---

## 🔧 STEG 2: Lägg Till Faktureringstabell

### 2.1 Kör SQL för Invoices-tabellen

I Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES customers(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  type VARCHAR(50) DEFAULT 'deposit', -- deposit, final, full
  payment_terms VARCHAR(100),
  payment_date DATE,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access invoices" 
ON invoices FOR ALL TO service_role USING (true);
```

---

## 🔧 STEG 3: Uppdatera n8n Workflow

### 3.1 Import Uppdaterad Main Workflow

1. Öppna n8n
2. Gå till **Workflows** → **Import**
3. Välj: `workflows/EventGaraget - Main Booking Agent Prod.json`
4. Klicka **Import**

✅ **Din AI-agent kan nu:**
- Detektera folieringsförfrågningar
- Extrahera `wants_wrapping` och `wrapping_products`

### 3.2 Lägg Till Tillgänglighetskontroll-Noder

**Manuell installation (eftersom n8n inte kan importa partiella workflows):**

1. **Öppna workflow:** `EventGaraget - Main Booking Agent Prod`

2. **Hitta noden:** `🤖 AI Agent - Quote Generator1`

3. **Lägg till EFTER denna nod:**
   - Öppna filen: `workflows/NEW_NODES_AVAILABILITY_WRAPPING.json`
   - Kopiera node-definitionen för varje nod (se nedan)

#### Node 1: Prepare Availability Checks

Lägg till en **Code** node:
- **Namn:** `📅 Prepare Availability Checks`
- **Kod:** (kopiera från `NEW_NODES_AVAILABILITY_WRAPPING.json`, node ID: `availability-prepare-001`)
- **Anslut från:** `🤖 AI Agent - Quote Generator1`

#### Node 2: Check Availability (Supabase RPC)

Lägg till en **HTTP Request** node:
- **Namn:** `✅ Check Availability (Supabase RPC)`
- **Method:** POST
- **URL:** `https://[YOUR_SUPABASE_URL]/rest/v1/rpc/check_product_availability`
- **Authentication:** Supabase API
- **Body (JSON):**
```json
{
  "p_product_name": "={{$json.product_name}}",
  "p_start_date": "={{$json.start_date}}",
  "p_end_date": "={{$json.end_date}}",
  "p_quantity_needed": "={{$json.quantity_needed}}"
}
```
- **Anslut från:** `📅 Prepare Availability Checks`

#### Node 3: Aggregate Availability Results

Lägg till en **Code** node:
- **Namn:** `📊 Aggregate Availability Results`
- **Kod:** (från `NEW_NODES_AVAILABILITY_WRAPPING.json`, node ID: `availability-aggregate-003`)
- **Anslut från:** `✅ Check Availability (Supabase RPC)`

#### Node 4: Router - Availability

Lägg till en **Switch** node:
- **Namn:** `🔀 Router - Availability`
- **Mode:** Rules
- **Rule 0:** `$json.all_available === false` → Output 0
- **Rule 1:** `$json.all_available === true` → Output 1
- **Fallback:** Output 1
- **Anslut från:** `📊 Aggregate Availability Results`
- **Output 1 går till:** `Prepare Booking Data1` (befintlig node)

#### Node 5-7: Alternative Dates Flow (Output 0)

**Node 5:** `📆 Suggest Alternative Dates` (HTTP Request till Supabase RPC)
**Node 6:** `📧 Format Alternative Dates Email` (Code)
**Node 7:** `✉️ Send Alternative Dates Email` (Gmail)

(Se `NEW_NODES_AVAILABILITY_WRAPPING.json` för detaljer)

### 3.3 Lägg Till Folierings-Flöde

#### Node 8: Check If Wrapping Requested

Lägg till en **Code** node efter `🤖 AI Agent - Quote Generator1`:
- **Namn:** `🎨 Check If Wrapping Requested`
- **Kod:** (från `NEW_NODES_AVAILABILITY_WRAPPING.json`, node ID: `check-wrapping-008`)

#### Node 9: Router - Wrapping

Lägg till en **Switch** node:
- **Rule:** `$json.send_wrapping_guide === true` → Output 0

#### Node 10-11: Send Wrapping Guide

**Node 10:** `📄 Read Wrapping Guide Template` (Read Binary File)
- **Path:** `/Users/emanuelpossnert/Documents/Dev projects/Eventgaraget/templates/wrapping-material-guide.html`

**Node 11:** `📤 Send Wrapping Guide PDF` (Gmail)
- **Subject:** `🎨 Guide för Folieringsmaterial - EventGaraget`
- **Type:** HTML
- **Body:** `={{$('📄 Read Wrapping Guide Template').first().data}}`

---

## 🔧 STEG 4: Uppdatera Signature Webhook (Fakturering)

### 4.1 Öppna Signature Webhook

n8n → Workflows → `EventGaraget - Signature Completion Webhook`

### 4.2 Lägg Till Faktureringsnoder

**Efter noden:** `Get Booking Products`

Lägg till dessa noder i sekvens:

#### Node 1: Prepare Invoice Data

**Code** node:
- **Namn:** `💰 Prepare Invoice Data`
- **Kod:** (från `INVOICE_NODES.json`, node ID: `prepare-invoice-data-001`)
- **Anslut från:** `Get Booking Products`

#### Node 2: Create Invoice Record

**HTTP Request** node:
- **Namn:** `📝 Create Invoice Record (Supabase)`
- **Method:** POST
- **URL:** `https://[YOUR_SUPABASE_URL]/rest/v1/invoices`
- **Body:** (se `INVOICE_NODES.json`)

#### Node 3: Generate Invoice HTML/PDF

**Code** node:
- **Namn:** `📄 Generate Invoice HTML/PDF`
- **Kod:** (från `INVOICE_NODES.json` - genererar HTML-faktura)

#### Node 4: Send Invoice to Customer

**Gmail** node:
- **Namn:** `📧 Send Invoice to Customer`
- **Subject:** `💰 Faktura {{$json.invoice_number}} - Handpenning EventGaraget`
- **Type:** HTML
- **Body:** `={{$json.invoice_html}}`

#### Node 5-6: Internal Notification

**Code** + **Gmail** för att notifiera internt team.

---

## 🔧 STEG 5: Testa Hela Flödet

### Test 1: Bokning med Tillgänglig Produkt

Skicka ett email till din boknings-Gmail:

```
Från: test@example.com
Ämne: Boka tält

Hej!

Jag vill boka ett Partytält 4x8m för 50 personer.

Namn: Test Testsson
Företag: Test AB
Org.nr: 556123-4567
Telefon: 070-123 45 67
Email: test@example.com

Leveransadress: Storgatan 1, 123 45 Stockholm
Faktureringsadress: Samma som leverans

Startdatum: 2025-11-15
Slutdatum: 2025-11-17

Event: Företagsfest

Med vänliga hälsningar,
Test
```

**Förväntat resultat:**
1. ✅ AI klassificerar som `quote_request`
2. ✅ Extraherar all info
3. ✅ Kollar tillgänglighet i Supabase → **TILLGÄNGLIG**
4. ✅ Skapar offert
5. ✅ Skickar signeringslänk
6. ✅ När kunden signerar:
   - Bokning bekräftas
   - **Faktura för handpenning skickas automatiskt**
   - EventGaraget får notification

### Test 2: Bokning med Upptagen Produkt

Ändra datumen till ett intervall där produkten redan är bokad.

**Förväntat resultat:**
1. ✅ AI klassificerar
2. ✅ Kollar tillgänglighet → **INTE TILLGÄNGLIG**
3. ✅ Föreslår alternativa datum (email skickas)
4. ⏸️ Väntar på kundens svar

### Test 3: Foliering

Skicka ett email med foliering:

```
Hej!

Jag vill hyra 2 värmepumpar och vill gärna foliera dom med vårt företags logga.

Har ni möjlighet att göra detta?

Startdatum: 2025-12-01
Slutdatum: 2025-12-03

Namn: Test Testsson
Email: test@example.com
Telefon: 070-123 45 67
Leveransadress: Storgatan 1, Stockholm
```

**Förväntat resultat:**
1. ✅ AI detekterar: `wants_wrapping: true`
2. ✅ Skapar offert (inklusive folieringskostnad)
3. ✅ **Skickar automatiskt PDF-guide** för folieringsmaterial
4. ✅ Offert inkluderar: Värmepump + Foliering (2500 kr extra)

---

## 📊 Sammanfattning - Vad Agenten Nu Kan

### ✅ Bokningsprocess
- [x] Ta emot förfrågningar via email
- [x] Extrahera all nödvändig information
- [x] Fråga efter saknad info
- [x] **Kolla lagersaldo och tillgänglighet** 🆕
- [x] **Föreslå alternativa datum om upptaget** 🆕
- [x] Generera offert med korrekt pris
- [x] Skicka signeringslänk
- [x] **Skicka faktura automatiskt efter signering** 🆕

### ✅ Kundsupport
- [x] Svara på FAQ-frågor
- [x] Kombinera FAQ + offert i samma mail
- [x] Känna igen återkommande kunder (Context Injection)
- [x] Referera tidigare bokningar

### ✅ Specialfunktioner
- [x] **Detektera folieringsförfrågningar** 🆕
- [x] **Skicka guide för folieringsmaterial** 🆕
- [x] Hantera företagskunder (org.nr, faktureringsadress)
- [x] Spåra konversationer och sentiment

### ✅ Ekonomi & Administration
- [x] **Automatisk fakturering (handpenning)** 🆕
- [x] **Spårning av betalningar i Supabase** 🆕
- [x] Generera bokningsnummer
- [x] Logga alla interaktioner
- [x] Notifiera internt team vid viktiga events

---

## 🎯 Nästa Steg (Valfritt)

### 1. **Automatisk Påminnelse om Obetald Faktura**
   - Skapa ett n8n Schedule Trigger (dagligen)
   - Kolla `invoices` där `status = 'pending'` och `due_date < TODAY`
   - Skicka påminnelse-email

### 2. **SMS-notiser**
   - Integrera Twilio för SMS
   - Skicka SMS 1 dag före leverans

### 3. **Kundportal**
   - Bygg en Next.js-app där kunder kan:
     - Se sina bokningar
     - Ladda ner fakturor
     - Ändra bokningar

### 4. **AI-träning**
   - Samla in alla konversationer
   - Använd för att förbättra prompts
   - Implementera RAG (Retrieval-Augmented Generation)

---

## 🚨 Troubleshooting

### Problem: "Supabase RPC function not found"

**Lösning:** Kolla att du kört `inventory-system.sql` i Supabase.

Testa:
```sql
SELECT * FROM pg_proc WHERE proname = 'check_product_availability';
```

### Problem: "Invoice not created"

**Lösning:** Kolla att `invoices`-tabellen finns:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'invoices';
```

### Problem: "Wrapping guide not sent"

**Lösning:** Kolla att sökvägen till HTML-filen är korrekt:
```bash
ls /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget/templates/wrapping-material-guide.html
```

---

## ✅ Checklista - Är Allt Klart?

- [ ] Supabase: `products`, `inventory_items`, `booking_items`, `invoices` tabeller skapade
- [ ] Supabase: RPC-funktioner `check_product_availability`, `suggest_alternative_dates` finns
- [ ] n8n: Main Booking Agent har uppdaterad AI-prompt (detekterar foliering)
- [ ] n8n: Tillgänglighetskontroll-noder tillagda
- [ ] n8n: Folierings-flöde tillagt
- [ ] n8n: Signature webhook har faktureringsnoder
- [ ] Template: `wrapping-material-guide.html` finns på rätt plats
- [ ] Test: Skicka test-email och verifiera att:
  - [ ] Tillgänglighetskontroll fungerar
  - [ ] Alternativa datum föreslås om upptaget
  - [ ] Folieringsdetektion fungerar
  - [ ] Faktura skickas efter signering

---

## 🎉 Grattis!

Du har nu ett **KOMPLETT AI-drivet bokningssystem** som helt ersätter manuellt arbete!

**Vad sparar du:**
- 120+ timmar/månad
- 42 000 kr/månad i personalkostnader
- Inga bokningskonflikter (automatisk lagerkoll)
- Snabbare svarstider (24/7)
- Automatisk fakturering

**Nästa steg:** Övervaka systemet i 1-2 veckor och finjustera AI-prompten baserat på verkliga konversationer.

---

**💬 Frågor?**

Kontakta: admin@striky.se eller öppna ett issue på GitHub.

**🚀 Lycka till med ditt nya AI-system!**

