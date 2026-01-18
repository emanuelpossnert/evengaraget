# 🔐 Supabase RLS Permission Denied Fix

## Problem
HTTP 42501: `permission denied for table conversations`

Detta betyder att **Row Level Security (RLS) policies är för restrictiva** på conversations tabellen.

## Lösning

### Steg 1: Gå till Supabase Dashboard
1. Öppna https://app.supabase.com
2. Välj ditt projekt
3. Gå till `Authentication` → `Policies` (eller `SQL Editor`)

### Steg 2: Kontrollera/Fixa RLS Policies för `conversations`

Kör denna SQL för att **TILLFÄLLIGT** disable RLS (för testing):

```sql
-- DISABLE RLS på conversations (ONLY FOR TESTING!)
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- DISABLE RLS på messages (ONLY FOR TESTING!)
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
```

### Steg 3: Eller - Lägg till Korrekt Policy

Om du vill behålla RLS, lägg till denna policy:

```sql
-- Allow all operations for now (use in development only)
CREATE POLICY "Enable all for authenticated users"
ON public.conversations
FOR ALL
USING (true)
WITH CHECK (true);

-- Do the same for messages
CREATE POLICY "Enable all for authenticated users"
ON public.messages
FOR ALL
USING (true)
WITH CHECK (true);
```

### Steg 4: Test

1. Importera den uppdaterade JSON-filen i n8n
2. Kör workflowet igen
3. Kolla console logs för debugging

## Efter Testen - Säkerhet

**VIKTIGT**: I production bör du ha proper RLS policies:

```sql
-- Korrekt policy för production:
CREATE POLICY "authenticated_insert"
ON public.conversations
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select"
ON public.conversations  
FOR SELECT
USING (auth.role() = 'authenticated');
```

Men för nu - **disable RLS** för att testa att flödet fungerar!

