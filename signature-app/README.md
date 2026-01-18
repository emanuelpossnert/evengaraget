# EventGaraget - Digital Signature App

Digital signeringstjänst för EventGaraget bokningar.

## 🚀 Snabbstart

### 1. Installera dependencies
```bash
npm install
```

### 2. Konfigurera environment
```bash
cp .env.local.example .env.local
# Redigera .env.local med dina Supabase credentials
```

### 3. Starta development server
```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000)

## 📝 Environment Variables

Skapa `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🔗 Routes

- `/` - Home page med instruktioner
- `/sign/[token]` - Signeringssida (token = booking_number)
- `/sign/[token]/success` - Bekräftelse efter signering

## 📦 Deploy till Vercel

```bash
vercel deploy --prod
```

Eller:
1. Push till GitHub
2. Importera i Vercel
3. Lägg till environment variables
4. Deploy!

## 🧪 Testing

Test med exempel-bokning:
```bash
# Öppna i browser:
http://localhost:3000/sign/BK-2024-123456
```

(Bokningen måste finnas i Supabase)

