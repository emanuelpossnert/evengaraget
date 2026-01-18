# EventGaraget - Frontend Specifications

## Frontend Architecture

Three separate Next.js applications:

1. **CRM Dashboard** (`/crm-dashboard`) - Staff interface
2. **Signature App** (`/signature-app`) - Customer signing interface
3. **Analytics Dashboard** (future) - Reporting & insights

---

## CRM Dashboard (`/crm-dashboard`)

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Supabase (real-time)
- **Auth:** Supabase Auth (email/password)
- **UI Components:** shadcn/ui, Radix UI
- **State Management:** Zustand + React Query
- **Calendar:** react-big-calendar
- **Date Picker:** react-day-picker
- **Forms:** React Hook Form + Zod

### Pages & Features

#### 1. Dashboard (`/`)
**Purpose:** Overview of key metrics and recent activity

**Components:**
- Header with navigation
- Quick stats cards:
  - Active Bookings (count, revenue)
  - Pending Quotations (count, oldest)
  - Today's Deliveries (count)
  - Unread Conversations (count)
- Mini calendar (next 7 days)
- Recent conversations widget (5 latest)
- Today's schedule
- Team status panel

**Interactions:**
- Click on booking card → go to `/bookings`
- Click on conversation → open in `/conversations`
- Click on calendar date → jump to that day in `/bookings`

---

#### 2. Customers (`/customers`)

**Subpages:**
- `/customers` - Customer list
- `/customers/[id]` - Customer detail card

##### List View (`/customers`)
**Features:**
- Table with:
  - Customer name
  - Email
  - Phone
  - Total bookings
  - Total revenue
  - Last contact date
  - Status (active/inactive)
  - Actions (view, edit, delete)
  
- Search box (searches name, email, phone)
- Filters:
  - Status (active/inactive/vip)
  - Customer type (private/business)
  - Revenue range
  - Last contact (past 30 days, 90 days, 1 year)
  
- Pagination (20 per page)
- Sort by (name, revenue, last_contact)
- Export to CSV button
- Add New Customer button

**Real-time Updates:**
- Listen to Supabase changes on `customers` table
- Update count badges in navigation
- Highlight recently updated rows

##### Detail Card (`/customers/[id]`)

**Layout:**
```
┌─────────────────────────────────────┐
│ Customer Profile                    │
├─────────────────────────────────────┤
│ Name | Email | Phone | Company      │
│ Address | City | Postal | Notes     │
│                                     │
│ [Edit Profile] [Call] [Email]       │
│                                     │
├─────────────────────────────────────┤
│ 📊 Statistics                       │
│ Total Bookings: 5                   │
│ Total Revenue: 15,000 SEK           │
│ Avg Order Value: 3,000 SEK          │
│ Preferred Products: Tält, Stolar    │
│                                     │
├─────────────────────────────────────┤
│ 💬 Conversations (5 total)          │
│ [Email 1] - 2 days ago              │
│ [Email 2] - 1 week ago              │
│ [Show All]                          │
│                                     │
├─────────────────────────────────────┤
│ 📅 Recent Bookings (3 total)        │
│ [Booking 1] BK-2025-001 - Confirmed │
│ [Booking 2] BK-2025-002 - Completed │
│ [Show All]                          │
│                                     │
└─────────────────────────────────────┘
```

**Components:**
- Profile info (editable)
- Statistics cards
- Conversation thread list (click to view)
- Booking history (click to view)
- Notes section
- Action buttons (Call, Email, Edit)

---

#### 3. Bookings (`/bookings`)

**Subpages:**
- `/bookings` - Calendar view (default)
- `/bookings/list` - List view
- `/bookings/[id]` - Booking detail
- `/bookings/new` - Create booking

##### Calendar View (`/bookings`)

**Features:**
- Month/Week/Day view toggle
- Color-coded bookings:
  - Blue: Confirmed
  - Yellow: Pending
  - Green: Completed
  - Red: Cancelled
  
- Hover shows:
  - Customer name
  - Products (summary)
  - Total amount
  - Status
  
- Click to view details
- Drag-to-reschedule (update delivery_date)
- Multi-select for batch operations

**Sidebar Filters:**
- Status: All / Draft / Pending / Confirmed / Completed / Cancelled
- Date range picker
- Customer search
- Min/max amount
- Payment status

