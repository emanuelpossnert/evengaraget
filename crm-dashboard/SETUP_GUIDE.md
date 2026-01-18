# 🔧 CRM Dashboard Setup Guide

## ✅ Fas 1: Redan färdigt!

Du har nu en **fungerande CRM-portal** med:

- ✅ Modern login-sida med EventGaraget branding
- ✅ Dashboard med sidebar och navigation
- ✅ Rollbaserad åtkomst (Admin, Manager, Warehouse, Support)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Tailwind CSS styling
- ✅ TypeScript type safety

## 🌐 Accessa portalen

```
URL: http://localhost:3001
```

**Demo-inlogg:**
- Email: `admin@eventgaraget.se`
- Password: `Demo123456`

## 🛠️ Nästa Steg - Fas 2: Kundhantering

För att implementera **kundlistan och kundkort** behöver vi:

### 1. Skapa `user_profiles` tabell i Supabase

Kör denna SQL i Supabase → SQL Editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (auth.role() = 'admin');

-- Create demo user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@eventgaraget.se',
  crypt('Demo123456', gen_salt('bf')),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Add profile for demo user
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

### 2. Uppdatera `.env.local`

Säkerställ att dessa variabler är satta:

```env
NEXT_PUBLIC_SUPABASE_URL=https://njiagzdssxoxycxraubf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Skapa kundhanteringskomponenter

Vi skapar:

1. **`/customers`** - Lista över alla kunder
2. **`/customers/[id]`** - Kundkort med detaljer
3. **Reusable komponenter** för tabeller, formulär, etc.

### 4. Implementera data-hämtning

Skapa hooks för:

```typescript
useCustomers()     // Hämta alla kunder
useCustomer(id)    // Hämta en specifik kund
useBookings()      // Hämta bokningar
useMessages()      // Hämta e-posthistorik
```

---

## 📋 Vad som händer härnäst

**Jag kan hjälpa dig med:**

1. **Snabb version:** Jag implementerar hela Fas 2-3 åt dig (kundhantering + bokningshantering)
2. **Steg-för-steg:** Du säger vad du vill fokusera på, så guidar jag dig

**Vilket föredrar du?**

---

## 💾 Säkerhet & Best Practices

### RLS (Row Level Security)

Alla tabeller bör ha policies så att:

- Användare endast ser sin egen data
- Admins kan se allt
- Managers ser bokningar och kunder
- Warehouse ser endast kalender

### Environment Variables

**ALDRIG commita `.env.local` till Git!**

Den är redan i `.gitignore`. Använd `.env.example` som template.

### TypeScript

All kod är **strictly typed** för säkerhet och IDE-stöd.

---

## 🎨 Styling Guide

### Färger

```css
/* Primary */
--primary-red: #DC2626
--primary-orange: #F97316

/* Neutral */
--neutral-light: #F3F4F6
--neutral-dark: #1F2937
```

### Komponenter

Alla komponenter använder **Tailwind CSS** och är **fully responsive**.

```tsx
// Button
<button className="gradient-primary text-white px-4 py-2 rounded-lg hover:shadow-lg">
  Klicka
</button>

// Card
<div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
  Innehål
</div>

// Badge
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
  Status
</span>
```

---

## 🚀 Production Checklist

Innan du deployar till produktion:

- [ ] Sätta upp Supabase Auth providers (Google, GitHub, etc.)
- [ ] Aktivera RLS på alla tabeller
- [ ] Sätta upp backups
- [ ] Testa error handling
- [ ] Sätta upp monitoring
- [ ] Testa på riktiga användare
- [ ] Dokumetera API-endpoints
- [ ] Sätta upp CI/CD pipeline

---

## 📞 Support

Kontakta mig med:

- Frågor om implementation
- Bug reports
- Feature requests
- Styling anpassningar
- Deployment issues

---

**Status:** Fas 1 ✅ | Fas 2 🔄

**Nästa:** Kundhantering (lista, kort, formulär)

