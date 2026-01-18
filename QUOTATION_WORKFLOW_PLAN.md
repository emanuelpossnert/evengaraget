# 🎯 Quotation-to-Signature Workflow Plan

## 📊 System Overview

```
01-email-classification (Email → Booking)
    ↓ [Trigger]
02-quotation-generation (Generate & Send Quotation Link)
    ↓ [Email with Link]
Signature App (Sign & Confirm Booking)
    ↓ [Update Supabase + Send Confirmation]
Customer Email (Booking Confirmation with Signature)
```

---

## 🔄 WORKFLOW 1: 01-email-classification (UPDATE EXISTING)

### Current State
- ✅ Extracts email data
- ✅ Checks/creates customer
- ✅ Finds/creates conversation
- ✅ Generates AI response
- ✅ Saves messages to Supabase
- ❌ Does NOT save booking data
- ❌ Does NOT trigger quotation workflow

### Required Changes

#### **Step 1: AI Extraction Enhancement**
Update `aiResponse1` prompt to extract and return:
```json
{
  "response": "string",
  "booking_request": {
    "products": [
      {
        "name": "string",
        "quantity": "number",
        "wrapping": "boolean",
        "daily_rate": "number"
      }
    ],
    "event_date": "string (YYYY-MM-DD)",
    "event_end_date": "string (YYYY-MM-DD)",
    "location": "string",
    "phone": "string",
    "company": "string",
    "is_booking": "boolean"
  }
}
```

#### **Step 2: Add Booking Parser Node**
**Node Name:** `parseBookingData`
**Type:** Code Node
**Purpose:** Extract structured booking data from AI response

#### **Step 3: Add Conditional Router**
**Node Name:** `routeByType`
**Type:** IF Node
**Condition:** Check if `is_booking == true`
- **TRUE:** → Save booking → Trigger quotation workflow
- **FALSE:** → End (support question only)

#### **Step 4: Add Booking Saver**
**Node Name:** `saveBooking`
**Type:** Supabase Node
**Operation:** Create row in `bookings` table

**Fields to save:**
```
- customer_id: UUID (from existing)
- conversation_id: UUID (from existing)
- event_date: DATE
- event_end_date: DATE
- location: STRING
- products_requested: JSON (array of products)
- wrapping_selected: JSONB (wrapping options)
- status: STRING ('pending_quotation')
- total_estimated_price: NUMERIC
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### **Step 5: Add Workflow Trigger**
**Node Name:** `triggerQuotationWorkflow`
**Type:** Execute Workflow
**Triggers:** `02-quotation-generation`
**Pass Data:** booking_id, customer_id, conversation_id

---

## 🎁 WORKFLOW 2: 02-quotation-generation (NEW)

### Purpose
- Fetch booking details from Supabase
- Generate professional quotation
- Create signature link
- Send email with link to customer

### Nodes Required

1. **Trigger:** Workflow Execute (from 01-email-classification)
2. **fetchBooking:** Supabase Get (fetch booking by ID)
3. **fetchCustomer:** Supabase Get (fetch customer details)
4. **fetchProducts:** Supabase Get Many (fetch product details)
5. **generateQuotation:** Code Node (format quotation data)
6. **generateSigningLink:** Code Node (generate unique signing token)
7. **saveQuotation:** Supabase Create (save draft quotation)
8. **formatQuotationEmail:** Code Node (format email with link)
9. **sendQuotationEmail:** Gmail (send to customer)
10. **updateBookingStatus:** Supabase Update (status: 'quotation_sent')

### Data Flow
```
Booking ID Input
    ↓
Fetch: Booking, Customer, Products
    ↓
Generate: Quotation Data + Signing Token
    ↓
Save: Draft Quotation in Supabase
    ↓
Format & Send: Email with Signing Link
    ↓
