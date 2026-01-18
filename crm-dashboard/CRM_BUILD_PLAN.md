# 📊 EventGaraget CRM Portal - Implementeringsplan

## 🎯 Projektöversikt

**Mål:** Bygga en **modernt designad, säker och intuitiv CRM-portal** för att hantera:
- Alla bokningar och offerter
- Kundhantering och profiler
- E-postkommunikation
- Produkter och prislistor
- Fakturering
- Kalendervy för lagret
- Användaråtkomst och roller

**Stack:**
- **Frontend:** Next.js 14 + TypeScript + React + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, REST API, Storage)
- **UI:** Modern, responsive design med EventGaraget-branding
- **Autentisering:** Supabase Auth med rollbaserad åtkomst (RBAC)

---

## 📋 Fas 1: Grundläggande struktur (Vecka 1)

### 1.1 Setup & Konfiguration
- [ ] Initiera Next.js projekt i `crm-dashboard/`
- [ ] Installera beroenden:
  - `@supabase/supabase-js`
  - `@supabase/auth-helpers-nextjs`
  - `tailwindcss`
  - `recharts` (grafer)
  - `lucide-react` (ikoner)
  - `date-fns` (datumhantering)
  - `react-big-calendar` (kalender)
  - `jspdf` och `html2canvas` (PDF-export)
- [ ] Konfigurera Supabase-anslutning
- [ ] Sätta upp miljövariabler (`.env.local`)
- [ ] Skapa Tailwind-konfiguration med EventGaraget-färger

### 1.2 Autentisering & Roller
- [ ] Implementera Supabase Auth login/logout
- [ ] Skapa `user_profiles` tabell med roller:
  - `admin` - Full åtkomst
  - `manager` - Bokningar, kunder, fakturor
  - `warehouse` - Endast kalender och lagerstatus
  - `support` - Kunder och e-post
- [ ] Bygga login-sida med branding
- [ ] Implementera protected routes
- [ ] Skapa middleware för rollkontroll

### 1.3 Layout & Navigation
- [ ] Skapa huvudlayout med:
  - Toppbar (logo, användarinfo, logout)
  - Sidomeny (navigationsmeny baserad på roll)
  - Huvudinnehålls-area
- [ ] Implementera EventGaraget-branding:
  - Logga
  - Färgschema (röd/orange)
  - Typografi
- [ ] Responsive design för mobil/tablet/desktop

---

## 📋 Fas 2: Kundhanterings-modul (Vecka 2)

### 2.1 Kundlista
- [ ] Visa alla kunder i tabell:
  - Namn, email, telefon, företag
  - Skapningsdatum, senaste aktivitet
  - Antal bokningar
  - Status (aktiv, inaktiv)
- [ ] Sökfunktion & filtrering
- [ ] Sortering på kolumner
- [ ] Pagination
- [ ] Export till CSV

### 2.2 Kundkort (Customer Profile)
- [ ] Visa fullständig kundinfo:
  - Personuppgifter (namn, email, tel, org_nummer)
  - Adresser (fakturering & leverans)
  - Företagsinformation
- [ ] Tabs för:
  - **Översikt** - Snabbinformation
  - **Bokningar** - Alla bokningar för kunden
  - **Offerter** - Alla offerter (inkl. PDF-länk)
  - **E-post** - All kommunikation med kunden
  - **Fakturor** - Invoicing history
- [ ] Redigera kunduppgifter
- [ ] E-posthistorik:
  - Visa alla e-postkonversationer från Supabase `messages`-tabell
  - Svara på e-post direkt (integrering med n8n)
  - Markera som läst/oläst

### 2.3 Nykundsformulär
- [ ] Formulär för att skapa ny kund
- [ ] Validering av e-post och telefon
- [ ] Dubblettöversyn

---

## 📋 Fas 3: Bokningshantering (Vecka 2-3)

### 3.1 Bokningstabellvy
- [ ] Visa alla bokningar:
  - Bokningsnummer
  - Kundnamn
  - Datum (event_date)
  - Plats
  - Status (draft, pending, confirmed, completed)
  - Totalt belopp
  - Senaste uppdatering
- [ ] Sökfunktion & filtrering på status
- [ ] Sortering
- [ ] Snabb-åtgärder (knapp för att öppna bokningskort)

### 3.2 Bokningskort
- [ ] Visa fullständig bokningsinformation:
  - Bokningsdetaljer (datum, plats, etc.)
  - Kundinfo
  - Produkter & addons (med priser)
  - Leveransinformation
  - Totalt belopp & skatter
  - Signerad offert (PDF-länk)
  - Betalningsstatus
- [ ] Tabs:
  - **Detaljer** - All booking info
  - **Tidsplan** - Pickup & delivery dates
  - **Produkt lista** - Vad som hyrs
  - **Faktura** - Invoicing detaljer
- [ ] Åtgärder:
  - Ändra status (draft → confirmed → completed)
  - Redigera bokningsdetaljer
  - Skapa/visa faktura
  - Generera och ladda ner offert-PDF
  - Skicka bokningsbekräftelse via e-post

### 3.3 Kalendervy för lagret
- [ ] React Big Calendar integration
- [ ] Visa alla bokningar på kalender:
  - Pickup-datum
  - Delivery-datum
  - Visa produkt-namn på event
- [ ] Klickbar för att se bokningskort
- [ ] Filtrera på produkt/status
- [ ] Skrivara-vy för utskrift

---

## 📋 Fas 4: Produkter & Prislistor (Vecka 3)

