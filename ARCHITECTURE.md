# EventGaraget - System Architecture & Deployment Guide

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERNET / CLIENT BROWSERS                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────┐         ┌──────────────────────────┐      │
│  │   CRM DASHBOARD         │         │   SIGNATURE APP          │      │
│  │   (Admin Interface)     │         │   (Customer Portal)      │      │
│  │   Next.js + React 18    │         │   Next.js + React 18     │      │
│  │   TypeScript + Tailwind │         │   TypeScript + Tailwind  │      │
│  │   Port: 3001            │         │   Port: 3000             │      │
│  │                         │         │                          │      │
│  │ Features:              │         │ Features:               │      │
│  │ • Booking Management   │         │ • Signature Capture    │      │
│  │ • Customer Portal      │         │ • Document Review      │      │
│  │ • Calendar             │         │ • Agreement Display    │      │
│  │ • Analytics/Reports    │         │ • Status Updates       │      │
│  │ • User Management      │         │ • Confirmation        │      │
│  │ • Product Management   │         │ • PDF Export          │      │
│  └──────────────┬──────────┘         └──────────────┬─────────┘      │
│                 │                                   │                 │
│                 └───────────────────┬───────────────┘                 │
│                                     │                                 │
└─────────────────────────────────────┼─────────────────────────────────┘
                                      │ HTTPS REST API
                                      │ WebSocket (Real-time)
        ┌─────────────────────────────┴──────────────────────────┐
        │                                                        │
        ▼                                                        ▼