Update: Booking Status to 'quotation_sent'
```

---

## 📝 SIGNATURE APP (NEW NEXT.JS APP)

### File Structure
```
signature-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── quote/
│       ├── [token]/
│       │   ├── page.tsx (Main form)
│       │   ├── layout.tsx
│       │   ├── components/
│       │   │   ├── QuotationDetails.tsx
│       │   │   ├── CustomerForm.tsx
│       │   │   ├── ProductSelector.tsx
│       │   │   ├── WrappingOptions.tsx
│       │   │   ├── AddOnsSelector.tsx
│       │   │   ├── TermsAndConditions.tsx
│       │   │   └── SignaturePad.tsx
│       │   └── services/
│       │       └── quotationService.ts
│       └── [token]/
│           └── success/
│               └── page.tsx
├── lib/
│   ├── supabase-client.ts
│   ├── utils.ts
│   └── types.ts
├── hooks/
│   ├── useQuotation.ts
│   └── useSignature.ts
├── styles/
│   └── globals.css
└── public/
    └── icons/
```

### Page: `/quote/[token]`

#### Features
1. **Quotation Header**
   - Order/Quotation ID
   - Event Date & Location
   - Customer Name

2. **Current Booking Data** (Read-only)
   ```
   - Products ordered (with prices)
   - Total price (products only)
   - Any pre-filled data
   ```

3. **Customer Form** (Editable if not filled)
   ```
   - Full Name (if missing)
   - Phone (if missing)
   - Address (if missing)
   - Postal Code & City (if missing)
   - Company Name (optional)
   - Delivery Instructions (text area)
   ```

4. **Product Details** (Expandable)
   ```
   For each product:
   - Product name + description
   - Quantity + Unit price
   - Daily rate calculation
   - [Toggle] Wrapping option (if available)
     └─ Wrapping price
   - Subtotal for this product
   ```

5. **Add-ons Section** (Optional)
   ```
   - Setup/Installation fee
   - Early pickup/Extended rental
   - Other services
   Checkbox selection with prices
   ```

6. **Terms & Conditions** (Minimized Accordion)
   ```
   [▼] Terms & Conditions (Collapse/Expand)
   - Payment terms
   - Cancellation policy
   - Liability
   - etc.
   Checkbox: "I accept terms"
   ```

7. **Price Summary**
   ```
   Products:                 X,XXX SEK
   Wrapping (if selected):   X,XXX SEK
   Add-ons (if selected):    X,XXX SEK
   ─────────────────────────────────
   TOTAL:                    X,XXX SEK
   
   [Payment method info]
   ```

8. **Signature Pad**
   ```
   [Signature canvas area]
   [Clear] [Sign]
   ```

9. **Action Buttons**
   ```
   [Cancel] [Save as Draft] [Sign & Confirm]
   ```

### Data Structure for Signature Page

#### Input (from URL token)
```json
{
  "token": "unique_signing_token",
  "booking_id": "uuid",
  "customer_id": "uuid",
  "quotation_id": "uuid"
}
```

#### Quotation Object (fetched from Supabase)
```json
{
  "id": "uuid",
  "booking_id": "uuid",
  "customer_id": "uuid",
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "company_name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string"
  },
  "event_details": {
    "date": "2025-11-04",
    "end_date": "2025-11-04",
    "location": "Stockholm",
    "delivery_instructions": "string"
  },
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Partytält 4x4m",
      "quantity": 2,
      "unit_price": 1800,
      "daily_rate": 1800,
      "wrapping_available": true,
      "wrapping_price": 2500,
      "wrapping_selected": false,
      "subtotal": 3600
    }
  ],
  "addons": [
    {
      "id": "uuid",
      "name": "Setup & Assembly",
      "price": 1500,
      "selected": false
    }
  ],
  "terms_and_conditions": "HTML or text",
  "subtotal": 3600,
  "total_addons": 0,
  "total_wrapping": 0,
  "grand_total": 3600,
  "status": "pending_signature"
}
```

#### Form Submission Data
```json
{
  "quotation_id": "uuid",
  "customer_updated_data": {
    "phone": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "company_name": "string",
    "delivery_instructions": "string"
  },
  "wrapping_selections": [
    {
      "product_id": "uuid",
      "wrapping_selected": true
    }
  ],
  "addons_selected": [
    {
      "addon_id": "uuid",
      "selected": true
    }
  ],
  "terms_accepted": true,
  "signature": "base64_encoded_image",
  "signed_at": "2025-10-30T14:30:00Z"
}
```

---

## 💾 SUPABASE TABLES UPDATES

### `bookings` Table (ADD FIELDS)
```sql
ALTER TABLE bookings ADD COLUMN (
  event_date DATE,
  event_end_date DATE,
  location VARCHAR(255),
  products_requested JSONB,
  wrapping_selected JSONB,
  status VARCHAR(50) DEFAULT 'pending_quotation',
  total_estimated_price NUMERIC(10,2)
);
```

### New Table: `quotations`
```sql
CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  
  -- Quotation Content
  items JSONB NOT NULL,
  addons JSONB,
  wrapping_selections JSONB,
  
  -- Pricing
  subtotal NUMERIC(10,2),
  total_addons NUMERIC(10,2),
  total_wrapping NUMERIC(10,2),
  grand_total NUMERIC(10,2),
  
  -- Customer Info (at time of quote)
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  customer_postal_code VARCHAR(10),
  customer_city VARCHAR(100),
  delivery_instructions TEXT,
  
  -- Signature
  signature_token VARCHAR(255) UNIQUE,
  signature_image TEXT,
  signed_at TIMESTAMP,
  signed_by VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT quotations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### New Table: `addons`
