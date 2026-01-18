# EventGaraget - Booking & Reception System
## Complete Project Plan v2.0

**Status:** 🚀 Full System Rebuild  
**Last Updated:** October 2025  
**Version:** 2.0

---

## 📋 Executive Summary

EventGaraget is building an AI-powered booking and reception system for party equipment rentals. The system handles customer inquiries via email, generates quotations, manages signatures, and provides a complete CRM interface for staff to manage bookings and customer relationships.

### Core Components:
1. **AI Receptionist** - n8n automation handling email communication
2. **Quotation System** - PDF generation + digital signature verification
3. **CRM Dashboard** - Complete customer management interface
4. **Signature App** - Digital signing of quotations
5. **Supabase Backend** - Data persistence and real-time sync

---

## 🎯 Project Goals

### Phase 1: Foundation (Week 1)
- ✅ Clean project structure
- ✅ Supabase schema redesign
- ✅ Core n8n workflows
- ✅ Basic CRM dashboard

### Phase 2: Features (Week 2)
- ✅ Advanced filtering and search
- ✅ Reminders and follow-ups
- ✅ Analytics dashboard
- ✅ Multi-user support

### Phase 3: Polish (Week 3)
- ✅ Performance optimization
- ✅ Security hardening
- ✅ User documentation
- ✅ Deployment & monitoring

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      External Systems                            │
│  Gmail API | Google Sheets | Supabase | OpenAI | SignaturePad  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   n8n Automation Layer                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Workflow A: Email Classification & Routing             │   │
│  │ Workflow B: Quotation Generation & Delivery            │   │
│  │ Workflow C: Escalation & Human Handoff                 │   │
│  │ Workflow D: Reminders & Follow-ups                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
│  ┌──────────────┬─────────────┬──────────────┬──────────────┐  │
│  │  Customers   │  Quotations │   Bookings   │ Conversations│  │
│  │  Messages    │ Escalations │  Reminders   │   Products   │  │
│  └──────────────┴─────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ↓                           ↓                    ↓
    ┌────────────┐         ┌──────────────┐      ┌─────────────┐
    │ CRM        │         │  Signature   │      │ Analytics   │
    │ Dashboard  │         │  App         │      │ Dashboard   │
    │ (Next.js)  │         │  (Next.js)   │      │ (Next.js)   │
    └────────────┘         └──────────────┘      └─────────────┘
```

---

## 📁 Project Structure

```
/Eventgaraget
├── /docs
│   ├── PROJECT_PLAN.md (this file)
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── SUPABASE_SCHEMA.md
│   ├── N8N_WORKFLOWS.md
│   └── FRONTEND_SPECS.md
├── /supabase
│   ├── schema.sql (master schema)
│   ├── seed.sql (sample data)
│   └── migrations/
├── /workflows
│   ├── 01-email-classification.json
│   ├── 02-quotation-generation.json
│   ├── 03-escalation-handler.json
│   └── 04-reminders.json
├── /crm-dashboard
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── customers/
│   │   ├── bookings/
│   │   ├── conversations/
│   │   └── settings/
│   ├── components/
│   ├── lib/
│   └── package.json
├── /signature-app
│   ├── app/
│   ├── components/
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🔄 Data Flow - Step by Step

### 1️⃣ Email Reception
```
Customer Email
    ↓
Gmail Trigger (n8n)
    ↓
Extract: From, Subject, Body, Thread ID
    ↓
Fetch Customer History
    ↓
Extract: Products, Questions, Customer Info
```

### 2️⃣ AI Classification
```
AI Orchestrator analyzes email
    ↓
Classifies into:
  • booking_request → Create Quotation
  • support_question → Answer FAQ
  • price_inquiry → Send Price List
  • complaint → Escalate to Human
    ↓
Route to appropriate handler
```

### 3️⃣ Quotation Generation
```
AI generates quotation
    ↓
Create PDF with variables (company_name, total_price, products)
    ↓
Generate unique signature token
    ↓
Save to Supabase: quotations table
    ↓
Send email with signature link + embedded quotation data
    ↓
Customer receives: [View Quotation] → [Sign & Confirm]
```

### 4️⃣ Digital Signing
```
Customer clicks link
    ↓
Signature App loads quotation
    ↓
Customer fills: Company Name, Contact Person, Date
    ↓
Customer draws signature
    ↓
Submit → POST to Supabase
    ↓
Mark quotation as: signed_at timestamp
    ↓
Create booking record
    ↓
Send confirmation email to customer
    ↓
Notify staff in CRM
```

### 5️⃣ Escalation (Fallback)
```
If AI confidence < 60%
    ↓
Create escalation record
    ↓
Mark conversation as: human_required
    ↓
Staff sees in CRM: [Pending Response]
    ↓
Staff responds directly to customer
    ↓
n8n learns from response
    ↓
Log feedback to improve AI
```

### 6️⃣ Reminders & Follow-ups
```
Unsigned quotations after 2 days
    ↓
Send reminder email
    ↓
Unsigned quotations after 7 days
    ↓
Escalate to staff
    ↓
Delivery date minus 2 days
    ↓
Send delivery reminder
    ↓
Post-delivery
    ↓
Send follow-up survey
```

---

## 📱 Frontend Specifications

### CRM Dashboard (`/crm-dashboard`)
**Route:** `https://crm.eventgaraget.se`