┌─────────────────────────────────┐          ┌──────────────────────────┐
│     SUPABASE BACKEND            │◄────────►│   n8n WORKFLOWS          │
│   (Firebase Alternative)        │  REST API│   (Automation Engine)    │
├─────────────────────────────────┤          ├──────────────────────────┤
│                                 │          │                          │
│ 🔐 AUTHENTICATION              │          │ 🤖 AI INTEGRATION        │
│ ├─ JWT Tokens                  │          │ ├─ OpenAI GPT-4         │
│ ├─ Email/Password Auth         │          │ ├─ Conversation Memory  │
│ ├─ Session Management          │          │ └─ Tool Calling         │
│ └─ RLS Policies                │          │                          │
│                                 │          │ 📧 EMAIL AUTOMATION     │
│ 💾 DATABASE (PostgreSQL)       │          │ ├─ SMTP Integration     │
│ ├─ Customers (Multi-field)     │          │ ├─ Template System      │
│ ├─ Bookings & Quotations       │          │ └─ Response Generation  │
│ ├─ Products & Addons           │          │                          │
│ ├─ Calendar & Events           │          │ 🔔 NOTIFICATIONS        │
│ ├─ Messages & Conversations    │          │ ├─ Email Alerts         │
│ ├─ User Profiles & Roles       │          │ ├─ Status Updates       │
│ └─ Audit Logs                  │          │ └─ Reminders            │
│                                 │          │                          │
│ 📦 STORAGE (S3-Compatible)    │          │ 📋 DOCUMENT PROCESSING  │
│ ├─ Contract PDFs               │          │ ├─ PDF Generation       │
│ ├─ Signatures                  │          │ ├─ Document Signing     │
│ ├─ Customer Documents          │          │ └─ Archive Management   │
│ └─ Media Assets                │          │                          │
│                                 │          │ 🔗 WEBHOOK HANDLING     │
│ 🔄 REAL-TIME SUBSCRIPTIONS    │          │ ├─ Signature Events     │
│ ├─ Live Data Updates           │          │ ├─ Booking Updates      │
│ ├─ Presence Tracking           │          │ └─ Notification Dispatch
│ └─ Broadcast Channels          │          │                          │
│                                 │          │ 📊 DATA PROCESSING      │
│ 🌐 REST API (Auto-generated)  │          │ ├─ Status Updates       │
│ ├─ CRUD Operations             │          │ ├─ Calculations        │
│ ├─ Filtering & Sorting         │          │ └─ Logging              │
│ └─ Pagination                  │          │                          │
│                                 │          │ 🚀 EXECUTION           │
│ 🔑 API MANAGEMENT             │          │ ├─ Local Docker Dev     │
│ ├─ Anon Key (Public)           │          │ ├─ n8n Cloud Prod      │
│ ├─ Service Key (Private)       │          │ └─ ngrok Tunneling     │
│ └─ Custom Claims               │          │                          │
│                                 │          │ 📈 MONITORING          │
│ 🛡️ SECURITY                   │          │ ├─ Error Tracking      │
│ ├─ Row Level Security          │          │ ├─ Performance Logging │
│ ├─ Encryption at Rest          │          │ └─ Activity Audit      │
│ ├─ SSL/TLS in Transit          │          │                          │
│ └─ User Role-Based Access      │          │                          │
│                                 │          │                          │
│ 🔔 WEBHOOKS INCOMING          │          │ NODES USED:             │
│ ├─ Signature Events            │          │ ├─ HTTP Request        │
│ ├─ Database Triggers           │          │ ├─ Code Node           │
│ ├─ Status Updates              │          │ ├─ Supabase Node       │
│ └─ Custom Events               │          │ ├─ Email Node          │
│                                 │          │ ├─ OpenAI Node         │
│ ⚡ PERFORMANCE                 │          │ ├─ Webhook Node        │
│ ├─ Connection Pool: 50         │          │ ├─ Conditional Logic   │
│ ├─ Query Optimization: Indexed │          │ └─ Transform Node      │
│ ├─ Response Time: <200ms       │          │                          │
│ └─ Uptime SLA: 99.9%           │          │ WORKFLOWS:              │
│                                 │          │ ├─ Main Booking Agent  │
│                                 │          │ ├─ Signature Webhook   │
│                                 │          │ ├─ Email Handler       │
│                                 │          │ ├─ Calendar Sync       │
│                                 │          │ └─ Notification Queue  │
└────────────┬────────────────────┘          └────────────┬────────────┘
             │                                            │
             │         ┌──────────────────────────────────┘
             │         │
             ▼         ▼
        ┌────────────────────────────────────────┐
        │   EXTERNAL SERVICES                   │
        ├────────────────────────────────────────┤
        │                                        │
        │ 📧 EMAIL SERVICE                      │
        │ └─ Gmail API / SMTP Server             │
        │    ├─ Booking Confirmations           │
        │    ├─ Quotation Links                 │
        │    ├─ Status Updates                  │
        │    └─ Team Notifications              │
        │                                        │
        │ 🤖 AI SERVICE                         │
        │ └─ OpenAI (GPT-4)                     │
        │    ├─ Natural Language Processing     │
        │    ├─ Response Generation             │
        │    ├─ Context Understanding           │
        │    └─ Multi-language Support          │
        │                                        │
        │ 📱 SMS SERVICE (Optional)             │
        │ └─ Twilio / Nexmo                     │
        │    ├─ Booking Reminders               │
        │    ├─ Delivery Updates                │
        │    └─ Two-Factor Authentication       │
        │                                        │
        │ 💳 PAYMENT SERVICE (Optional)         │
        │ └─ Stripe / Klarna                    │
        │    ├─ Payment Processing              │
        │    ├─ Invoice Generation              │
        │    └─ Subscription Management         │
        │                                        │
        │ 📅 CALENDAR SERVICE (Optional)        │
        │ └─ Google Calendar / Outlook          │
        │    ├─ Event Synchronization           │
        │    ├─ Availability Checking           │
        │    └─ Team Scheduling                 │
        │                                        │
        │ 📊 ANALYTICS (Optional)               │
        │ └─ Google Analytics / Mixpanel        │
        │    ├─ User Behavior Tracking          │
        │    ├─ Conversion Metrics              │
        │    └─ Custom Event Logging            │
        │                                        │
        └────────────────────────────────────────┘
