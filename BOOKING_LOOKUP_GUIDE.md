# 📋 Booking Lookup System - Agent Support

## Problem
Kunder frågar om sina bokningar:
- "När är min leverans?"
- "Kan ni skicka fakturan?"
- "Vad kostar min bokning?"
- "Kan jag ändra datumet?"
- osv.

**Lösning:** AI-agenten ska kunna:
1. Detektera booking-relaterade frågor
2. Fråga efter bokningsnummer om saknas
3. Slå upp bokningsdetaljer i Supabase
4. Svara med specifik information

---

## 🔧 Implementation

### STEG 1: Uppdatera AI System Prompt

I `aiResponse1` noden, lägg till denna instruktion:

```javascript
🔍 BOOKING LOOKUP SCENARIO:
Om kunden frågar om:
- "När är min leverans?"
- "Kan ni skicka fakturan?"
- "Vad kostar min bokning?"
- "Kan jag ändra..."
- "Status på bokning"
- "Detaljer om event"
- etc.

DÅ:
1. Detektera att det är en BOOKING-FRÅGA
2. Om du INTE har bokningsnummer → Fråga efter det:
   "Vilket bokningsnummer gäller detta? (Det börjar med BK-)"
3. Om du HAR bokningsnummer → Returnera BOOKING_LOOKUP i response

RETURNERA JSON:
{
  "response": "Ditt bokningsnummer är BK-12345. Din leverans är planerad till...",
  "is_booking_lookup": true,
  "booking_number": "BK-12345",
  "is_booking": false  // ← VIKTIGT: detta är INTE en ny booking
}
```

---

### STEG 2: Lägg till Booking Lookup Node

**Ny Supabase nod efter `aiResponse1`:**

Nod namn: `getBookingDetails`
```
Operation: getAll
Table: bookings
Filter:
  - booking_number = {{ $json.booking_number }}
Return all: FALSE (returnera bara 1 rad)
```

---

### STEG 3: Lägg till Response Builder

**Ny Code nod: `buildBookingResponse`**

```javascript
const aiResponse = $input.first().json;

// Om det är en booking lookup
if (aiResponse.is_booking_lookup === true) {
  const bookingNumber = aiResponse.booking_number;
  
  // Hämta booking detaljer
  const bookingResp = $('getBookingDetails').all();
  
  if (!bookingResp || bookingResp.length === 0) {
    return [{json: {
      response: `Tyvärr hittade jag ingen bokning med nummer ${bookingNumber}. Kan du dubbelkolla bokningsnumret?`,
      is_booking_lookup: true,
      booking_found: false
    }}];
  }
  
  const booking = bookingResp[0].json;
  
  // Format booking details
  const deliveryDate = new Date(booking.delivery_date).toLocaleDateString('sv-SE');
  const totalAmount = booking.total_amount || 0;
  const status = booking.booking_status || 'unknown';
  
  const detailedResponse = `
Bokningsnummer: ${booking.booking_number}
Status: ${status}
Leveransdatum: ${deliveryDate}
Totalt belopp: ${totalAmount} SEK
Plats: ${booking.location || 'N/A'}
${booking.notes ? 'Noteringar: ' + booking.notes : ''}

Kan jag hjälpa till med något mer?
  `.trim();
  
  return [{json: {
    response: detailedResponse,
    is_booking_lookup: true,
    booking_found: true,
    booking_details: booking
  }}];
}

// Om det INTE är booking lookup, returnera normalt
return [{json: aiResponse}];
```

---

### STEG 4: Uppdatera Flow Connections

**Lägg till denna connection:**
```
aiResponse1 → buildBookingResponse → formatEmail1
```

(Istället för direkt aiResponse1 → formatEmail1)

---

## 📊 Booking-Related Scenario Matrix

### SCENARIO 1: Fråga om leverans
```
Kund: "När är min leverans?"
Agent: "Vilket bokningsnummer gäller detta?"
Kund: "BK-1762275116288"
Agent: [Slår upp] "Din leverans är 2025-12-01 till Andersvägen 3"
```

### SCENARIO 2: Fråga om faktura
```
Kund: "Kan ni skicka fakturan?"
Agent: "Vilket bokningsnummer?"
Kund: "BK-1762275116288"
Agent: "Jag skickar fakturan för 5687.50 SEK till din email nu!"
```

### SCENARIO 3: Ändra datum
```
Kund: "Kan jag skjuta på till nästa vecka?"
Agent: "Vilket bokningsnummer vill du ändra?"
Kund: "BK-1762275116288"
Agent: "Du kan ändra det här: [länk]. Eller kontakta oss för assistans."
```

### SCENARIO 4: Första gången - ny bokning
```
Kund: "Jag vill hyra grillstation"
Agent: [Slår upp och skickar offert]
```

---

## 🧠 AI Classifier Logic

**I `classifyIntent1` noden, uppdatera:**

```javascript
Klassificera email som en av:
- "booking_request" → Ny bokning (grillstation, värmepump, osv)
- "booking_lookup" → Fråga om BEFINTLIG bokning (status, datum, osv)
- "booking_modification" → Ändra befintlig bokning
- "support_question" → FAQ-fråga
- "other"

Return: {"type": "booking_lookup" || "booking_request" || ...}
```

**Nyckelord för booking_lookup:**
- "leverans", "delivery"
- "faktura", "invoice", "pris", "price"
- "status", "när är"
- "kan jag ändra", "skjuta på", "postpone"
- "bokningsnummer", "BK-"
- "mina bokningar", "min bokning"

---

## ✅ Checklist

- [ ] Uppdatera `aiResponse1` system prompt med booking lookup instruktioner
- [ ] Lägg till `getBookingDetails` Supabase nod
- [ ] Lägg till `buildBookingResponse` Code nod
- [ ] Uppdatera `classifyIntent1` för booking_lookup
- [ ] Uppdatera flow connections
- [ ] Test: Fråga "När är min leverans?" utan bokningsnummer
- [ ] Test: Ge bokningsnummer och få detaljer
- [ ] Test: Ny bokning-flow fortfarande fungerar

