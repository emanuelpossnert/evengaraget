-- ============================================
-- INAKTIVERA RLS FÖR N8N ÅTKOMST
-- ============================================
-- Endast för tabeller som faktiskt finns

-- Inaktivera RLS för huvudtabeller
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Inaktivera RLS för bookings-relaterade tabeller (om de finns)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
        ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quotations') THEN
        ALTER TABLE public.quotations DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
        ALTER TABLE public.follow_ups DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_learning') THEN
        ALTER TABLE public.ai_learning DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Verifiera att RLS är inaktiverat
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'conversations', 'messages', 'bookings', 'quotations', 'products')
ORDER BY tablename;
