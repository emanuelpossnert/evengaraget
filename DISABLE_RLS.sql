-- ============================================
-- INAKTIVERA RLS FÖR N8N ÅTKOMST
-- ============================================
-- Kör detta i Supabase SQL Editor

-- Inaktivera RLS för alla tabeller
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning DISABLE ROW LEVEL SECURITY;

-- Verifiera att RLS är inaktiverat
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Om rowsecurity = false → RLS är inaktiverat ✅