##### Booking Detail (`/bookings/[id]`)

**Sections:**
```
┌─────────────────────────────────────┐
│ Booking #BK-2025-001               │
├─────────────────────────────────────┤
│ Status: [Confirmed] | [Edit Status] │
│                                     │
│ Customer: John Doe                  │
│ Date: July 20-22, 2025              │
│ Delivery: July 20, 10:00-12:00      │
│ Pickup: July 22, 15:00-17:00        │
│                                     │
│ Delivery Address:                   │
│ Street, Postal Code, City           │
│                                     │
├─────────────────────────────────────┤
│ Line Items:                         │
│ Partytält 4x8m x1 @ 2,500 SEK       │
│ Stol vit x50 @ 45 SEK each          │
│ Total: 4,750 SEK                    │
│                                     │
├─────────────────────────────────────┤
│ Payment:                            │
│ Status: [Unpaid]                    │
│ Deposit: 1,000 SEK (paid)           │
│ Remaining: 3,750 SEK                │
│                                     │
├─────────────────────────────────────┤
│ Internal Notes:                     │
│ [Text area for staff notes]         │
│                                     │
│ [Save] [Cancel] [Delete]            │
│                                     │
└─────────────────────────────────────┘
```

---

#### 4. Conversations (`/conversations`)

**List View (`/conversations`):**
- Thread list with:
  - Customer name
  - Subject
  - Latest message preview
  - Date
  - Status badge
  - Unread indicator
  - AI confidence (if applicable)
  
- Search by customer, subject, content
- Filters:
  - Status (active/resolved/escalated)
  - Type (booking/support/complaint)
  - Unread only
  - With escalations
  - Last 7 days/30 days/all
  
- Sort by (newest, oldest, unread)

**Thread View (`/conversations/[id]`):**

```
┌─────────────────────────────────────┐
│ Subject: I want to book...          │
├─────────────────────────────────────┤
│ Customer: John Doe                  │
│ Email: john@example.com             │
│ Status: Active | [Mark Resolved]    │
│ Type: Booking | AI Confidence: 95%  │
│                                     │
├─────────────────────────────────────┤
│ Message Thread:                     │
│ ─────────────────────────────────   │
│ From: john@example.com (Mon 10:00)  │
│ I'd like to book a tent...          │
│                                     │
│ From: booking@eventgaraget (10:05)  │
│ Great! Here's a quotation...        │
│ [View Quotation Link]               │
│                                     │
├─────────────────────────────────────┤
│ Reply:                              │
│ [Rich text editor]                  │
│                                     │
│ [Send] [Cancel]                     │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Threaded conversation display
- Distinguish AI responses vs human
- Quick replies (templates)
- Attachments support
- Mark as resolved/escalated
- Link to booking/quotation

---

#### 5. Escalations (`/escalations`)

**List View:**
- Escalation list with:
  - Customer name
  - Reason (ai_confidence_low, complaint, payment_issue)
  - Status (pending/in_progress/resolved)
  - Created date
  - Assigned to
  - Priority
  
- Filters:
  - Status
  - Priority
  - Reason
  - Assigned to me
  
- Sort by (newest, priority)

**Detail View (`/escalations/[id]`):**

```
┌─────────────────────────────────────┐
│ Escalation #ESC-001                 │
├─────────────────────────────────────┤
│ Status: [Pending] [In Progress]     │
│ Assigned To: [You] [Reassign]       │
│ Priority: [High]                    │
│                                     │
│ Reason: AI Confidence Low (45%)     │
│ Original Classification:            │
│ + booking_request                   │
│ + Confidence: 45%                   │
│                                     │
│ Customer: John Doe                  │
│ Email: john@example.com             │
│                                     │
│ Original Email:                     │
│ "Can I rent tents? I need..."       │
│                                     │
├─────────────────────────────────────┤
│ Your Response:                      │
│ [Rich text editor]                  │
│                                     │
│ [Provide Feedback for AI Learning]  │
│ Correct Classification: [Dropdown]  │
│ Notes: [Text]                       │
│                                     │
│ [Send & Resolve] [Save Draft]       │
│                                     │
└─────────────────────────────────────┘
```

---

#### 6. Products (`/products`)

**List View:**
- Product table with:
  - Name
  - Category
  - Price/day
  - Stock (available/total)
  - Actions (edit, view inventory)
  
- Search by name
- Filter by category
- Add new product button

**Edit Product:** Modal form with:
- Name
- Category dropdown
- Description
- Price per day
- Stock quantity
- Setup required (checkbox)
- Can be wrapped (checkbox)
- Image upload

---

#### 7. Settings (`/settings`)

**Tabs:**
1. **Team Management**
   - List of staff members
   - Add/remove users
   - Role assignment (admin/support/viewer)

2. **Email Templates**
   - Quotation template editor
   - Reminder template editor
   - Escalation notification template
   - Preview

3. **Automation Rules**
   - Escalation rules editor
   - Reminder scheduling
   - Auto-response settings

4. **Integrations**
   - Gmail (connected)
   - Google Sheets (connected)
   - Supabase (info only)

5. **Account & Billing**
   - Company info
   - Subscription status
   - Usage statistics

---

### CRM UI Components Library

```typescript
// Reusable components
<CustomerCard /> - Minimal customer preview
<BookingCard /> - Booking preview with status
<ConversationPreview /> - Email thread summary
<StatusBadge /> - Status indicator
<QuickActions /> - Action button menu
<FilterPanel /> - Reusable filter UI
<DataTable /> - Sortable, filterable table
<Calendar /> - Event calendar
<Modal /> - Dialog container
<NotificationToast /> - Toast alerts
```

---

## Signature App (`/signature-app`)

### Tech Stack
- **Framework:** Next.js 15
- **Styling:** Tailwind CSS
- **Signature:** react-signature-canvas
- **Database:** Supabase
- **State:** Zustand

### Pages

#### 1. Quotation View (`/sign/[token]`)

**Route:** `https://sign.eventgaraget.se/sign/{uuid}`