```

---

## 🗂️ File Structure Overview

```
EventGaraget/
│
├─ 📱 crm-dashboard/              (Admin Dashboard)
│  ├─ app/
│  │  ├─ dashboard/               (Main CRM Interface)
│  │  │  ├─ page.tsx              (Dashboard Home)
│  │  │  ├─ bookings/             (Booking Management)
│  │  │  ├─ customers/            (Customer Portal)
│  │  │  ├─ calendar/             (Calendar View)
│  │  │  ├─ products/             (Product Management)
│  │  │  ├─ addons/               (Add-ons Management)
│  │  │  ├─ users/                (User Management)
│  │  │  ├─ settings/             (System Settings)
│  │  │  ├─ invoices/             (Invoice Management)
│  │  │  └─ activity-log/         (Audit Logs)
│  │  ├─ components/              (Reusable Components)
│  │  │  ├─ Sidebar.tsx           (Navigation)
│  │  │  ├─ TopBar.tsx            (Top Navigation)
│  │  │  └─ [other components]
│  │  ├─ lib/                     (Utilities)
│  │  │  ├─ supabase.ts           (DB Client)
│  │  │  └─ types.ts              (TypeScript Defs)
│  │  └─ globals.css              (Global Styles)
│  │
│  ├─ public/                     (Static Assets)
│  │  └─ logo.png
│  │
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tailwind.config.js
│  ├─ next.config.js
│  └─ .env.local                  (Environment Vars)
│
├─ 🖊️ signature-app/               (Signature Capture)
│  ├─ app/
│  │  ├─ sign/
│  │  │  ├─ [token]/
│  │  │  │  ├─ page.tsx           (Signature Page)
│  │  │  │  └─ success/
│  │  │  │     └─ page.tsx        (Success Page)
│  │  │  └─ layout.tsx
│  │  ├─ page.tsx                 (Landing)
│  │  ├─ layout.tsx               (Root Layout)
│  │  └─ globals.css
│  │
│  ├─ public/
│  │  └─ logo.png
│  │
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tailwind.config.js
│  ├─ next.config.js
│  └─ .env.local
│
├─ 🤖 workflows/                   (n8n Automation)
│  ├─ EventGaraget - Main Booking Agent Prod.json
│  ├─ signature-webhook.json
│  ├─ INVOICE_NODES.json
│  ├─ NEW_NODES_AVAILABILITY_WRAPPING.json
│  └─ [other workflows]
│
├─ 💾 supabase/                    (Database Schemas)
│  ├─ schema.sql                  (Main Schema)
│  ├─ schema-v2.sql               (Updated Schema)
│  ├─ quotation-schema.sql        (Quotation Tables)
│  ├─ additional-tables.sql       (Extra Tables)
│  ├─ inventory-system.sql        (Inventory)
│  ├─ CALENDAR_SETUP.sql          (Calendar Tables)
│  ├─ MIGRATE_ADDON_SYSTEM.sql    (Addon Migration)
│  ├─ ADD_SHIPPING_COST.sql       (New Columns)
│  └─ [other SQL migrations]
│
├─ 🐳 docker-compose.yml          (Local Dev Environment)
│
├─ 📚 Documentation/
│  ├─ TECH_STACK.md               (This File - Tech Details)
│  ├─ ARCHITECTURE.md             (System Architecture)
│  ├─ README.md                   (Overview)
│  ├─ SETUP_GUIDE.md              (Installation)
│  ├─ QUICK_START.md              (Getting Started)
│  ├─ API_REFERENCE.md            (API Documentation)
│  ├─ DEPLOYMENT.md               (Deployment Guide)
│  └─ TROUBLESHOOTING.md          (Common Issues)
│
├─ 📋 scripts/                     (Automation Scripts)
│  ├─ deploy.sh                   (Deployment)
│  ├─ backup.sh                   (Database Backup)
│  └─ test-workflow.sh            (Workflow Testing)
│
├─ .gitignore
├─ .env.example
└─ .github/
   └─ workflows/
      └─ deploy.yml               (CI/CD Pipeline)
```

---

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────────────────────────────────┐
│      LOCAL DEVELOPMENT MACHINE          │
├─────────────────────────────────────────┤
│                                         │
│  Docker Containers:                    │
│  ├─ Supabase (Port 8000, 5432)        │
│  ├─ n8n (Port 5678)                    │
│  ├─ PostgreSQL (Port 5432)            │
│  └─ Redis (Port 6379)                  │
│                                         │
│  Next.js Dev Servers:                  │
│  ├─ CRM Dashboard (Port 3001)          │
│  └─ Signature App (Port 3000)          │
│                                         │
│  Tools:                                 │
│  ├─ VS Code / WebStorm                 │
│  ├─ Git / GitHub                       │
│  ├─ Postman (API Testing)              │
│  └─ pgAdmin (DB Management)            │
│                                         │
└─────────────────────────────────────────┘
```

