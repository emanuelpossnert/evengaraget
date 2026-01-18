# CRM Dashboard - Complete Build Guide

## 🎯 Overview

The CRM Dashboard is a professional **Next.js + React** application for managing:
- 👥 Customer relationships
- 📅 Booking calendar
- 💬 Email conversations
- 📊 Analytics dashboard
- ⚙️ Settings

---

## 🏗️ Project Structure

```
/crm-dashboard/
├── app/
│   ├── layout.tsx              # Root layout + navigation
│   ├── page.tsx                # Dashboard (home)
│   ├── (auth)/
│   │   ├── login/page.tsx       # Login page
│   │   └── layout.tsx           # Auth layout
│   ├── (app)/
│   │   ├── customers/
│   │   │   ├── page.tsx         # Customer list
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # Customer detail
│   │   │       └── layout.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx         # Booking calendar
│   │   │   └── [id]/page.tsx    # Booking detail
│   │   ├── conversations/
│   │   │   ├── page.tsx         # Email threads
│   │   │   └── [id]/page.tsx    # Thread detail
│   │   ├── analytics/
│   │   │   ├── page.tsx         # Analytics dashboard
│   │   │   └── reports/page.tsx # Report generation
│   │   └── settings/
│   │       └── page.tsx         # App settings
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   └── logout.ts
│   │   ├── customers/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── bookings/route.ts
│   │   ├── conversations/route.ts
│   │   ├── analytics/route.ts
│   │   └── webhooks/
│   │       └── supabase.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── RecentBookings.tsx
│   │   ├── RevenueChart.tsx
│   │   └── AlertBox.tsx
│   ├── customers/
│   │   ├── CustomerTable.tsx
│   │   ├── CustomerCard.tsx
│   │   ├── CustomerForm.tsx
│   │   └── CustomerNotes.tsx
│   ├── bookings/
│   │   ├── BookingCalendar.tsx
│   │   ├── BookingCard.tsx
│   │   └── BookingForm.tsx
│   ├── conversations/
│   │   ├── ConversationList.tsx
│   │   ├── MessageThread.tsx
│   │   ├── MessageInput.tsx
│   │   └── EmailParser.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── Pagination.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Alert.tsx
│       └── Tooltip.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client instance
│   │   ├── server.ts            # Server instance
│   │   └── queries.ts           # Reusable queries
│   ├── api-client.ts            # API wrapper
│   ├── hooks/
│   │   ├── useCustomers.ts
│   │   ├── useBookings.ts
│   │   ├── useConversations.ts
│   │   ├── useAuth.ts
│   │   └── useRealtime.ts       # Real-time subscriptions
│   ├── utils.ts                 # Helper functions
│   └── constants.ts             # App constants
├── styles/
│   ├── variables.css            # CSS variables
│   ├── components.css           # Component styles
│   └── animations.css           # Animations
├── public/
│   └── images/
├── .env.local.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 📦 Dependencies to Install

```bash
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget/crm-dashboard

npm install --save \
  next@latest react@latest react-dom@latest \
  @supabase/supabase-js@latest \
  @supabase/auth-helpers-nextjs@latest \
  date-fns@latest \
  recharts@latest \
  tailwindcss@latest \
  typescript@latest \
  @types/react@latest \
  @types/react-dom@latest

npm install --save-dev \
  tailwindcss@latest \
  postcss@latest \
  autoprefixer@latest \
  @types/node@latest
