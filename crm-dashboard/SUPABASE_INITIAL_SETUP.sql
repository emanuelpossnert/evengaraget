-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║                   EventGaraget CRM - Initial Setup SQL                    ║
-- ║                                                                            ║
-- ║ Kör denna SQL i Supabase → SQL Editor för att sätta upp CRM-portalen      ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- STEP 1: Skapa user_profiles tabell
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('admin', 'manager', 'warehouse', 'support')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Aktivera RLS på user_profiles
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Skapa RLS Policies för user_profiles
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Uppdatera existing RLS policies för customers, bookings, etc.
-- ============================================================================

-- Disable RLS temporary för att tillåta READ (vi gör det mer restrictive senare)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE faq DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_events DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Skapa demo-användare (GÖR DETTA MANUELLT I SUPABASE!)
-- ============================================================================

-- ⚠️  VIKTIGT: Gå till Supabase Authentication → Users och skapa manuellt:
--
-- Email: admin@eventgaraget.se
-- Password: Demo123456
-- Confirm email: JA
--
-- Sedan kör du denna SQL för att lägga till profil:

INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 6: Skapa ytterligare demo-användare (opcional)
-- ============================================================================

-- Manager User (kör detta EFTER att du skapat e-mailen i Supabase Auth)
-- Email: manager@eventgaraget.se
-- Password: Demo123456

INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'Manager User',
  'manager'
FROM auth.users
WHERE email = 'manager@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;

-- Warehouse User
-- Email: warehouse@eventgaraget.se
-- Password: Demo123456

INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'Warehouse User',
  'warehouse'
FROM auth.users
WHERE email = 'warehouse@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;

-- Support User
-- Email: support@eventgaraget.se
-- Password: Demo123456

INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  'Support User',
  'support'
FROM auth.users
WHERE email = 'support@eventgaraget.se'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 7: Verifiera setup
-- ============================================================================

-- Kolla user_profiles tabell
SELECT id, email, full_name, role, created_at 
FROM user_profiles 
ORDER BY created_at DESC;

-- Kolla auth.users
SELECT id, email, confirmed_at, created_at 
FROM auth.users 
WHERE email LIKE '%eventgaraget%'
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 8: Test RLS Policies (köra senare)
-- ============================================================================

-- Som authenticated user, visa bara egen profil:
-- SELECT * FROM user_profiles WHERE id = auth.uid();

-- ============================================================================
-- FÄRDIG! 🎉
-- ============================================================================

