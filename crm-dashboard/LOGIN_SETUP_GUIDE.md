# 🔐 CRM Login Setup - Komplett Guide

## 🎯 I denna guide ska du

1. Skapa en admin-användare i Supabase
2. Skapa user_profiles tabell med RLS
3. Logga in på CRM-portalen
4. Se Dashboard

**Tid:** ~10 minuter ⏱️

---

## 📍 STEP-BY-STEP

### STEG 1: Öppna Supabase Console

```
URL: https://app.supabase.com
Projekt: EventGaraget
```

---

### STEG 2: Skapa Admin-Användare

1. Klicka **Authentication** (vänstra menyn)
2. Klicka **Users**
3. Klicka **Add user** → **Invite user**
4. Fyll i:
   ```
   Email: admin@eventgaraget.se
   Password: Demo123456
   ```
5. Klicka **Send invite** (eller **Create user**)

✅ **Wohoo!** Användaren är skapad. Notera user-ID (UUID).

---

### STEG 3: Öppna SQL Editor

1. Klicka **SQL Editor** (vänstra menyn)
2. Klicka **New Query**

---

### STEG 4: Kopiera & Kör denna SQL

**Kopiera ALL denna kod:**

```sql
-- Skapa user_profiles tabell
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('admin', 'manager', 'warehouse', 'support')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktivera RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Disable RLS på övriga tabeller (temporary)
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotation_addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS faq DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotation_events DISABLE ROW LEVEL SECURITY;

-- Lägg till admin-profil
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;

-- Verifiera
SELECT * FROM user_profiles;
```

**Klicka "Run"** (eller Ctrl+Enter)

✅ **Du bör se en rad med admin-användarens profil**

---

### STEG 5: Verifiera Environment Variables

**Öppna denne fil i din editor:**

```
crm-dashboard/.env.local
```

**Kontrollera att den innehåller:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://njiagzdssxoxycxraubf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ Om den inte finns, skapa den med dessa värden från Supabase → Settings → API

---

### STEG 6: Starta CRM-Portalen

**Öppna terminal och kör:**

```bash
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget/crm-dashboard
npm run dev
```

Du bör se:
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3001
```

✅ **Portalen är klar!**

---

### STEG 7: Logga In

**Öppna webbläsare:**

```
http://localhost:3001
```

**Du ska se en fin login-sida.** 🎨

**Fyll i:**
- Email: `admin@eventgaraget.se`
- Password: `Demo123456`

**Klicka "Logga in"**

---

### STEG 8: Du Ska Nu Se Dashboard 🎉

```
✅ Sidebar med meny (Dashboard, Kunder, Bokningar, etc.)
✅ TopBar med search och notifications
✅ Dashboard stats (0 bokningar, 0 revenue, etc.)
✅ Recent bookings & Top customers
✅ User name i sidebar footer
✅ Logout button
```

---

## 🆘 Felsökning

### Fel: "Route not found" på port 3001
```
→ Starta om servern: npm run dev
→ Verifiera att port 3001 inte är blockerad
```

### Fel: "User not found" eller "Invalid credentials"
```
→ Verifiera att admin@eventgaraget.se finns i Supabase Auth
→ Verifiera lösenordet: Demo123456
→ Kolla att user_profiles-raden finns: SELECT * FROM user_profiles;
```

### Fel: "Cannot read properties of null"
```
→ Kontrollera att user_profiles tabell existerar
→ Verifiera att RLS policies är skapade
→ Kolla att admin-profilen är tillagd
```

### Fel: "Missing Supabase environment variables"
```
→ Skapa/uppdatera .env.local med rätt values
→ Starta om servern efter att ha uppdaterat .env.local
```

---

## ✅ Checklist

- [ ] Skapat admin@eventgaraget.se i Supabase Auth
- [ ] Kört all SQL för user_profiles, RLS, policies
- [ ] Verifiera att SELECT * FROM user_profiles visar en rad
- [ ] Verifiera .env.local innehåller Supabase-variabler
- [ ] Startat npm run dev på port 3001
- [ ] Kan logga in med admin@eventgaraget.se / Demo123456
- [ ] Ser Dashboard efter login
- [ ] Kan logga ut

---

## 🎯 Nästa Steg

**Du är nu redo för Fas 2: Kundhantering!** 🚀

Vi ska bygga:
1. Kundlista-sida
2. Kundkort med tabs
3. E-posthistorik
4. Redigeringsfunktionalitet

**Meddela när du är klar med login-setup!**

---

**Status:** 🟡 Login Setup
**Senaste:** 2025-11-12

**Du behöver bara:**
1. ✏️ Skapa user i Supabase Auth
2. 🔧 Kör SQL
3. 🚀 Logga in!

**Lycka till!** 🍀