```

---

## 🎨 Component Breakdown

### 1. **Layout Components**

#### Header.tsx
```typescript
// Shows: User profile, current date, quick actions
// Features:
// - User info (name, email)
// - Search bar
// - Notification bell
// - Settings + logout
```

#### Sidebar.tsx
```typescript
// Shows: Navigation menu
// Pages:
// - Dashboard
// - Customers
// - Bookings
// - Conversations
// - Analytics
// - Settings
```

### 2. **Dashboard Components**

#### StatsCard.tsx
```typescript
// Cards showing:
// - Total Revenue (month)
// - Active Bookings
// - Pending Quotations
// - Today's Deliveries
```

#### RecentBookings.tsx
```typescript
// List of last 5 bookings with:
// - Customer name
// - Rental dates
// - Total price
// - Status
```

#### RevenueChart.tsx
```typescript
// Recharts graph showing:
// - Revenue by week
// - Bookings per day
// - Trend lines
```

### 3. **Customer Components**

#### CustomerTable.tsx
```typescript
// Filterable, sortable table:
// - Customer name
// - Company
// - Total bookings
// - Total revenue
// - Last booking date
// - Status (active/inactive)
```

#### CustomerDetail.tsx
```typescript
// Single customer view:
// - Profile info
// - Contact details
// - Booking history
// - Conversation history
// - Notes + tags
// - CLV (customer lifetime value)
```

### 4. **Booking Components**

#### BookingCalendar.tsx
```typescript
// Interactive calendar:
// - Month view of all bookings
// - Color-coded by status
// - Click to see details
// - Drag-to-reschedule
```

#### BookingDetail.tsx
```typescript
// Booking info:
// - Customer details
// - Rented products
// - Rental dates
// - Delivery address
// - Quotation/Signature status
// - Actions (edit, cancel, complete)
```

### 5. **Conversation Components**

#### ConversationList.tsx
```typescript
// Email threads:
// - Sender name
// - Last message
// - Date
// - Unread status
// - Labels/tags
```

#### MessageThread.tsx
```typescript
// Full email conversation:
// - All messages in thread
// - Timestamps
// - Attachments
// - Reply field
```

---

## 🔐 Authentication Flow

### 1. Login Page (`/auth/login`)
```typescript
// Form:
// - Email input
// - Password input
// - "Sign in" button
// - Password reset link
//
// On submit:
// - Call /api/auth/login
// - Set auth cookie
// - Redirect to dashboard
```

### 2. Session Management
```typescript
// Supabase Auth with:
// - Next.js middleware for protected routes
// - Automatic token refresh
// - Logout clears session
```

---

## 🗄️ API Routes

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session

### Customers
- `GET /api/customers` - List all customers (paginated)
- `GET /api/customers/[id]` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Bookings
- `GET /api/bookings` - List bookings (with filters)
- `GET /api/bookings/[id]` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking

### Conversations
- `GET /api/conversations` - List email threads
- `GET /api/conversations/[id]` - Get thread messages
- `POST /api/conversations/[id]/reply` - Send reply

### Analytics
- `GET /api/analytics/revenue` - Revenue metrics
- `GET /api/analytics/bookings` - Booking metrics
- `GET /api/analytics/customers` - Customer metrics
- `GET /api/analytics/export` - Export report

---

## 🎯 Data Models

### Customer
```typescript
interface Customer {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  phone_number: string;
  total_bookings: number;
  total_revenue: number;
  last_booking_date: Date;
  created_at: Date;
  updated_at: Date;
  notes: string;
  tags: string[];
  status: 'active' | 'inactive' | 'blocked';
}
```

### Booking
```typescript
interface Booking {
  id: string;
  quotation_id: string;
  customer_id: string;
  booking_number: string;
  rental_start: Date;
  rental_end: Date;
  total_amount: number;
  delivery_address: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}
```

### Conversation
```typescript
interface Conversation {
  id: string;
  customer_email: string;
  thread_id: string;
  subject: string;
  status: 'open' | 'closed' | 'escalated';
  message_count: number;
  last_message_at: Date;
  created_at: Date;
}
```

---

## 🎨 Design System

### Colors
```css
--primary: #007bff;      /* Blue */
--success: #28a745;      /* Green */
--warning: #ffc107;      /* Yellow */
--danger: #dc3545;       /* Red */
--info: #17a2b8;         /* Cyan */
--light: #f8f9fa;        /* Light gray */
--dark: #343a40;         /* Dark gray */
```

### Typography
```css
--font-primary: 'Inter', sans-serif;
--font-mono: 'Monaco', monospace;
--size-xs: 0.75rem;
--size-sm: 0.875rem;
--size-base: 1rem;
--size-lg: 1.125rem;
--size-xl: 1.25rem;
--size-2xl: 1.5rem;
```

### Spacing
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
--spacing-2xl: 4rem;
```

---

## 🚀 Development Workflow

### 1. Setup
```bash
npm install
npm run dev
# Opens http://localhost:3000
```

### 2. Environment
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://njiagzdssxoxycxraubf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### 3. Build
```bash
npm run build
npm run start
```

### 4. Deployment
```bash
# Deploy to Vercel (recommended)
npm run deploy
# Or: vercel deploy --prod
```

---

## 📱 Responsive Design

All pages are mobile-first, responsive:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Example:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* Cards adapt to screen size */}
</div>
```

---

## ♿ Accessibility

All components follow WCAG 2.1 AA standards:
- Semantic HTML (`<button>`, `<nav>`, etc.)
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratios
- Screen reader friendly

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📋 Phase 3 Milestones

### Week 1: Foundation
- [ ] Project setup
- [ ] Authentication
- [ ] Layout + Navigation
- [ ] Dashboard page

### Week 2: Core Features
- [ ] Customer management
- [ ] Booking calendar
- [ ] Conversation view

### Week 3: Analytics
- [ ] Analytics dashboard
- [ ] Reports generation
- [ ] Export functionality

### Week 4: Polish
- [ ] Design refinement
- [ ] Performance optimization
- [ ] Testing + bug fixes
- [ ] Deployment

---

## 🎯 Success Metrics

- Page load time < 2 seconds
- All pages responsive
- 0 console errors
- > 90 Lighthouse score
- 100% authentication working
- Real-time updates working

---

## 📞 Next Steps

1. Read this guide completely
2. Create project structure
3. Install dependencies
4. Start building page-by-page
5. Integrate with Supabase
6. Test authentication
7. Deploy to Vercel

**Estimated time: 1-2 weeks for complete CRM Dashboard**

🚀 **Phase 3 Complete when Dashboard is deployed!**
