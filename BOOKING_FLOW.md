# EventGaraget - Komplett Bokningsflöde

## 🔄 Steg-för-steg Process

### 1️⃣ **Kund fyller i formulär på hemsidan**

**Formuläret innehåller:**
- Namn
- Email
- Leveransadress
- Startdatum
- Slutdatum

**Formuläret skickar:** Email till bokningar@eventgaraget.se

---

### 2️⃣ **AI läser email och analyserar**

**AI kontrollerar vad som saknas:**

✅ **Nödvändig information:**
- [x] Kundnamn
- [x] Email
- [ ] **Telefon** ⚠️ Saknas ofta
- [ ] **Företagsnamn** (om företag) ⚠️
- [ ] **Organisationsnummer** (om företag) ⚠️
- [x] Leveransadress
- [ ] **Fakturaadress** (om annan än leverans) ⚠️
- [x] Startdatum
- [x] Slutdatum
- [ ] **Produkter** ⚠️ Kan vara vaga
- [ ] **Antal gäster** ⚠️
- [ ] **Typ av event** ⚠️

**AI skapar JSON:**
```json
{
  "has_all_info": false,
  "missing_info": ["phone", "org_number", "products", "guest_count"],
  "follow_up_message": "Hej! För att skapa en exakt offert behöver jag..."
}
```

---

### 3️⃣ **AI skickar follow-up email**

**Om information saknas:**

```
Från: EventGaraget AI <bokningar@eventgaraget.se>
Till: kund@example.com
Ämne: Re: Din bokningsförfrågan - Vi behöver lite mer info

Hej Anna!

Tack för din bokningsförfrågan! 🎉

För att skapa en exakt offert behöver jag lite mer information:

📝 Vi behöver följande:
• Telefonnummer (för att kunna nå dig inför leverans)
• Vilka produkter ni önskar hyra (t.ex. partytält, bord, stolar)
• Antal gäster (ungefär)
• Typ av event (fest, bröllop, företagsevent?)

Om ni är ett företag:
• Företagsnamn
• Organisationsnummer
• Fakturaadress (om annan än leveransadress)

Svara bara på detta mail med informationen så återkommer 
jag direkt med en offert! 😊

Vänliga hälsningar,
EventGaraget (AI-assistent)
```

---

### 4️⃣ **Kund svarar med komplettering**

**Kunden svarar:**
```
Hej!

Här kommer informationen:
- Telefon: 070-123 45 67
- Vi behöver: Partytält 6x12m, 10 bord, 50 stolar
- Ca 50 gäster
- Födelsedagsfest

Vi är ett företag:
- Företag: EventAB
- Org.nr: 556677-8899
- Fakturaadress: Box 123, 111 22 Stockholm

MVH Anna
```

**AI läser svaret → Uppdaterar informationen → Kontrollerar igen**

```json
{
  "has_all_info": true,
  "customer_info": {
    "name": "Anna",
    "email": "anna@example.com",
    "phone": "070-123 45 67",
    "company_name": "EventAB",
    "org_number": "556677-8899"
  },
  "booking_details": {
    "delivery_address": "Storgatan 1, Stockholm",
    "invoice_address": "Box 123, 111 22 Stockholm",
    "start_date": "2024-06-15",
    "end_date": "2024-06-16",
    "products_requested": ["Partytält 6x12m", "bord", "stolar"],
    "guest_count": 50,
    "event_type": "födelsedagsfest"
  }
}
```

---

### 5️⃣ **AI skapar offert**

**AI genererar offert baserat på prislista:**

```json
{
  "products": [
    {
      "name": "Partytält 6x12m",
      "quantity": 1,
      "price_per_unit": 4500,
      "days": 2,
      "total": 9000
    },
    {
      "name": "Festbord 180x80cm",
      "quantity": 10,
      "price_per_unit": 180,
      "days": 2,
      "total": 3600
    },
    {
      "name": "Stol vit plast",
      "quantity": 50,
      "price_per_unit": 35,
      "days": 2,
      "total": 3500
    }
  ],
  "subtotal": 16100,
  "setup_fee": 1000,
  "total": 17100,
  "deposit_amount": 8550
}
```

**Bokning skapas i Supabase:**
- Bokningsnummer genereras: `BK-2024-123456`
- Status: `pending` (väntar på signering)
- `contract_signed`: `false`

---

### 6️⃣ **AI skickar email med signeringslänk**

**Email till kunden:**

```
Från: EventGaraget <bokningar@eventgaraget.se>
Till: anna@example.com
Ämne: Offert BK-2024-123456 - EventGaraget

[Snygg HTML-email med:]

🎉 Din offert är klar!

Hej Anna!

Tack för din förfrågan! Vi har sammanställt en offert 
baserat på dina önskemål.

📋 Offertdetaljer
Bokningsnummer: BK-2024-123456
Leverans: 15 juni 2024
Upphämtning: 16 juni 2024

[Tabell med produkter och priser]

TOTALT: 17,100 kr
Handpenning (50%): 8,550 kr

✍️ Signera din offert
[Stor blå knapp: "📝 Granska & Signera Offert"]
→ Länk: https://sign.eventgaraget.se/sign/BK-2024-123456

Villkor:
• Offerten är giltig i 14 dagar
• 50% handpenning vid signering
• Restbetalning vid leverans
• Kostnadsfri avbokning fram till 48h före leverans
```

---

### 7️⃣ **Kund öppnar signeringslänken**

**URL:** `https://sign.eventgaraget.se/sign/BK-2024-123456`