```sql
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Environment Variables (Signature App)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://njiagzdssxoxycxraubf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here

# Signing Link
NEXT_PUBLIC_SIGNING_URL=https://yourdomain.com/quote

# Email
NEXT_PUBLIC_SUPPORT_EMAIL=support@eventgaraget.se
```

---

## 📧 Email Templates

### Quotation Email (from 02-quotation-generation)
```
Subject: Din offert från EventGaraget - {{order_id}}

Hej {{customer_name}},

Vi har förberett din offert för evenemanget den {{event_date}}.

Granska och signera offerten här:
{{signing_link}}

Offertsammanfattning:
- Produkter: {{total_items}}
- Totalpris: {{grand_total}} SEK

Länken är giltig i 30 dagar.

Med vänlig hälsning,
EventGaraget
```

### Confirmation Email (from Signature App)
```
Subject: Bokningsbekräftelse - EventGaraget

Hej {{customer_name}},

Din offert har signeras och din bokning är nu bekräftad!

Bokningsdetaljer:
- Ordernummer: {{booking_id}}
- Datum: {{event_date}}
- Totalpris: {{grand_total}} SEK

[Signerad offert bifogad]

Vi hörs snart med leveransdetaljer.

Med vänlig hälsning,
EventGaraget
```

---

## ✅ Implementation Checklist

- [ ] Update `01-email-classification` workflow
  - [ ] Enhance AI extraction prompt
  - [ ] Add `parseBookingData` node
  - [ ] Add `routeByType` IF node
  - [ ] Add `saveBooking` Supabase node
  - [ ] Add `triggerQuotationWorkflow` node
  
- [ ] Create `02-quotation-generation` workflow
  - [ ] Add all 10 nodes
  - [ ] Configure Supabase connections
  - [ ] Test data flow
  
- [ ] Update Supabase schema
  - [ ] Add fields to `bookings`
  - [ ] Create `quotations` table
  - [ ] Create `addons` table
  - [ ] Set up RLS policies
  
- [ ] Build Signature App (Next.js)
  - [ ] Create folder structure
  - [ ] Build `QuotationDetails` component
  - [ ] Build `CustomerForm` component
  - [ ] Build `ProductSelector` component
  - [ ] Build `WrappingOptions` component
  - [ ] Build `AddOnsSelector` component
  - [ ] Build `TermsAndConditions` component
  - [ ] Build `SignaturePad` component
  - [ ] Build main `[token]/page.tsx`
  - [ ] Build success page
  - [ ] Implement Supabase service
  - [ ] Test full flow
  
- [ ] Integration testing
  - [ ] Email → Booking saved
  - [ ] Booking → Quotation email sent
  - [ ] Quotation link → Signature page loads
  - [ ] Form submission → Supabase updated
  - [ ] Confirmation email sent with signature
