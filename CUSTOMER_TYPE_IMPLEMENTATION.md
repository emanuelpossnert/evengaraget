# Instruktioner för att lägga till Customer Type och ID-nummer

## Steg 1: Kör SQL schema-update i Supabase
Kör filen: `supabase/UPDATE_CUSTOMERS_TABLE.sql` i Supabase SQL Editor

## Steg 2: Uppdatera types.ts
Lägg till dessa fält i `Customer` interface:
```typescript
customer_type?: 'private' | 'company';
org_number?: string;
personal_number?: string;
```

## Steg 3: Manual Booking (`bookings/new-manual/page.tsx`)
I formData state, lägg till:
```typescript
customer_type: 'private', // eller 'company'
org_number: '',
personal_number: '',
```

Lägg till UI-components:
1. Radio button/Select för "Privat" eller "Företag"
2. Input för "Organisations nummer" (om Företag)
3. Input för "Personnummer" (om Privat)
4. Gör båda obligatoriska

I handleSubmit, spara dessa fält när du skapar kunden.

## Steg 4: Signature App (`signature-app/app/quotation/[token]/page.tsx`)
Om man kan välja customer_type där:
1. Lägg till samma radio buttons
2. Lägg till samma inputs
3. Spara till booking_id

## Steg 5: Customer Card Display
Visa customer_type och motsvarande nummer:
- Om "Privat": visa "Personnummer: XXX"
- Om "Företag": visa "Organisations nummer: XXX"
