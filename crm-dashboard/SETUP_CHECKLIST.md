# ✅ CRM Login Setup - Steg-för-steg Checklist

## 🎯 Mål
Du ska kunna logga in på CRM-portalen med:
- **Email:** admin@eventgaraget.se
- **Lösenord:** Demo123456

---

## 📋 STEG 1: Skapa Demo-Användare i Supabase

### 1.1 Gå till Supabase Console
```
URL: https://app.supabase.com
Projekt: EventGaraget
```

### 1.2 Skapa Admin-Användare
1. Klicka på **Authentication** i vänstra menyn
2. Klicka på **Users**
3. Klicka på **Add user** → **Invite user**
4. Fyll i:
   - **Email:** `admin@eventgaraget.se`
   - **Password:** `Demo123456`
   - **Confirm password:** `Demo123456`
5. Klicka **Send invite** (eller bara **Create user** om invite inte finns)

✅ **OBS!** Notera user-ID som skapas (UUID format)

---

## 📋 STEG 2: Kör SQL för att skapa user_profiles Tabell

### 2.1 Öppna SQL Editor
1. Gå till **SQL Editor** i Supabase
2. Klicka på **New Query**

### 2.2 Kopiera och kör denna SQL:

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

-- Policy: Användare kan läsa sin egen profil
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admins kan läsa alla profiler
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins kan uppdatera alla profiler
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins kan skapa nya profiler
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

✅ **Klicka "Run"**

---

## 📋 STEG 3: Kör SQL för att lägga till Admin-Profil

Kopiera denna SQL och kör den:

```sql
-- Lägg till admin-profil för admin@eventgaraget.se
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

✅ **Du bör se en rad med admin-användaren**

---

## 📋 STEG 4: Disable RLS på Övriga Tabeller (Temporary)

Kopiera denna SQL och kör den:

```sql
-- Disable RLS temporary för att vi kan testa
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
```

✅ **Klar!**

---

## 📋 STEG 5: Verifiera Environment Variables

Kontrollera att `.env.local` i `crm-dashboard/` har rätt värden:

```env
NEXT_PUBLIC_SUPABASE_URL=https://njiagzdssxoxycxraubf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Dessa måste matcha dina Supabase project settings!**

---

## 📋 STEG 6: Starta CRM-Portalen

```bash
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget/crm-dashboard
npm run dev
```

✅ **Servern ska starta på port 3001**

---

## 📋 STEG 7: Testa Login

### 7.1 Öppna portalen
```
URL: http://localhost:3001
```

### 7.2 Logga in med:
- **Email:** admin@eventgaraget.se
- **Lösenord:** Demo123456

### 7.3 Du ska se:
```
✅ Login-formuläret accepterar e-mail och lösenord
✅ Du kommer till Dashboard efter login
✅ Sidebar visar "Admin User"
✅ Navigation visar alla menyobjekt (eftersom du är admin)
```

---

## 🆘 Felsökning

### Fel: "User not found" eller "Invalid credentials"
**Lösning:** 
1. Verifiera att användaren finns i Supabase Authentication
2. Verifiera lösenordet är rätt (`Demo123456`)
3. Bekräfta att user_profiles raden finns

### Fel: "Cannot read properties of null"
**Lösning:**
1. Kolla att user_profiles tabellen är skapad
2. Verifiera att admin-profilen är tillagd med rätt UUID
3. Kontrollera RLS-policies

### Fel: "Route not found" på port 3001
**Lösning:**
1. Starta om servern: `npm run dev`
2. Verifiera att port 3001 inte är blockerad
3. Kolla `npm` logs för errors

### Databaskopplingen misslyckas
**Lösning:**
1. Verifiera `.env.local` variabler
2. Kontrollera att du är online
3. Testa Supabase connection i SQL Editor

---

## ✅ Checklist

- [ ] Skapat admin-användare i Supabase Auth
- [ ] Noterat user-ID (UUID)
- [ ] Skapat user_profiles tabell
- [ ] Lagt till admin-profil i user_profiles
- [ ] Disabled RLS på övriga tabeller
- [ ] Verifiera .env.local variabler
- [ ] Startat CRM-portalen på port 3001
- [ ] Testats login med admin@eventgaraget.se / Demo123456
- [ ] Kommer till Dashboard efter login

---

## 🎯 Nästa Steg Efter Login

1. ✅ Verifiera att du kan logga in
2. 🔄 Se övriga demo-användare nedan
3. 🚀 Börja bygga Fas 2 (Kundhantering)

---

## 👥 Övriga Demo-Användare (Optional)

Du kan skapa dessa senare för att testa olika roller:

### Manager User
```
Email: manager@eventgaraget.se
Password: Demo123456
Role: manager
```

SQL:
```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Manager User', 'manager'
FROM auth.users WHERE email = 'manager@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

### Warehouse User
```
Email: warehouse@eventgaraget.se
Password: Demo123456
Role: warehouse
```

SQL:
```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Warehouse User', 'warehouse'
FROM auth.users WHERE email = 'warehouse@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

### Support User
```
Email: support@eventgaraget.se
Password: Demo123456
Role: support
```

SQL:
```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Support User', 'support'
FROM auth.users WHERE email = 'support@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

---

## 🎉 Färdig!

När du har gjort allt detta, ska du kunna:

✅ Logga in på http://localhost:3001
✅ Se CRM-dashboarden
✅ Navigera med sidebar-menyn
✅ Logga ut och in igen

**Meddela när du är redo att börja Fas 2!** 🚀

---

**Status:** 📋 Setup Checklist
**Senaste:** 2025-11-12

