# 📊 EventGaraget CRM Dashboard

En modernt designad, säker och intuitiv CRM-portal för att hantera bokningar, kunder, produkter och fakturering.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Environment Variables

Skapa en `.env.local` fil (eller uppdatera den befintliga):

```env
NEXT_PUBLIC_SUPABASE_URL=https://njiagzdssxoxycxraubf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Utveckling

```bash
npm run dev
```

Portalen är då tillgänglig på `http://localhost:3001`

### Production Build

```bash
npm run build
npm run start
```

## 🎨 Arkitektur

```
crm-dashboard/
├── app/
│   ├── components/        # Reusable React components
│   ├── dashboard/        # Dashboard pages & layout
│   ├── lib/              # Utilities, types, Supabase config
│   ├── globals.css       # Global styles & Tailwind
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Login page
├── public/               # Static assets
├── package.json
└── tailwind.config.ts
```

## 🔐 Autentisering

### Login

- **E-post:** admin@eventgaraget.se
- **Lösenord:** Demo123456

### Roller & Behörigheter

1. **Admin** - Full åtkomst till allt
2. **Manager** - Bokningar, kunder, fakturor
3. **Warehouse** - Endast kalender och lagerstatus
4. **Support** - Kunder och e-post

## 📋 Fas 1 Implementerad ✅

- ✅ Next.js 14 + TypeScript setup
- ✅ Tailwind CSS configuration
- ✅ Supabase auth integration
- ✅ Global types & interfaces
- ✅ Login page med EventGaraget branding
- ✅ Dashboard layout (Sidebar + TopBar)
- ✅ Basic dashboard page med stats

## 🔧 Nästa Fas (Fas 2: Kundhantering)

```
📅 TODO:
1. [ ] Kundlista-sida (/customers)
   - Tabell med alla kunder
   - Sökfunktion & filtrering
   - Sortering
   - Export till CSV
   
2. [ ] Kundkort-sida (/customers/[id])
   - Fullständig kundinfo
   - Tabs: Översikt, Bokningar, Offerter, E-post, Fakturor
   - Redigera kunduppgifter
   - E-posthistorik
   
3. [ ] Nykundsformulär
   - Formulär för att skapa ny kund
   - Validering
   - Dubblettöversyn
```

## 🛠️ Komponenter

### Logo
- EventGaraget logga med branding

### Sidebar
- Navigation baserad på användarroll
- User profile info
- Logout button

### TopBar
- Sökfälts
- Notifications bell
- User avatar

## 📝 Styling

Portalen använder **Tailwind CSS** med EventGaraget-branding:

- **Primär röd:** `#DC2626`
- **Accent orange:** `#F97316`
- **Neutral:** `#F3F4F6` (ljus), `#1F2937` (mörk)

Alla komponenter är **responsive** och stöder **mobile/tablet/desktop**.

## 🔄 Git-workflow

```bash
# Skapa feature-branch
git checkout -b feature/dashboard-phase-2

# Commita ändringar
git add .
git commit -m "feat: add customer list page"

# Push
git push origin feature/dashboard-phase-2
```

## 🚀 Deployment

### Vercel (Rekommenderat)

```bash
vercel deploy
```

### Environment Variables (Production)

Lägg till i Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## 📚 Dokumentation

Se `CRM_BUILD_PLAN.md` för fullständig implementeringsplan.

---

**Status:** Under utveckling (Fas 1 ✅, Fas 2 🔄)

**Senaste uppdatering:** 2025-11-12

