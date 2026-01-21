# Environment Variables Setup Guide

## 🔧 Required Environment Variables

Copy these to your `.env.local` file in the `crm-dashboard` directory:

```env
# =============================================
# SUPABASE CONFIGURATION (REQUIRED)
# =============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# =============================================
# APPLICATION CONFIGURATION
# =============================================
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
```

## 📍 Where to Find These Values

### Supabase URL & Keys
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings → API**
4. Find:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Vercel Deployment

When deploying to Vercel, add these as Environment Variables:

1. Go to Vercel Dashboard
2. Select your project
3. **Settings → Environment Variables**
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Important Security Notes

- ✅ `.env.local` is in `.gitignore` (don't commit it)
- ✅ `NEXT_PUBLIC_*` variables are safe to expose (prefix means public)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is secret (never commit or expose)
- ✅ Always use service role key for server-side operations only
- ✅ Supabase RLS policies protect data at database level

## 🔍 Verification

To verify environment variables are loaded:
```bash
cd crm-dashboard
npm run dev
# Check console for Supabase initialization messages
# Visit http://localhost:3001
# Open DevTools → Console (should show Supabase initialized)
```

## 📚 See Also

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