### Production Environment
```
┌──────────────────────────────────────────────────────────────┐
│               PRODUCTION DEPLOYMENT                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  VERCEL / NETLIFY (Frontend Hosting)               │   │
│  │  ├─ CRM Dashboard (crm.eventgaraget.se)            │   │
│  │  ├─ Signature App (sign.eventgaraget.se)           │   │
│  │  ├─ Auto-deployment on Git Push                    │   │
│  │  ├─ CDN Global Distribution                        │   │
│  │  ├─ SSL/TLS Certificates                          │   │
│  │  └─ DDoS Protection                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SUPABASE CLOUD (Backend)                          │   │
│  │  ├─ PostgreSQL Database (Managed)                  │   │
│  │  ├─ Authentication (JWT + OAuth)                   │   │
│  │  ├─ Storage (S3-Compatible, CDN)                   │   │
│  │  ├─ Real-time Subscriptions (WebSocket)            │   │
│  │  ├─ Automated Daily Backups                        │   │
│  │  ├─ Point-in-Time Recovery                         │   │
│  │  ├─ SSL/TLS Encryption                             │   │
│  │  ├─ 99.9% Uptime SLA                               │   │
│  │  └─ DDoS + SQL Injection Protection                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  n8n CLOUD (Workflows & Automation)                │   │
│  │  ├─ Workflow Execution Engine                      │   │
│  │  ├─ OpenAI Integration (GPT-4)                     │   │
│  │  ├─ Email Service Integration                      │   │
│  │  ├─ Webhook Handling                               │   │
│  │  ├─ Execution Logs & Monitoring                    │   │
│  │  ├─ Error Handling & Retry Logic                   │   │
│  │  └─ Custom Script Execution                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  EXTERNAL SERVICES                                 │   │
│  │  ├─ OpenAI (GPT-4 API)                            │   │
│  │  ├─ Gmail / SMTP (Email Delivery)                 │   │
│  │  ├─ Twilio (SMS - Optional)                       │   │
│  │  ├─ Stripe (Payments - Optional)                  │   │
│  │  └─ Google Calendar (Sync - Optional)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MONITORING & LOGGING                              │   │
│  │  ├─ Sentry (Error Tracking)                        │   │
│  │  ├─ LogRocket (Session Replay)                     │   │
│  │  ├─ Datadog (Performance Monitoring)               │   │
│  │  ├─ CloudWatch (AWS Logs)                          │   │
│  │  └─ Custom Analytics Dashboard                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SECURITY & COMPLIANCE                             │   │
│  │  ├─ SSL/TLS Everywhere                             │   │
│  │  ├─ WAF (Web Application Firewall)                 │   │
│  │  ├─ GDPR Compliance                                │   │
│  │  ├─ OWASP Security Standards                       │   │
│  │  ├─ Regular Security Audits                        │   │
│  │  └─ Penetration Testing                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### Booking Creation Flow
```
Customer Email
     │
     ▼
┌─────────────────────┐
│  n8n Email Trigger  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────┐
│ Parse Email with AI (GPT-4) │
│ ├─ Extract booking dates    │
│ ├─ Extract products         │
│ ├─ Extract location         │
│ └─ Extract customer info    │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Query Supabase                      │
│ ├─ Get product availability         │
│ ├─ Get customer history             │
│ ├─ Check pricing                    │
│ └─ Get current promotions           │
└─────────┬───────────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Generate AI Response         │
│ ├─ Create personalized quote │
│ ├─ Generate signing link     │
│ └─ Format email              │
└─────────┬──────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Create Quotation in Supabase │
│ ├─ Save to quotations table  │
│ ├─ Generate signature token  │
│ └─ Store metadata            │
└─────────┬──────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Send Email Reply             │
│ ├─ Include quote summary     │
│ ├─ Signing link             │
│ └─ Company branding         │
└─────────┬──────────────────┘
          │
          ▼
Customer Receives Email + Signs Quotation
```

### Signature & Booking Confirmation Flow
```
Customer Signs Quotation
     │
     ▼
┌────────────────────────┐
│ Signature Webhook      │
│ (Signature App → n8n)  │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────────────────┐
│ n8n Webhook Handler                │
│ ├─ Validate Signature              │
│ ├─ Extract Signature Data          │
│ ├─ Get Booking Details             │
│ └─ Log Signature Event             │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│ Update Supabase                    │
│ ├─ Update quotation status         │
│ ├─ Set contract_signed = true      │
│ ├─ Save signature image            │
│ └─ Record timestamp                │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│ Generate PDF                       │
│ ├─ Create contract PDF             │
│ ├─ Add signature image             │
│ ├─ Include quotation details       │
│ └─ Upload to Storage               │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│ Create Booking Record              │
│ ├─ Convert quotation to booking    │
│ ├─ Set initial status = draft      │
│ ├─ Generate booking number         │
│ └─ Store all details               │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│ Send Confirmation Emails           │
│ ├─ Notify customer (PDF attached)  │
│ ├─ Notify team (new booking alert) │
│ ├─ Update CRM notifications        │
│ └─ Schedule reminders              │
└──────────┬─────────────────────────┘
           │
           ▼