**Layout:**
```
┌─────────────────────────────────────────┐
│ EventGaraget - Sign Your Quotation      │
├─────────────────────────────────────────┤
│                                         │
│ QUOTATION #QT-2025-001                 │
│ Valid until: July 10, 2025              │
│                                         │
│ Products:                               │
│ • Partytält 4x8m x1  2,500 SEK         │
│ • Stol vit x50       2,250 SEK         │
│                                         │
│ Subtotal:           4,750 SEK          │
│ Tax (25%):          1,187 SEK          │
│ ─────────────────────────────────────  │
│ Total:              5,937 SEK          │
│                                         │
├─────────────────────────────────────────┤
│ Your Information:                       │
│ [Text] Company Name (required)         │
│ [Text] Contact Person (required)       │
│ [Date] Signature Date (auto-filled)    │
│                                         │
│ Signature:                              │
│ [Canvas area - draw here]              │
│ [Clear] [Redo]                         │
│                                         │
│ □ I accept the terms & conditions     │
│                                         │
│ [Sign & Confirm Booking]  [Cancel]     │
│                                         │
│ By signing, you confirm the booking... │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Display quotation details (read-only)
- Pre-fill company name if known
- Signature canvas (responsive)
- Terms & conditions acceptance
- Timestamp signature
- IP address logging
- Device info capture

**Validations:**
- Company name required
- Contact person required
- Signature required (not blank)
- Terms checkbox required

**On Submit:**
1. Validate all fields
2. Convert canvas to image
3. POST to `/api/signatures`
4. Save to Supabase
5. Create booking record
6. Send confirmation email
7. Redirect to success page

---

#### 2. Success Page (`/sign/[token]/success`)

**Layout:**
```
┌─────────────────────────────────────────┐
│ ✅ Booking Confirmed!                   │
├─────────────────────────────────────────┤
│                                         │
│ Thank you for your booking!             │
│                                         │
│ Booking Number: BK-2025-001            │
│ Confirmation email sent to:            │
│ john@example.com                       │
│                                         │
│ Event Date: July 20-22, 2025           │
│ Total: 5,937 SEK                       │
│                                         │
│ What happens next:                     │
│ 1. We'll prepare your products         │
│ 2. Delivery reminder 2 days before     │
│ 3. Follow-up survey after event       │
│                                         │
│ [Download Signed PDF]                  │
│ [Add to Calendar] ▼                    │
│ ├─ Google Calendar                     │
│ ├─ Outlook                             │
│ └─ Apple Calendar                      │
│                                         │
│ Questions? Email: support@eventgaraget │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Confirmation message
- Booking number display
- PDF download link
- Calendar add options (iCal, Google, Outlook)
- Contact info
- Auto-redirect to home after 10 seconds (optional)