**Sidan visar:**
1. Komplett offert med alla detaljer
2. Produktlista i tabell
3. Totalbelopp
4. Villkor
5. Checkbox: "Jag godkänner villkoren"
6. Signaturruta (touch-kompatibel)
7. Knapp: "Signera & Bekräfta"

---

### 8️⃣ **Kund signerar avtalet**

**När kunden signerar:**

1. **PDF genereras** med:
   - Alla offertdetaljer
   - Kundens signatur
   - Tidsstämpel
   - SHA-256 hash av dokumentet

2. **Sparas i Supabase Storage:**
   - Path: `contracts/BK-2024-123456_[timestamp].pdf`

3. **Databas uppdateras:**
   ```sql
   UPDATE bookings 
   SET status = 'confirmed',
       contract_signed = true,
       contract_signed_at = NOW()
   WHERE booking_number = 'BK-2024-123456'
   ```

4. **Signature log skapas:**
   ```json
   {
     "booking_id": "uuid",
     "signature_data": "base64...",
     "document_hash": "sha256...",
     "ip_address": "123.456.789.0",
     "signed_at": "2024-06-01T10:30:00Z"
   }
   ```

---

### 9️⃣ **Bekräftelse skickas till BÅDA**

#### **Email till KUNDEN:**

```
Från: EventGaraget <bokningar@eventgaraget.se>
Till: anna@example.com
Ämne: ✅ Bokning bekräftad - BK-2024-123456

Hej Anna!

Tack för att du valde EventGaraget! 🎉

Din bokning är nu bekräftad.

📄 Ditt signerade avtal finns bifogat som PDF.

Bokningsnummer: BK-2024-123456
Leverans: 15 juni 2024 kl 09:00
Adress: Storgatan 1, Stockholm

💰 Betalning
Handpenning (50%): 8,550 kr
Faktura skickas inom 24 timmar till: Box 123, 111 22 Stockholm

🚚 Nästa steg
• Vi skickar faktura för handpenningen
• 1-2 dagar före leverans ringer vi för att bekräfta tid
• Vid leverans monterar vi allt på plats
• Restbetalning (8,550 kr) vid leverans

Frågor? Ring oss på 08-123 456 78

Vänliga hälsningar,
EventGaraget Team

[Bifogad: BK-2024-123456_signed.pdf]
```

#### **Email till EVENTGARAGET:**

```
Från: System <system@eventgaraget.se>
Till: bokningar@eventgaraget.se
Ämne: ✅ NY SIGNERAD BOKNING - BK-2024-123456

🎉 Ny bokning signerad!

Bokningsnummer: BK-2024-123456
Kund: Anna (EventAB)
Email: anna@example.com
Telefon: 070-123 45 67

📅 Datum:
Leverans: 15 juni 2024
Upphämtning: 16 juni 2024

📦 Produkter:
• Partytält 6x12m x1
• Festbord 180x80cm x10
• Stol vit plast x50
• Montering & Setup

💰 Belopp:
Total: 17,100 kr
Handpenning: 8,550 kr (skicka faktura!)
Restbetalning: 8,550 kr (vid leverans)

📍 Adresser:
Leverans: Storgatan 1, Stockholm
Faktura: Box 123, 111 22 Stockholm
Org.nr: 556677-8899

📄 Signerat avtal bifogat.

[Bifogad: BK-2024-123456_signed.pdf]
```

---

### 🔟 **Success-sida visas**

**Kunden redirectas till:**
`https://sign.eventgaraget.se/sign/BK-2024-123456/success`

**Sidan visar:**
- ✅ "Avtalet är signerat!"
- Vad händer nu?
  - Email-bekräftelse
  - Faktura inom 24h
  - Kontakt 1-2 dagar före leverans
- Bokningsnummer
- Länk tillbaka till eventgaraget.se

---

## 📊 Sammanfattning av systemet

### Workflows:

1. **Main Booking Agent** (`main-booking-agent.json`) - ⭐ HUVUDFLÖDE
   - Gmail trigger (varje minut)
   - AI klassificering & info-koll (GPT-4)
   - Router som hanterar:
     - **Saknad info** → Follow-up email
     - **All info** → Skapa offert → Skicka signeringslänk
     - **Support** → FAQ-svar
     - **Komplexa ärenden** → Slack-alert
   
2. **CRM Analytics Workflow** (`crm-analytics-workflow.json`) - Professional-paketet
   - Veckorapporter (måndagar)
   - Churn-prediction (dagligen)
   - Retention-emails (dagligen)
   - Follow-up påminnelser

3. **Signature Completion** (webhook i signature-app)
   - När kund signerar → PDF genereras
   - Sparas i Supabase Storage
   - Email till kund med PDF
   - Email till EventGaraget med PDF

### Databas-tabeller:

- ✅ `customers`
- ✅ `bookings` (med `contract_signed`, `contract_signed_at`)
- ✅ `booking_products`
- ✅ `conversations`
- ✅ `messages`
- ✅ `signature_logs` (juridisk spårbarhet)
- ✅ `documents` (PDF-arkiv)
- ✅ `follow_ups` (automatiska påminnelser)

### Apps:

1. **Signature App** (Next.js)
   - `/sign/[token]` - Signeringssida
   - `/sign/[token]/success` - Bekräftelse

---

## 🎯 Nyckelfunktioner

✅ **AI samlar in saknad information automatiskt**  
✅ **Ingen manuell hantering förrän allt är klart**  
✅ **PDF genereras automatiskt vid signering**  
✅ **Både kund OCH EventGaraget får kopia**  
✅ **Juridisk spårbarhet (SHA-256, tidsstämpling, IP)**  
✅ **Automatiska påminnelser om kunden inte signerar**  

---

**Denna process sparar 95%+ av manuell hantering!** 🚀