CRM Dashboard Updated in Real-time
Team Reviews & Approves Booking
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🌐 NETWORK LAYER                                           │
│ ├─ HTTPS/TLS Encryption (All Traffic)                     │
│ ├─ SSL Certificates (Let's Encrypt / Managed)             │
│ ├─ WAF (Web Application Firewall)                         │
│ ├─ DDoS Protection (Cloudflare / AWS Shield)              │
│ ├─ IP Whitelisting (n8n API Access)                       │
│ └─ VPN Support (Team Access)                              │
│                                                             │
│ 🔐 AUTHENTICATION LAYER                                    │
│ ├─ JWT Token Authentication                               │
│ ├─ Email/Password with Hashing (bcrypt)                   │
│ ├─ Session Management (Supabase Sessions)                 │
│ ├─ OAuth 2.0 Support (Google, GitHub)                     │
│ ├─ Multi-Factor Authentication (MFA) - Optional           │
│ └─ Token Expiration & Refresh Logic                       │
│                                                             │
│ 🗂️ DATABASE LAYER                                          │
│ ├─ Row Level Security (RLS) Policies                      │
│ ├─ Column-Level Encryption (Sensitive Data)               │
│ ├─ Data Encryption at Rest (AES-256)                      │
│ ├─ Encrypted Connections (SSL/TLS)                        │
│ ├─ Automatic Backups (Daily + Point-in-time)              │
│ ├─ Access Control Lists (ACLs)                            │
│ └─ Audit Logging (All Changes Tracked)                    │
│                                                             │
│ 🔑 API LAYER                                               │
│ ├─ API Key Rotation (Regular)                             │
│ ├─ Rate Limiting (1000 requests/min)                      │
│ ├─ CORS Policy Enforcement                                │
│ ├─ CSRF Protection (Token Validation)                     │
│ ├─ Input Validation & Sanitization                        │
│ ├─ SQL Injection Prevention (Parameterized Queries)       │
│ └─ Error Handling (No Sensitive Data in Errors)           │
│                                                             │
│ 👤 APPLICATION LAYER                                       │
│ ├─ Role-Based Access Control (RBAC)                       │
│ ├─ Permission-Based Authorization                         │
│ ├─ User Roles (Admin, Manager, Warehouse, Support)        │
│ ├─ Data Isolation per Organization                        │
│ ├─ Activity Logging & Audit Trail                         │
│ ├─ Session Timeout (Auto-logout)                          │
│ └─ Password Requirements (Complexity Rules)               │
│                                                             │
│ 📋 COMPLIANCE & STANDARDS                                  │
│ ├─ GDPR Compliance                                        │
│ ├─ CCPA Compliance                                        │
│ ├─ OWASP Top 10 Protection                                │
│ ├─ SOC 2 Type II Certified                                │
│ ├─ ISO 27001 Standards                                    │
│ ├─ PCI DSS (For Payment Processing)                       │
│ └─ Regular Penetration Testing                            │
│                                                             │
│ 🔍 MONITORING & LOGGING                                    │
│ ├─ Real-time Security Monitoring                          │
│ ├─ Intrusion Detection System (IDS)                       │
│ ├─ Security Event Logging (SELs)                          │
│ ├─ Anomaly Detection                                      │
│ ├─ Failed Login Attempts Tracking                         │
│ ├─ Suspicious Activity Alerts                             │
│ └─ Security Incident Response Team                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Optimization

```
Frontend Optimization:
├─ Code Splitting (Route-Based)
├─ Image Optimization (Next.js Image)
├─ Minification & Compression (Gzip)
├─ Tree Shaking (Unused Code Removal)
├─ Lazy Loading (Components & Data)
├─ Caching Strategy (Browser + CDN)
├─ CSS-in-JS Optimization
└─ Bundle Analysis (webpack-bundle-analyzer)

Database Optimization:
├─ Index Creation (FK, Status, Dates)
├─ Query Optimization (EXPLAIN ANALYZE)
├─ Connection Pooling (Max 50 connections)
├─ Prepared Statements (Prevent SQL Injection)
├─ Pagination (Limit large datasets)
├─ Materialized Views (Pre-computed aggregates)
└─ Denormalization (Where appropriate)

API Optimization:
├─ Response Caching (HTTP Cache Headers)
├─ Compression (gzip, brotli)
├─ Pagination (Limit response size)
├─ Selective Field Projection
├─ Batch Operations (Reduce API calls)
├─ Request Debouncing
└─ Concurrent Request Limiting

Runtime Optimization:
├─ Node.js Clustering (Multi-core)
├─ Memory Management (Garbage Collection)
├─ Process Isolation
├─ Load Balancing (Horizontal Scaling)
├─ Auto-scaling (Based on CPU/Memory)
└─ Health Checks & Failover
```

---

**Document Version**: 1.0
**Last Updated**: November 2024
**For More Info**: See TECH_STACK.md and README.md