#### Pages:
1. **Dashboard** (`/`)
   - Overview cards (Active Bookings, Pending Quotations, Today's Deliveries)
   - Calendar view of upcoming events
   - Recent conversations widget
   - Staff statistics

2. **Customers** (`/customers`)
   - Customer list with filtering/search
   - Customer detail card:
     - Contact information
     - Booking history
     - Total revenue
     - Preferred products
     - Communication history
     - Quick action buttons

3. **Bookings** (`/bookings`)
   - Calendar view (month/week/day)
   - Booking details side panel
   - Filter by status (draft, pending, confirmed, completed)
   - Create manual booking

4. **Conversations** (`/conversations`)
   - Email thread list
   - Thread viewer with full history
   - Reply box (sends via n8n)
   - Mark as resolved/escalated
   - Conversation search

5. **Escalations** (`/escalations`)
   - List of pending escalations
   - Escalation detail
   - Response box
   - Learning feedback form

6. **Products** (`/products`)
   - Product catalog
   - Inventory status
   - Pricing
   - Edit product details

7. **Settings** (`/settings`)
   - Team management
   - Email templates
   - Automation rules
   - Integration settings

### Signature App (`/signature-app`)
**Route:** `https://sign.eventgaraget.se/sign/[token]`

#### Pages:
1. **Quotation View** (`/sign/[token]`)
   - Display quotation with products, pricing, terms
   - Customer form:
     - Company name (pre-filled if known)
     - Contact person name
     - Date
     - Signature canvas
   - Terms & conditions checkbox
   - [Sign & Confirm Booking] button

2. **Success Page** (`/sign/[token]/success`)
   - Confirmation message
   - Booking number
   - Download signed PDF
   - Calendar add buttons (iCal, Google)

---

## 🤖 n8n Workflows

### Workflow 1: Email Classification & Routing
**File:** `01-email-classification.json`

**Triggers:**
- New email in Gmail INBOX

**Steps:**
1. Extract email data (from, to, subject, body, thread_id)
2. Fetch customer history from Supabase
3. AI Orchestrator: Extract products, questions, sentiment
4. Validate products against catalog
5. Classify intent (booking/support/price/complaint)
6. Route:
   - `booking_request` → Workflow 2
   - `support_question` → Answer FAQ, send email
   - `price_inquiry` → Send price list
   - `complaint` → Workflow 3 (Escalation)

**Confidence threshold:** If < 60% → Escalate to human

---

### Workflow 2: Quotation Generation & Sending
**File:** `02-quotation-generation.json`

**Input:** Classification result with valid booking request

**Steps:**
1. AI generates quotation details (products, pricing, terms)
2. Generate unique signature token (UUID)
3. Save quotation to Supabase:
   - `quotations` table
   - Status: `pending_signature`
   - Token stored
4. Generate signature link: `https://sign.eventgaraget.se/sign/[token]`
5. Compose HTML email with:
   - Greeting
   - Quotation summary
   - [View & Sign Quotation] button
   - Terms of service link
6. Send email
7. Create log entry in `conversations` table

---

### Workflow 3: Escalation Handler
**File:** `03-escalation-handler.json`

**Triggers:**
- Classification confidence < 60%
- Customer complaint detected
- Manual escalation from CRM

**Steps:**
1. Create escalation record in Supabase
2. Notify staff via email (with CRM link)
3. Mark conversation as `human_required`
4. Wait for staff response (max 24h)
5. When staff replies:
   - Log response
   - Extract feedback
   - Update AI training data
   - Send to customer
6. Mark as resolved

---

### Workflow 4: Reminders & Follow-ups
**File:** `04-reminders.json`

**Scheduled:** Every 6 hours

**Steps:**
1. Find unsigned quotations older than 2 days
   - Send reminder email
2. Find unsigned quotations older than 7 days
   - Escalate to human
3. Find confirmed bookings with delivery in 2 days
   - Send delivery reminder
4. Find completed bookings
   - Send follow-up survey (once per booking)

---

## 📊 Supabase Database Schema

### Core Tables:
- `customers` - Customer records
- `quotations` - Generated quotations (with signature tokens)
- `bookings` - Confirmed bookings
- `booking_items` - Line items in bookings
- `conversations` - Email threads
- `messages` - Individual emails
- `escalations` - Human escalations
- `reminders` - Scheduled reminders
- `products` - Product catalog
- `ai_analytics` - Track AI performance

**See:** `SUPABASE_SCHEMA.md` for detailed schema

---

## 🔐 Security & Compliance

- [ ] All customer data encrypted at rest
- [ ] HTTPS only communication
- [ ] JWT-based authentication for CRM
- [ ] Role-based access control (RBAC)
- [ ] Audit logging for all changes
- [ ] GDPR compliance (data deletion, export)
- [ ] PII masking in logs
- [ ] Rate limiting on APIs

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| Email response time | < 2 minutes |
| Quotation generation accuracy | > 95% |
| Customer signature rate (2 days) | > 80% |
| AI classification accuracy | > 90% |
| Escalation rate | < 10% |
| Customer satisfaction | > 4.5/5 |
| System uptime | > 99.5% |

---

## 🚀 Deployment

### Development
- Local n8n instance with Docker
- Local Supabase instance
- Next.js dev server

### Production
- n8n Cloud or Self-hosted
- Supabase Cloud
- Vercel for CRM & Signature App
- CloudFlare CDN

---

## 📞 Support & Escalation

For issues:
1. Check Supabase logs
2. Check n8n execution history
3. Contact: [support email]

---

**Next Steps:**
1. ✅ Create detailed Supabase schema
2. ✅ Build n8n workflows
3. ✅ Create CRM dashboard
4. ✅ Implement signature app
5. ✅ End-to-end testing
6. ✅ Deploy to production
