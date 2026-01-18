# Booking Confirmation Email Setup - N8N

## 🎯 Flöde

När en bokning godkänns från CRM:
1. ✅ Token skapas i `booking_tokens` table
2. ✅ Booking status → `pending`
3. 👥 Kundsidan länk genereras
4. 📧 Email skickas med länk till kunden
5. 📸 Kund kan ladda upp foliering-bilder
6. ✅ Admin kan se uploadade bilder i CRM

---

## 📋 N8N Workflow Setup

### Webhook Trigger
- **Path:** `booking-confirmation`
- **HTTP Method:** POST
- **Trigger:** `booking_confirmations` INSERT

### Data Flow

```
Webhook → Extract booking_id → Get customer email → Generate link → Format email → Send email → Log
```

---

## 🔧 Node Settings

### 1. **Webhook** Node
```
Path: booking-confirmation
HTTP Method: POST
```

### 2. **Extract Data** (Code Node)
```javascript
// Extract booking_id from webhook payload
const booking_id = $json.record?.booking_id;
const booking_number = $json.record?.booking_number;

return [{json: {booking_id, booking_number}}];
```

### 3. **Get Booking Token** (Supabase Node)
```
Operation: Get Many
Table: booking_tokens
Filter: booking_id = {{ $json.booking_id }}
```

### 4. **Get Customer** (Supabase Node)
```
Operation: Get
Table: bookings
Filter: id = {{ $json.booking_id }}
Select: customer_id, customer_email, booking_number, location, event_date
```

### 5. **Get Customer Email** (Supabase Node)
```
Operation: Get
Table: customers
Filter: id = {{ $json.customer_id }}
Select: email, name, phone
```

### 6. **Generate Link** (Code Node)
```javascript
// Get token from previous node
const tokenData = $input.all();
const token = tokenData[0]?.json?.token;
const bookingNumber = $json.booking_number;
const customerEmail = $json.email;
const customerName = $json.name;

// PRODUCTION URL (ändra för produktion)
const BOOKING_DETAILS_URL = process.env.BOOKING_DETAILS_URL || 'http://localhost:3000';
const customerLink = `${BOOKING_DETAILS_URL}/booking/${token}`;

return [{json: {
  customerEmail,
  customerName,
  bookingNumber,
  customerLink,
  event_date: $json.event_date,
  location: $json.location
}}];
```

### 7. **Format Email** (Code Node)
```javascript
const {customerName, bookingNumber, customerLink, event_date, location} = $json;

const subject = `Bokningsbekräftelse - ${bookingNumber}`;
const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { 
      display: inline-block; 
      background-color: #2563eb; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 6px; 
      margin: 20px 0;
      font-weight: bold;
    }
    .details { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bokningsbekräftelse</h1>
      <p>Din bokning är nu bekräftad!</p>
    </div>
    
    <div class="content">
      <p>Hej ${customerName},</p>
      
      <p>Din bokning med nummer <strong>${bookingNumber}</strong> är nu bekräftad och klar för nästa steg.</p>
      
      <div class="details">
        <strong>📅 Event-datum:</strong> ${new Date(event_date).toLocaleDateString('sv-SE')}<br>
        <strong>📍 Plats:</strong> ${location}<br>
        <strong>📋 Bokningsnummer:</strong> ${bookingNumber}
      </div>
      
      <p><strong>Nästa steg:</strong></p>
      <p>Klicka på knappen nedan för att se alla bokningsdetaljer och ladda upp dina foliering-designs:</p>
      
      <a href="${customerLink}" class="button">Visa bokningsdetaljer</a>
      
      <p>🎨 <strong>Viktigt:</strong> Ladda upp dina foliering-designs så snart som möjligt. Vi behöver dem senast 3 dagar före eventet.</p>
      
      <p>Om du har frågor eller behöver ändra något, kontakta oss gärna!</p>
      
      <p>Med vänlig hälsning,<br>
      <strong>EventGaraget Team</strong></p>
    </div>
  </div>
</body>
</html>
`;

return [{json: {
  to: customerEmail,
  subject,
  htmlBody,
  customer_name: customerName,
  booking_number: bookingNumber,
  customer_link: customerLink
}}];
```

### 8. **Send Gmail** Node
```
To: {{ $json.to }}
Subject: {{ $json.subject }}
Message: {{ $json.htmlBody }}
```

### 9. **Log to Supabase** (Supabase Node)
```
Operation: Create
Table: outgoing_emails
Fields:
  - recipient_email: {{ $json.to }}
  - subject: {{ $json.subject }}
  - body_html: {{ $json.htmlBody }}
  - email_type: "booking_confirmation"
  - status: "sent"
```

---

## 🌐 Environment Variables

I n8n, sätt upp dessa variabler:

```
BOOKING_DETAILS_URL=http://localhost:3000  (Development)
BOOKING_DETAILS_URL=https://booking.eventgaraget.se  (Production)
```

---

## 🚀 Deployment

### Booking Details App
Deploy till samma server som CRM, eller separat:

**Option A: Local Development**
```bash
cd booking-details-app
npm run dev  # Port 3000
```

**Option B: Production (Vercel)**
```bash
vercel deploy
```

**Option C: Docker/Own Server**
```bash
cd booking-details-app
npm run build
npm start  # Port 3000
```

---

## ✅ Testing

1. Gå till CRM Bokningar
2. Klicka "Bekräfta" på en "Väntande" bokning
3. Kolla Gmail inkorgen för email med länk
4. Klicka länken och verifiera att bokningsdetaljer visas
5. Testa att ladda upp en bild
6. Kolla att bilden sparas i Supabase Storage

---

## 🔐 Security

- ✅ Token är unika och single-use
- ✅ Länk är slumpmässig (svår att gissa)
- ✅ Token kopplas till booking_id
- ✅ Kundens email verificeras

**Framtida:** Implementera token-expiration (ex: 30 dagar)

