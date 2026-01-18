# 🚀 SQL Commands - Quick Reference

Kopiera och kör dessa i Supabase SQL Editor, **i denna ordning**:

---

## 1️⃣ SKAPA user_profiles TABELL

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('admin', 'manager', 'warehouse', 'support')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2️⃣ AKTIVERA RLS OCH SKAPA POLICIES

```sql
-- Aktivera RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Användare kan läsa sin egen profil
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Admins kan läsa alla profiler
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Admins kan uppdatera
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 4: Admins kan skapa
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 3️⃣ DISABLE RLS PÅ ÖVRIGA TABELLER (Temporary)

```sql
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

---

## 4️⃣ LÄGG TILL ADMIN-PROFIL

⚠️ **FÖRST:** Skapa användaren i Supabase Authentication:
- Email: `admin@eventgaraget.se`
- Password: `Demo123456`

**SEN** kör denna SQL:

```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

---

## 5️⃣ VERIFIERA

```sql
-- Se user_profiles
SELECT * FROM user_profiles;

-- Se auth.users
SELECT id, email, confirmed_at FROM auth.users WHERE email LIKE '%eventgaraget%';
```

---

## 👥 LÄGG TILL FLER ANVÄNDARE (Optional)

Först, skapa användaren i Supabase Auth (se steg 4️⃣), sen:

### Manager
```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Manager User', 'manager'
FROM auth.users WHERE email = 'manager@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

### Warehouse
```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Warehouse User', 'warehouse'
FROM auth.users WHERE email = 'warehouse@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

### Support
```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, 'Support User', 'support'
FROM auth.users WHERE email = 'support@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;
```

---

## 🗑️ OM DU BEHÖVER STÄDA UPP

```sql
-- Ta bort alla profiler
DELETE FROM user_profiles;

-- Ta bort user_profiles tabell
DROP TABLE IF EXISTS user_profiles;

-- Verifiera att det är borta
SELECT * FROM user_profiles;
```

---

## ✅ Färdig!

Du är klar när:
1. ✅ user_profiles tabell är skapad
2. ✅ RLS policies är skapade
3. ✅ Admin-profil är tillagd
4. ✅ Du kan logga in på http://localhost:3001

---

**Kör dessa SQL i denna exakta ordning!**

