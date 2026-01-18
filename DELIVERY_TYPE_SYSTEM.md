# Delivery Type System - Stockholm Interno/Externa Frakt

## 🎯 Overview

Systemet automatiskt detekterar om en bokning kan levereras av EventGaraget (Stockholm-området) eller om det krävs extern frakt.

## 📊 Regler

### Stockholm (Interno Frakt) ✅
- **Postnummer:** 10000-19999 (Stockholm area codes)
- **Städer:** Stockholm
- **Fraktkostnad:** 0 SEK (gratis)
- **Levererad av:** EventGaraget

### Utanför Stockholm (Externa Frakt) 📦
- **Överallt annat**
- **Fraktkostnad:** Admin sätter per bokning
- **Levererad av:** Extern fraktpartner

## 💾 Database

### Tabell: `bookings`
```sql
ALTER TABLE bookings ADD COLUMN delivery_type VARCHAR(50) DEFAULT 'internal';
-- Values: 'internal' | 'external'
```

### Functions
1. `detect_delivery_type(postal_code, city)` - Detekterar typ automatiskt
2. `get_default_shipping_cost(delivery_type)` - Returnerar default fraktkostnad

## 🎨 UI/UX - Bokningsbekräftelse

När admin bekräftar en bokning ska:

1. **Auto-Detekt visas:**
   ```
   📍 Leveranstyp: INTERN (grön badge)
   Postal: 11400 Stockholm
   
   eller
   
   📍 Leveranstyp: EXTERN (röd badge) ⚠️
   Postal: 75000 Uppsala
   ```

2. **Override möjlighet:**
   - Dropdown för att manuellt ändra om behövs
   - "Ändra till extern" / "Ändra till intern"

3. **Fraktkostnad:**
   ```
   Fraktkostnad: [Auto: 0 SEK] eller [Manuell: 500 SEK]
   ```

4. **Info för admin:**
   ```
   ℹ️ Externa frakter kräver separata avtalsförhandlingar.
      Kontrollera att fraktkostnad är korrekt satt.
   ```

## 🔧 Implementering på Bokningsbekräftelse-Sida

### Steg 1: Visa detekterad typ
```typescript
const [deliveryType, setDeliveryType] = useState(booking.delivery_type);
const isExternal = deliveryType === 'external';

// Show badge
<span className={isExternal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
  {isExternal ? '📦 EXTERN FRAKT' : '✅ INTERN FRAKT'}
</span>
```

### Steg 2: Allow override
```typescript
<select 
  value={deliveryType}
  onChange={(e) => setDeliveryType(e.target.value)}
>
  <option value="internal">✅ Intern (EventGaraget)</option>
  <option value="external">📦 Extern (Fraktpartner)</option>
</select>
```

### Steg 3: Update shipping cost
```typescript
const defaultShipping = isExternal ? 0 : 0;
const finalShipping = customShippingCost || defaultShipping;
```

## ✅ Fördelar

1. **Automatisk** - Detekteras baserat på adress
2. **Flexibel** - Kan overridas manuellt
3. **Tydlig** - Admin ser typ och status
4. **Effektiv** - Sparar tid vid bokningsbekräftelse
5. **Granskbar** - Fraktkostnad valideras innan godkännande

## 📍 Stockholm-området Definition

**Postal codes:**
- 10000-19999 (tio-niotusenserie)

**Exempel:**
- ✅ 11300 Stockholm = INTERN
- ✅ 18200 Djursholm = INTERN
- ❌ 20000 Västerås = EXTERN
- ❌ 75000 Uppsala = EXTERN

## 🚀 Nästa Steg

1. Kör SQL-scriptet: `ADD_DELIVERY_TYPE.sql`
2. Uppdatera bokningsbekräftelse-sidan för att visa delivery_type
3. Lägg till override-dropdown
4. Test med bokningar i & utanför Stockholm

