# 🔧 N8N Quotation Workflow - FIX GUIDE

## Problem
Webhooken skickar booking-data, men **customer_id är null** i nyss skapade bookings från CRM.

```json
{
  "customer_id": null,  // ❌ Problem!
  "booking_number": "BK-1770239914626",
  "products_requested": "[{\"name\":\"Moppe Piaggio Ape\"...}]"
}
```

## Root Cause
**"Get Customer"-noden** försöker använda `$json.customer_id` direkt från webhook, men det är `null`.

### Fel i workflow:
```
Webhook1 → Get Booking → Get Customer  ❌
                         (uses $json.customer_id = null)
```

## Lösning - 3 ändringar

### 1️⃣ FIX "Get Customer" Node
**Before:**
```
Filter: keyName="id", keyValue="{{ $json.customer_id }}"
```

**After:**
```
Filter: keyName="id", keyValue="{{ $('Get Booking').first().json.customer_id }}"
```

**Explanation:** Använd booking-objektet från föregående nod istället för att förlita dig på webhook-datan direkt.

---

### 2️⃣ FIX "Update Booking Status" Node
**Before:**
```
Filter: keyName="booking_number", keyValue="{{ $json.booking_id }}"
```

**After:**
```
Filter: keyName="id", keyValue="{{ $('Get Booking').first().json.id }}"
```

**Explanation:** Uppdatera med booking-ID istället för booking_number.

---

### 3️⃣ FIX "Generate Token & URL" Code
**Add logging:**
```javascript
console.log('📊 Booking data:', { id: booking.id, customer_id: booking.customer_id });
console.log('👤 Customer:', { id: customer?.id, name: customer?.name });
```

---

## 📝 Steg-för-steg i N8N

1. **Öppna workflowet** i N8N
2. **Klicka på "Get Customer"-noden**
3. **Ändra Filter:**
   - `keyValue` från `{{ $json.customer_id }}`
   - Till `{{ $('Get Booking').first().json.customer_id }}`
4. **Klicka på "Update Booking Status"-noden**
5. **Ändra Filter:**
   - `keyName` från `booking_number`
   - Till `id`
   - `keyValue` från `{{ $json.booking_id }}`
   - Till `{{ $('Get Booking').first().json.id }}`
6. **SAVE** och **DEPLOY**
7. **Test:** Skapa ny bokning → Check logs

---

## ✅ Resultat
Efter fixar kommer workflowet att:
1. ✅ Hämta booking med dess customer_id
2. ✅ Hämta customer-data korrekt
3. ✅ Generera quotation
4. ✅ Skicka e-mail till kund med all info
5. ✅ Uppdatera booking-status till "quotation_sent"

---

## 🧪 Test
```bash
curl -X POST http://localhost:5678/webhook/quotation-generation \
  -H "Content-Type: application/json" \
  -d '{"body":{"record":{"id":"<booking-id>"}}}'
```

Se logs i N8N för att verifiera flödet.
