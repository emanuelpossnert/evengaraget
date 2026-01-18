# Booking Details App

En Next.js app för att visa bokningsdetaljer och ladda upp foliering-bilder.

## Features

- ✅ Token-baserad säker åtkomst till bokningar
- ✅ Visa alla bokningsdetaljer
- ✅ Ladda upp foliering-designs (PDF, JPG, PNG)
- ✅ Spara uppladdningar till Supabase
- ✅ Responsive design med Tailwind CSS

## Setup

### 1. Installera dependencies

```bash
cd booking-details-app
npm install
```

### 2. Konfigurera environment variables

Skapa `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Konfigurera Supabase Storage

1. Gå till Supabase Console → Storage
2. Skapa en ny bucket: `booking-wrapping-images`
3. Sätt tillåtna MIME-typer: `image/*`, `application/pdf`
4. Max filstorlek: 10MB

### 4. Kör utvecklingsservern

```bash
npm run dev
```

Öppna http://localhost:3000

## Miljöer

**Development:** Port 3000
**Production:** Port 3001 eller din hosting

## Database Integration

Appen använder två tabeller:
- `booking_tokens` - För säkra länkgenerering
- `booking_wrapping_images` - För uppladdade bilder

