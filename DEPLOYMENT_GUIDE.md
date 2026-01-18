# 🚀 Deployment Guide - Eventgaraget

## Oversikt av deploymenter

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Supabase (PostgreSQL Database & Auth)               │   │
│  │ - Databas                                            │   │
│  │ - Auth                                               │   │
│  │ - Storage (images)                                   │   │
│  │ - Webhooks                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ▲                                 │
│        ┌──────────────────┼──────────────────┐             │
│        │                  │                  │             │
│        ▼                  ▼                  ▼             │
│   ┌─────────┐       ┌─────────┐        ┌─────────┐       │
│   │   N8N   │       │ Vercel  │        │ Gmail   │       │
│   │ (Logic) │       │ (Apps)  │        │ (SMTP)  │       │
│   └─────────┘       └─────────┘        └─────────┘       │
│        │                  │                                 │
│        └──────────────────┼─────────────────────┐          │
│                           │                     │          │
│                    ┌──────▼──────────┐          │          │
│                    │ Apps Deployed   │          │          │
│                    ├─────────────────┤          │          │
│                    │ • CRM Dashboard │◄─────────┘          │
│                    │ • Booking App   │                     │
│                    │ • Printer App   │                     │
│                    │ • Signature App │                     │
│                    └─────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## STEG 1: Supabase Setup (Cloud)

### 1.1 Skapa Supabase projekt
1. Gå till https://supabase.com
2. Skapa nytt projekt
3. Välj region (EU rekommenderas för GDPR)
4. Notera:
   - **Project URL** (ditt_projekt.supabase.co)
   - **Anon Key** (public, safe för frontend)
   - **Service Role Key** (secret, för backend endast!)

### 1.2 Kör alla SQL-skript i denna ordning

Gå till Supabase SQL Editor och kör:

```sql
-- Kör dessa i ordning:
1. CREATE_BOOKING_NOTES_TABLE.sql
2. CREATE_BOOKING_TASKS_TABLE.sql
3. CREATE_COMMENT_TO_TASK_TRIGGER.sql
4. CREATE_WAREHOUSE_TASKS_TRIGGER.sql
5. RETROACTIVE_CREATE_WAREHOUSE_TASKS.sql
6. CREATE_PRINTER_VIEW.sql
7. AUTO_CREATE_BOOKING_TASKS_FOR_EXISTING.sql
```

### 1.3 Konfigurера Auth
1. Gå till Auth > Providers
2. Aktivera Email/Password
3. Konfigurerea email templates för reset, etc.

### 1.4 Skapa Storage-buckets
1. Storage > Buckets
2. Skapa: `booking-wrapping-images` (public)
3. Skapa: `signatures` (public)
4. Ställ in RLS policies

### 1.5 Environment Variables för Supabase

```env
# .env.local för alla appar
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (public key)

# Endast för backend/API routes
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (secret key - LAGRA SÄKERT!)
```

---

## STEG 2: N8N Setup (Self-Hosted eller Cloud)

### 2.1 N8N Installation & Konfiguration

**Option A: Self-Hosted (rekommenderas för kontroll)**

```bash
# Docker installation
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/root/.n8n \
  -e N8N_HOST=your-domain.com \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=https \
  -e NODE_ENV=production \
  n8nio/n8n
```

**Option B: N8N Cloud**
- Gå till https://app.n8n.cloud
- Skapa konto
- Mindre kontroll men enklare setup

### 2.2 N8N Environment Variables

```env
# .env i N8N
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=your_username
N8N_BASIC_AUTH_PASSWORD=strong_password

# Webhook URL (för Supabase webhooks)
N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook
```

### 2.3 N8N Workflows att importera

Gå till N8N > Workflows > Import from URL/File

```
Workflows att konfigureras:
1. 01-email-classification.json (AI agent för inkommande emails)
2. 02-quotation-generation.json (Skapa offert)
3. BOOKING-CONFIRMATION-EMAIL.json (Skicka bokningsbekräftelse)
```

### 2.4 N8N Credentials Setup

I N8N > Credentials, lägg till:

**Gmail OAuth2**
- Scope: `https://www.googleapis.com/auth/gmail.send`
- Callback URL: `https://n8n.your-domain.com/rest/oauth2-callback/gmail`

**Supabase**
- URL: `https://[your-project].supabase.co`
- API Key: Din anon key

**OpenAI**
- API Key: Din OpenAI API nyckel

### 2.5 Ngrok för lokal testning (ej production!)

