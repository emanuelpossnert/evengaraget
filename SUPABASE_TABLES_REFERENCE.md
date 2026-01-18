# 📊 EventGaraget - Alla Supabase Tabeller

## HUVUDTABELLER (Core)

### 1. **customers**
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- full_name (VARCHAR) [eller 'name']
- phone (VARCHAR)
- company_name (VARCHAR)
- org_number (VARCHAR)
- billing_street (VARCHAR) [eller 'address']
- billing_postal_code (VARCHAR)
- billing_city (VARCHAR)
- delivery_street (VARCHAR)
- delivery_postal_code (VARCHAR)
- delivery_city (VARCHAR)
- notes (TEXT)
- status (VARCHAR) - 'active', 'inactive'
- customer_type (VARCHAR) - 'private', 'business', 'vip'
- created_at, updated_at
- last_contact_at
- total_bookings (INT)
- total_revenue (DECIMAL)
```

### 2. **bookings**
```sql
- id (UUID, PK)
- booking_number (VARCHAR, UNIQUE)
- customer_id (UUID, FK → customers)
- quotation_id (UUID, FK → quotations)
- status (VARCHAR) - 'draft', 'pending', 'confirmed', 'completed', 'cancelled'
- event_date (DATE)
- event_end_date (DATE)
- delivery_date (DATE)
- pickup_date (DATE)
- location (VARCHAR)
- delivery_street_address (VARCHAR)
- delivery_postal_code (VARCHAR)
- delivery_city (VARCHAR)
- delivery_instructions (TEXT)
- products_requested (JSONB) - [{"name", "quantity", "wrapping_requested"}]
- wrapping_selected (JSONB) - []
- total_amount (DECIMAL)
- tax_amount (DECIMAL)
- deposit_amount (DECIMAL)
- payment_status (VARCHAR) - 'unpaid', 'partial', 'paid'
- payment_method (VARCHAR)
- contract_signed (BOOLEAN)
- contract_signed_at (TIMESTAMP)
- requires_setup (BOOLEAN)
- setup_date (DATE)
- requires_delivery (BOOLEAN)
- delivery_time_slot (VARCHAR)
- internal_notes (TEXT)
- customer_notes (TEXT)
- conversation_id (UUID, FK → conversations)
- created_at, updated_at
```

### 3. **quotations**
```sql
- id (UUID, PK)
- booking_id (UUID, FK → bookings)
- customer_id (UUID, FK → customers)
- quotation_number (VARCHAR)
- total_amount (DECIMAL)
- tax_amount (DECIMAL)
- tax_percent (DECIMAL)
- discount_amount (DECIMAL)
- signature_token (UUID)
- signature_link (VARCHAR)
- status (VARCHAR) - 'draft', 'sent', 'signed', 'invoiced'
- valid_until (DATE)
- signed_at (TIMESTAMP)
- terms_and_conditions (TEXT)
- notes (TEXT)
- products_json (TEXT) - JSON string
- pdf_url (TEXT)
- addon_notes (TEXT)
- created_by (VARCHAR)
- signing_token (VARCHAR)
- signature_url (TEXT)
- customer_signature (BYTEA)
- created_at, updated_at
```

### 4. **products**
```sql
- id (UUID, PK)
- name (VARCHAR)
- category (VARCHAR)
- description (TEXT)
- price_per_day (DECIMAL)
- image_url (TEXT)
- stock_quantity (INT)
- status (VARCHAR) - 'active', 'inactive'
- created_at, updated_at
```

### 5. **messages**
```sql
- id (UUID, PK)
- conversation_id (UUID, FK → conversations)
- from_email (VARCHAR)
- to_email (VARCHAR)
- subject (VARCHAR)
- body (TEXT)
- body_plain (TEXT)
- direction (VARCHAR) - 'inbound', 'outbound'
- sender_type (VARCHAR) - 'customer', 'agent'
- sentiment (VARCHAR)
- ai_classified_intent (VARCHAR)
- ai_confidence (DECIMAL)
- gmail_message_id (VARCHAR)
- created_at
```

### 6. **conversations**
```sql
- id (UUID, PK)
- conversation_id (VARCHAR, UNIQUE) - Gmail thread ID
- customer_id (UUID, FK → customers)
- subject (VARCHAR)
- status (VARCHAR) - 'active', 'resolved', 'pending', 'escalated'
- type (VARCHAR) - 'booking', 'support', 'quote', 'complaint'
- sentiment (DECIMAL)
- priority (VARCHAR) - 'low', 'normal', 'high', 'urgent'
- human_takeover (BOOLEAN)
- human_takeover_reason (TEXT)
- assigned_to (VARCHAR)
- booking_id (UUID, FK → bookings)
- created_at, updated_at
- first_response_at (TIMESTAMP)
- resolved_at (TIMESTAMP)
```

---

## SUPPORT-TABELLER

### 7. **addons** [valfria tillägg]
```sql
- id (UUID, PK)
- name (VARCHAR)
- category (VARCHAR)
- description (TEXT)
- price (DECIMAL)
- wrapping_required (BOOLEAN)
- created_at, updated_at
```

### 8. **quotation_addons**
```sql
- id (UUID, PK)
- quotation_id (UUID, FK → quotations)
- addon_id (UUID, FK → addons)
- quantity (INT)
- price (DECIMAL)
- created_at
```

### 9. **faq**
```sql
- id (UUID, PK)
- question (TEXT)
- answer (TEXT)
- category (VARCHAR)
- priority (INT)
- created_at, updated_at
```

### 10. **quotation_events** [för webhook-triggering]
```sql
- id (UUID, PK)
- quotation_id (UUID, FK → quotations)
- booking_id (UUID, FK → bookings)
- event_type (VARCHAR) - 'signed', 'created', 'sent'
- event_data (JSONB)
- created_at
```

### 11. **user_profiles** [för CRM-portalen]
```sql
- id (UUID, PK, FK → auth.users)
- email (VARCHAR, UNIQUE)
- full_name (VARCHAR)
- role (VARCHAR) - 'admin', 'manager', 'warehouse', 'support'
- avatar_url (TEXT)
- created_at, updated_at
```

### 12. **invoices**
```sql
- id (UUID, PK)
- booking_id (UUID, FK → bookings)
- customer_id (UUID, FK → customers)
- invoice_number (VARCHAR)
- total_amount (DECIMAL)
- tax_amount (DECIMAL)
- status (VARCHAR) - 'draft', 'sent', 'paid', 'overdue'
- due_date (DATE)
- paid_date (DATE)
- payment_method (VARCHAR)
- notes (TEXT)
- pdf_url (TEXT)
- created_at, updated_at
```

---

## ANALYTICS-TABELLER (Optional)

### 13. **interactions**
```sql
- id (UUID, PK)
- customer_id (UUID, FK → customers)
- interaction_type (VARCHAR)
- details (TEXT)
- created_at
```

### 14. **ai_analytics**
```sql
- id (UUID, PK)
- query (TEXT)
- response (TEXT)
- intent (VARCHAR)
- confidence (DECIMAL)
- created_at
```

### 15. **booking_items** / **booking_products**
```sql
- id (UUID, PK)
- booking_id (UUID, FK → bookings)
- product_name (VARCHAR)
- quantity (INT)
- price_per_unit (DECIMAL)
- total_price (DECIMAL)
- category (VARCHAR)
- notes (TEXT)
- created_at
```

---

## LAGRING

### 16. **Storage Bucket: 'signed-quotations'**
- Lagrar PDF-kopior av signerade offert
- Public/Private access

---

## 🔑 RELATIONER (Foreign Keys)

```
customers
  ↓
  ├→ bookings (customer_id)
  ├→ quotations (customer_id)
  ├→ conversations (customer_id)
  ├→ invoices (customer_id)
  └→ messages (via conversations)

bookings
  ├→ quotations (booking_id)
  ├→ quotation_addons (via quotations)
  ├→ booking_products (booking_id)
  └→ messages (via conversations)

quotations
  ├→ quotation_addons (quotation_id)
  ├→ addons (via quotation_addons)
  └→ quotation_events (quotation_id)

products
  └→ (standalone, referenced by booking_products via name)
```

---

## 📋 VILKA TABELLER ANVÄNDER VI?

**Aktiva (idag):**
- ✅ customers
- ✅ bookings
- ✅ quotations
- ✅ messages
- ✅ conversations
- ✅ products
- ✅ addons
- ✅ quotation_addons
- ✅ quotation_events
- ✅ user_profiles (ny)

**Snart:**
- 🔄 invoices
- 🔄 booking_products / booking_items

**Framtida:**
- ⏳ ai_analytics
- ⏳ interactions
- ⏳ customer_profiles

