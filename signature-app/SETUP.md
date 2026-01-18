# 🎨 Signature App - Setup Guide

## 📋 Prerequisites

- Node.js 18+ installed
- npm installed
- Supabase project configured

---

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
cd signature-app
npm install
```

### 2. Create `.env.local` File

Create a file named `.env.local` in the `signature-app` root directory with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# n8n Webhook URL (update once ngrok is running)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook/signature-completed
```

**Get these values:**
1. Go to **Supabase Dashboard** → Settings → API
2. Copy `Project URL` and `Anon Key`
3. Once ngrok is running, update `N8N_WEBHOOK_URL` with ngrok URL

### 3. Start Dev Server

```bash
npm run dev
```

The app should be available at **http://localhost:3000**

---

## 🧪 Verify Setup

1. Open http://localhost:3000 in your browser
2. You should see the homepage
3. Try accessing a quotation page:
   ```
   http://localhost:3000/quotation/test-token-12345
   ```
   (Should show "Offert ej funnen" error - that's correct!)

---

## 📁 File Structure

```
signature-app/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Global styles
│   ├── quotation/
│   │   └── [token]/
│   │       └── page.tsx        # Quotation review page ✨ NEW
│   └── sign/
│       └── [token]/
│           ├── page.tsx        # Digital signature page
│           └── success/
│               └── page.tsx    # Success page
├── public/                      # Static files
├── .env.local                  # Environment variables (create this!)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

---

## 🔗 Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key | `eyJhbGc...` |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | Webhook for signature completion | `https://abc123.ngrok.io/webhook/signature-completed` |

---

## 🚀 Running in Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]

# Or use a different port
npm run dev -- -p 3001
```

### Build Errors

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Supabase Connection Error

1. Verify `.env.local` exists with correct values
2. Check Supabase project is active
3. Verify anon key has correct permissions
4. Check RLS policies allow `SELECT` for public access

---

## 📖 Pages Overview

### Home Page
- Path: `/`
- Status: Placeholder/Info page

### Quotation Review Page
- Path: `/quotation/[token]`
- Features:
  - Load quotation by signing token
  - Display booking details
  - Select optional addons
  - Live price calculation
  - Navigate to signature page

### Signature Page
- Path: `/sign/[token]`
- Features:
  - Display final quotation
  - Digital signature canvas
  - PDF generation
  - Save to Supabase storage
  - Send confirmation webhook

### Success Page
- Path: `/sign/[token]/success`
- Shows confirmation after successful signing

---

## 🔐 Security Notes

- Only `NEXT_PUBLIC_*` variables are exposed to browser
- All API calls use Supabase RLS policies
- PDF signatures are stored server-side
- Quotation tokens are cryptographically secure

---

## ✅ Next Steps

1. [ ] Create `.env.local` with Supabase credentials
2. [ ] Start dev server: `npm run dev`
3. [ ] Verify app loads at `http://localhost:3000`
4. [ ] Run full system test with all services

---

**Need help?** Check the parent project documentation:
- `MANUAL_STARTUP.md`
- `QUICK_N8N_SETUP.md`
- `N8N_SETUP_GUIDE.md`