```bash
# Installera ngrok
brew install ngrok  # macOS
# eller Windows: scoop install ngrok

# Starta ngrok
ngrok http 5678

# Kopiera URL från output, t.ex: https://abc123.ngrok-free.dev
```

---

## STEG 3: Vercel Deployment (CRM Dashboard)

### 3.1 CRM Dashboard (`crm-dashboard/`)

```bash
# 1. Installera Vercel CLI
npm i -g vercel

# 2. Logga in
vercel login

# 3. Deploya
cd crm-dashboard
vercel

# 4. Eller länka befintligt projekt
vercel link
vercel deploy --prod
```

### 3.2 Vercel Environment Variables

I Vercel Project Settings > Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Backend (API routes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3.3 Custom Domain för CRM

```
Vercel Project > Settings > Domains
Lägg till: crm.eventgaraget.se (eller ditt domän)

DNS CNAME:
crm.eventgaraget.se → cname.vercel.com
```

### 3.4 Production URL
```
https://crm.eventgaraget.se
```

---

## STEG 4: Vercel Deployment (Booking Details App)

### 4.1 Booking App (`booking-details-app/`)

```bash
cd booking-details-app
vercel

# Välj:
- Project name: eventgaraget-booking
- Framework: Next.js
- Root directory: ./
```

### 4.2 Booking App Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
PORT=3002  # ej nödvändig på Vercel
```

### 4.3 Booking App Domain

```
Domän: booking.eventgaraget.se
```

### 4.4 Production URL
```
https://booking.eventgaraget.se/booking/[token]
```

---

## STEG 5: Vercel Deployment (Signature App)

### 5.1 Signature App (`signature-app/`)

```bash
cd signature-app
vercel

# Välj:
- Project name: eventgaraget-signature
```

### 5.2 Signature App Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5.3 Signature App Domain

```
Domän: signature.eventgaraget.se
```

---

## STEG 6: Supabase Webhooks Setup

### 6.1 Webhook för Booking Confirmation

```
Supabase > Database > Webhooks > Create
Lägg till webhook:

Tabell: booking_confirmations
Event: INSERT
HTTP method: POST
URL: https://n8n.your-domain.com/webhook/booking-confirmation

Headers:
Authorization: Bearer [din-n8n-auth-token]
```

### 6.2 Webhook för Email Queue

```
Tabell: outgoing_emails
Event: INSERT
URL: https://n8n.your-domain.com/webhook/send-email

Trigger: När status = "pending"
```

---

## STEG 7: DNS Configuration

### 7.1 DNS Records (hos din registrar, t.ex. Namecheap, GoDaddy)

```
A/CNAME Records:
───────────────

crm.eventgaraget.se          CNAME  → cname.vercel.com
booking.eventgaraget.se      CNAME  → cname.vercel.com
signature.eventgaraget.se    CNAME  → cname.vercel.com

n8n.eventgaraget.se          A      → [din server IP]
                             (eller CNAME till din host)

api.eventgaraget.se          CNAME  → cname.vercel.com (för API routes)
```

### 7.2 SSL Certificates

- **Vercel**: Automatisk SSL via Let's Encrypt ✅
- **N8N Self-Hosted**: Installera Certbot
  ```bash
  sudo certbot certonly --standalone -d n8n.eventgaraget.se
  ```

---

## STEG 8: Email Configuration (Gmail)

### 8.1 Gmail App Password (för n8n SMTP)

1. Aktivera 2FA på Gmail konto
2. Gå till https://myaccount.google.com/apppasswords
3. Skapa "App password" för "Mail" och "Windows Computer"
4. Kopiera 16-siffrig kod

### 8.2 N8N Gmail Setup

I N8N > Email node:
```
Host: smtp.gmail.com
Port: 587
User: your-email@gmail.com
Password: [16-siffrig app password]
Encryption: STARTTLS
```

---

## STEG 9: GitHub Integration (Optional men rekommenderat)

### 9.1 GitHub for CRM Dashboard

```bash
# 1. Skapa GitHub repo
# 2. Connect till Vercel
# 3. Automatic deployments på push till main

git remote add origin https://github.com/your-org/eventgaraget-crm.git
git push -u origin main
```

### 9.2 Vercel Auto-Deploy

```
Vercel > Settings > Git
Connected Repository: your-org/eventgaraget-crm
Production Branch: main

Varje push till main → automatisk deploy
```

---

## STEG 10: Environment Variables Summary

### CRM Dashboard (Vercel)
```env
# Public (safe)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Secret (server-only)
SUPABASE_SERVICE_ROLE_KEY=...
```

### Booking Details App (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### N8N (Self-Hosted)
```env
N8N_BASIC_AUTH_USER=...
N8N_BASIC_AUTH_PASSWORD=...
N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook
```

### Supabase (Cloud)
```
Database credentials stored securely in Supabase dashboard
API Keys: Anon & Service Role (never expose Service Role!)
```

---

## STEG 11: Deployment Checklist

### Pre-Deployment
- [ ] Alla SQL-skript körda i Supabase
- [ ] Environment variables konfigurerade
- [ ] N8N workflows importerade och testade
- [ ] Gmail credentials konfigurerade
- [ ] DNS records tillagda
- [ ] SSL certificates verifierade

### Deployment
- [ ] CRM Dashboard deployed till Vercel
- [ ] Booking App deployed till Vercel
- [ ] Signature App deployed till Vercel
- [ ] N8N körs och är tillgängligt
- [ ] Webhooks testade
- [ ] Email-flöde fungerar end-to-end

### Post-Deployment
- [ ] Testa inloggning
- [ ] Testa bokningsflöde
- [ ] Testa email-mottagning
- [ ] Testa n8n workflows
- [ ] Testa webhook-triggers
- [ ] Setup monitoring/logging

---

## STEG 12: Monitoring & Maintenance

### 12.1 Health Checks

```bash
# CRM Dashboard
curl https://crm.eventgaraget.se/api/health

# Booking App
curl https://booking.eventgaraget.se/api/health

# N8N
curl https://n8n.eventgaraget.se/api/health
```

### 12.2 Logging

**Vercel Logs:**
```
Vercel Dashboard > Project > Deployments > Logs
```

**N8N Logs:**
```
docker logs n8n
# eller i N8N Dashboard > Execution logs
```

**Supabase Logs:**
```
Supabase Dashboard > Database > Query Performance
```

### 12.3 Backup Strategy

**Supabase:**
```
Settings > Backups > Enable daily backups
```

**N8N:**
```
Backup /root/.n8n directory dagligen
```

---

## STEG 13: Scaling & Performance

### 13.1 Database Optimization

```sql
-- Lägg till indexes för ofta queryade fält
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_booking_notes_booking_id ON booking_notes(booking_id);
```

### 13.2 Vercel Performance

- Enable Edge Caching
- Enable ISR (Incremental Static Regeneration)
- Optimize images

### 13.3 N8N Performance

- Använd "Execute Once" för batch-operations
- Implementera retry-logic
- Använd error-handling nodes

---

## STEG 14: Security Best Practices

### 14.1 API Keys
```
❌ NEVER commit .env files
✅ Use Vercel/N8N secret management
✅ Rotate keys regularly
✅ Use different keys per environment
```

### 14.2 RLS (Row Level Security)
```
Supabase > Database > RLS
Aktivera RLS på alla tables
Skapa policies per role
```

### 14.3 CORS
```
Vercel > Settings > Environment Variables
Lägg till whitelist av allowed origins
```

---

## Troubleshooting

### "Webhook not found" i Supabase
```
→ Kontrollera N8N är uppe och körs
→ Kontrollera webhook URL är korrekt
→ Kontrollera firewall tillåter inbound
```

### "CORS Error" vid API calls
```
→ Kontrollera NEXT_PUBLIC_SUPABASE_URL
→ Kontrollera RLS policies
→ Kontrollera headers i Supabase
```

### "Authentication failed"
```
→ Kontrollera Supabase API keys
→ Kontrollera Auth provider konfiguration
→ Kontrollera email verification status
```

### N8N "Connection timeout"
```
→ Kontrollera DNS resolution
→ Kontrollera SSL certificate
→ Kontrollera firewall regler
```

---

## Support & Monitoring URLs

```
Supabase Dashboard:     https://app.supabase.com
Vercel Dashboard:       https://vercel.com/dashboard
N8N Dashboard:          https://n8n.eventgaraget.se
Gmail Settings:         https://myaccount.google.com
```

---

## Nästa steg efter initial deployment

1. **Monitoring:** Setup error tracking (Sentry)
2. **Analytics:** Setup analytics (Vercel Analytics)
3. **Backups:** Automiska databas-backups
4. **CDN:** Implementera CDN för static assets
5. **Load Testing:** Test max concurrent users
6. **Security Audit:** Köra security scan

---

**Skapad:** 2026-01-14
**Senast uppdaterad:** 2026-01-14