---

## API Endpoints (Next.js API Routes)

### Signature App API

```typescript
// POST /api/signatures - Save signature
POST /api/signatures
Body: {
  token: string (UUID from URL)
  signer_name: string
  company_name: string
  signature_image_url: string
  signature_data: JSONB
  ip_address: string
  user_agent: string
}

// GET /api/quotations/[token] - Get quotation by token
GET /api/quotations/[token]
Response: {
  quotation_id: UUID
  customer_id: UUID
  quotation_number: string
  total_amount: number
  line_items: []
  valid_until: date
}

// POST /api/bookings - Create booking from signature
POST /api/bookings
Body: {
  quotation_id: UUID
  signature_id: UUID
  delivery_date: date
  pickup_date: date
}
```

### CRM Dashboard API

```typescript
// Handled mostly by Supabase client library
// Backend needed for:
// - Complex queries
// - Email sending
// - File uploads
// - Payment processing
```

---

## Real-time Updates (Supabase Realtime)

### Subscriptions:

```typescript
// CRM: Listen to new conversations
supabase
  .channel('conversations')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'conversations',
    filter: 'status=eq.active'
  }, payload => {
    // Update conversation list
  })
  .subscribe()

// CRM: Listen to booking updates
supabase
  .channel('bookings')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookings'
  }, payload => {
    // Update calendar/list
  })
  .subscribe()

// Signature App: Monitor quotation signing
supabase
  .channel(`quotation:${token}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'quotations',
    filter: `signature_token=eq.${token}`
  }, payload => {
    // Redirect if signed
  })
  .subscribe()
```

---

## Styling & Theme

**Colors:**
- Primary: #4CAF50 (Green)
- Secondary: #2196F3 (Blue)
- Danger: #F44336 (Red)
- Warning: #FF9800 (Orange)
- Success: #4CAF50 (Green)
- Neutral: #9E9E9E (Gray)

**Typography:**
- Headings: Inter Bold
- Body: Inter Regular
- Mono: Fira Code (for booking numbers, etc.)

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Performance Optimizations

1. **Lazy Loading:**
   - Code splitting by route
   - Image optimization (next/image)
   - Lazy load modals/dialogs

2. **Caching:**
   - SWR for API data
   - Supabase client caching
   - Browser cache headers

3. **Database:**
   - Paginate large lists
   - Index frequently searched columns
   - Use Supabase query builder efficiently

4. **Bundle Size:**
   - Tree shaking
   - Remove unused dependencies
   - Minify production builds

---

## Security Considerations

1. **Authentication:**
   - Supabase Auth for CRM
   - JWT tokens
   - Secure HTTP-only cookies

2. **Data Protection:**
   - HTTPS only
   - Customer PII encryption
   - Audit logging

3. **File Uploads:**
   - Validate file types
   - Scan for viruses (future)
   - Limit file size

4. **API Security:**
   - Rate limiting
   - Input validation
   - CORS configuration
   - SQL injection prevention (Supabase handles)

---

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Alt text for images
- ARIA labels

---

## Testing Strategy

### Unit Tests
- Components
- Utilities
- Hooks

### Integration Tests
- Page navigation
- Form submission
- API calls

### E2E Tests (Cypress)
- Full user flows
- Booking creation → signing
- Escalation handling

### Performance Tests
- Load time < 3 seconds
- Lighthouse score > 80

---

## Deployment

**Environment Setup:**
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
GMAIL_CREDENTIALS=...
```

**Hosting:**
- Vercel (recommended for Next.js)
- Domain: crm.eventgaraget.se, sign.eventgaraget.se
- SSL/TLS certificates
- CDN for static assets

---

## Monitoring & Analytics

- Sentry for error tracking
- Vercel Analytics for performance
- LogRocket for session replay
- Google Analytics for user behavior

---

## Future Enhancements

1. **Mobile App** - React Native or Flutter
2. **SMS Notifications** - Twilio integration
3. **Payment Processing** - Stripe integration
4. **Inventory Management** - Real-time stock tracking
5. **Custom Branding** - White-label CRM
6. **Multi-language Support** - i18n setup
7. **Advanced Analytics** - Revenue forecasting
8. **Customer Portal** - Self-service booking view
