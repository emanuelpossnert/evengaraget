# 🔧 Supabase Setup för CRM Dashboard

## ✅ Status

**Port 3001:** ✅ WORKING
**Portal:** ✅ LIVE på http://localhost:3001
**Tabeller:** ✅ DOKUMENTERADE

---

## 📋 ALLA SUPABASE-TABELLER (Referens)

Se `SUPABASE_TABLES_REFERENCE.md` för fullständig lista.

### Kort Sammanfattning:

**Core Tables (10):**
1. ✅ `customers` - Alla kunder
2. ✅ `bookings` - Alla bokningar
3. ✅ `quotations` - Alla offert
4. ✅ `products` - Produkter
5. ✅ `messages` - E-poster
6. ✅ `conversations` - E-posttrådar
7. ✅ `addons` - Valfria tillägg
8. ✅ `quotation_addons` - Tillägg på offert
9. ✅ `faq` - FAQ
10. ✅ `quotation_events` - Webhook-events

**Support Tables (2):**
11. ✅ `user_profiles` - CRM-användare
12. ✅ `invoices` - Fakturor

**Storage:**
- ✅ `signed-quotations` - PDF-storage bucket

---

## 🚀 Nästa Steg - Förberedelser för Fas 2

Innan vi startar **Kundhantering (Fas 2)** behövs:

### 1. Skapa `user_profiles` Tabell

Kör denna SQL i Supabase → SQL Editor:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. Skapa Demo-Användare i Supabase

Gå till **Supabase → Authentication → Users** och skapa:

**Email:** admin@eventgaraget.se
**Password:** Demo123456

Sedan, i `user_profiles` tabell, lägg till:

```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

### 3. Uppdatera `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://njiagzdssxoxycxraubf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Fas 2: Kundhantering - READY TO START

Följande komponenter är nästa:

```
Components to Build:
├── /customers (page.tsx)
│   ├── Kundlista
│   ├── Sökfunktion
│   ├── Filtrering
│   ├── Pagination
│   └── Export CSV
│
├── /customers/[id] (page.tsx)
│   ├── Kundkort
│   ├── Tabs: Översikt, Bokningar, Offerter, E-post, Fakturor
│   ├── Kunddetaljer
│   ├── Redigera kunduppgifter
│   └── E-posthistorik
│
├── /customers/new (page.tsx)
│   ├── Nykundsformulär
│   ├── Validering
│   └── Dubblettöversyn
│
└── lib/hooks/
    ├── useCustomers() - Hämta alla kunder
    ├── useCustomer(id) - Hämta en kund
    ├── useMessages() - Hämta e-poster
    └── useBookings() - Hämta bokningar
```

---

## 💡 Tips Innan Du Börjar Fas 2

1. **Testa login-sidan**
   - Gå till http://localhost:3001
   - Logga in med `admin@eventgaraget.se` / `Demo123456`
   - Verifiera att du kommer till dashboard

2. **Verifiera databasen**
   - Kolla att alla tabeller finns i Supabase
   - Se över kolumnnamn (t.ex. `full_name` vs `name`)
   - Verifiera FK-relationer

3. **Sätt upp RLS policies**
   - `customers` - Användare ser bara egna data
   - `bookings` - Managers ser alla
   - `messages` - Supportteam ser alla

4. **Gör backups**
   - Innan du gör stora ändringar
   - Supabase → Settings → Backups

---

## 🔄 Workflow för Kundhantering

```
1. User navigates to /customers
   ↓
2. Fetch all customers with useCustomers() hook
   ↓
3. Display in table with search/filter/sort
   ↓
4. Click on customer → Go to /customers/[id]
   ↓
5. Show customer card with tabs:
   - Översikt: Fullständig info
   - Bokningar: Alla bokningar för denna kund
   - Offerter: Alla offert med PDF-länk
   - E-post: E-posthistorik från messages-tabell
   - Fakturor: Invoices för denna kund
   ↓
6. Allow edit/add notes/manage
```

---

## 🎨 Styling för Fas 2

Använd samma stil som login/dashboard:

- **Primary:** `#DC2626` (röd)
- **Accent:** `#F97316` (orange)
- **Borders:** `border-gray-200`
- **Background:** `bg-gray-50` eller `bg-white`
- **Cards:** `rounded-lg shadow-sm`
- **Buttons:** `gradient-primary` för primär action

---

## 📊 Tidsestimering

**Fas 2 (Kundhantering):** ~2-3 timmar
- Kundlista: 30 min
- Kundkort: 1 timme
- E-posthistorik: 45 min
- Formulär & validering: 45 min

---

## ✅ Checklista Innan Fas 2

- [ ] `user_profiles` tabell är skapad
- [ ] Demo-användare är registrerad
- [ ] `.env.local` är uppdaterad
- [ ] Login fungerar på http://localhost:3001
- [ ] Dashboard laddar utan fel
- [ ] Alla tabeller finns i Supabase
- [ ] Kolumnnamn är verifierade

---

## 🚀 Nästa Command

**Vill du att jag börjar bygga Fas 2 nu?**

Jag kan:
1. Bygga kundlista-sidan
2. Bygga kundkort-sidan
3. Implementera e-posthistorik
4. Lägga till redigeringsfunktionalitet

**Vad vill du fokusera på först?** 👇

---

**Status:** Fas 1 ✅ | Fas 2 🔄 READY
**Senaste:** 2025-11-12

