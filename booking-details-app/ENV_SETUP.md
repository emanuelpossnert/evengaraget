# Configuration for Booking Details App

## Local Development - .env.local

Fyll i dessa värden från din Supabase-instans:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here

## Instruktioner:

1. Gå till https://app.supabase.com
2. Välj ditt projekt
3. Settings → API
4. Kopiera "Project URL" och "anon public" key
5. Spara i .env.local

## Säkerhet:
- Använd ENDAST public anon key
- RLS-policies kontrollerar åtkomst