### 4.1 Produkthantering
- [ ] Tabell över alla produkter:
  - Namn
  - Kategori
  - Pris/dag
  - Beskrivning
  - Bild
  - Lagerstatus
  - Wrapping options
- [ ] Lägg till ny produkt
- [ ] Redigera produkt
- [ ] Ta bort produkt
- [ ] Bulk-import från CSV

### 4.2 Prislista
- [ ] Visa aktuell prislista
- [ ] Redigera priser
- [ ] Historik över prisändringar
- [ ] Export till PDF/CSV

### 4.3 Tillval & Wrapping
- [ ] Hantera valfria tillägg (addons)
- [ ] Hantera wrapping/branding-options
- [ ] Prissättning

---

## 📋 Fas 5: FAQ & Support (Vecka 3)

### 5.1 FAQ Hantering
- [ ] Tabell över alla FAQ-frågor
- [ ] Lägg till ny FAQ
- [ ] Redigera FAQ
- [ ] Sortera/prioritera
- [ ] Import/export från CSV

---

## 📋 Fas 6: Fakturering (Vecka 4)

### 6.1 Fakturorvy
- [ ] Visa alla fakturor:
  - Fakturanummer
  - Kundnamn
  - Belopp
  - Status (draft, sent, paid, overdue)
  - Datum
- [ ] Sökfunktion & filtrering
- [ ] Generera faktura från bokning
- [ ] Skicka faktura via e-post
- [ ] Markera som betald
- [ ] PDF-export

### 6.2 Invoicing detaljer
- [ ] Skapas från bokningsdetaljer
- [ ] Visa alla line items med priser
- [ ] Beräkna skatter
- [ ] Beräkna deposit (50%)
- [ ] Beräkna restbelopp

---

## 📋 Fas 7: Dashboard & Analytics (Vecka 4)

### 7.1 Dashboard
- [ ] KPI-kort:
  - Totala bokningar denna månad
  - Revenue denna månad
  - Väntande bokningar
  - Överfälliga fakturor
- [ ] Grafer:
  - Bokningar per dag/vecka/månad
  - Revenue trend
  - Mest populära produkter
  - Top customers
- [ ] Senaste aktiviteter feed

---

## 📋 Fas 8: Tillgångshantering (Vecka 5)

### 8.1 Användarhantering (Admin)
- [ ] Tabell över alla användare
- [ ] Lägg till ny användare
- [ ] Redigera användarroller
- [ ] Deaktivera användare
- [ ] Aktivitetslogg

### 8.2 Roller & Behörigheter
- [ ] Admin - Full åtkomst
- [ ] Manager - Bokningar, kunder, fakturor
- [ ] Warehouse - Kalender, lagerstatus
- [ ] Support - Kunder, e-post
- [ ] Implementera RLS-policies

---

## 📋 Fas 9: Inställningar & Konfiguration (Vecka 5)

### 9.1 Inställningar
- [ ] Företagsinformation
- [ ] E-postmallar
- [ ] Aviseringsinställningar
- [ ] Integrationsinställningar (n8n webhooks)

---

## 🎨 Design & Styling Riktlinjer

### Färgschema (EventGaraget)
- **Primär:** `#DC2626` (röd)
- **Accent:** `#F97316` (orange)
- **Neutral:** `#F3F4F6` (ljus grå)
- **Dark:** `#1F2937` (mörk grå)

### Layout
- Responsiv 12-column grid
- Sidomar: 1rem desktop, 0.5rem mobil
- Border-radius: 8px
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`

### Komponenter
- Reusable button styles
- Form components med validering
- Table components med sorting/pagination
- Modal/dialog komponenter
- Toast notifications
- Loading states

---

## 🔒 Säkerhet

### RLS-policies
- [ ] Skapa policies för varje tabell
- [ ] Användare kan endast se sin egen data
- [ ] Admin kan se allt
- [ ] Managers kan se bokningar/kunder
- [ ] Warehouse kan se kalender

### Autentisering
- [ ] JWT via Supabase Auth
- [ ] Secure session handling
- [ ] CSRF-skydd
- [ ] Input validation & sanitization

---

## 📱 Enhetsstöd

- [ ] Desktop (1920px+)
- [ ] Laptop (1280px - 1920px)
- [ ] Tablet (768px - 1280px)
- [ ] Mobil (320px - 768px)

---

## 🚀 Deployment

- [ ] Vercel deployment
- [ ] Environment variables
- [ ] CI/CD pipeline
- [ ] Database backups
- [ ] Monitoring & logging

---

## 📅 Timeline

| Fas | Beskrivning | Tid |
|-----|-------------|-----|
| 1 | Setup & Auth | Vecka 1 |
| 2 | Kundhantering | Vecka 2 |
| 3 | Bokningshantering & Kalender | Vecka 2-3 |
| 4 | Produkter & Prislistor | Vecka 3 |
| 5 | FAQ & Support | Vecka 3 |
| 6 | Fakturering | Vecka 4 |
| 7 | Dashboard | Vecka 4 |
| 8 | Användarhantering | Vecka 5 |
| 9 | Inställningar | Vecka 5 |

**Total tid:** ~5 veckor

---

## ✅ Definition of Done

- [ ] All kod är TypeScript med korrekt typning
- [ ] Alla komponenter är responsive
- [ ] All data valideras
- [ ] RLS-policies är på plats
- [ ] Tester är skrivna
- [ ] Dokumentation är uppdaterad
- [ ] Performance är optimerad
- [ ] Security review är genomförd
- [ ] User testing är slutfört
- [ ] Ready for production

---

**Nästa steg:** Börja med Fas 1 - Setup & Konfiguration! 🚀

