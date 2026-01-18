# ⚙️ SUPABASE NODE CONFIGURATION - ALLA SETTINGS

## 🎯 SUPABASE NODES I WORKFLOWS

Du har nu **5 Supabase-noder** att konfigurera:

```
WORKFLOW 1:
├─ Get Booking Details (Select)
├─ Get Customer Details (Select)
└─ Log Webhook Event (Insert)

WORKFLOW 2:
├─ Get Customer Email (Select)
└─ Log Email (Insert)
```

---

## 📋 WORKFLOW 1: BOOKING CONFIRMATION

### **NODE 1: Get Booking Details (SELECT) - TABLE: `bookings`**

**Klicka på noden → Fyll i:**

```
Credentials: [Supabase credential]

Operation: "get" (för en post) eller "get many" (för flera)
Resource: "Database"

TABLE: bookings
├─ Columns to fetch:
│  ├─ id
│  ├─ booking_number
│  ├─ event_date
│  ├─ location
│  ├─ total_amount
│  └─ products_requested
│
Limit: 1

WHERE Condition:
  Field: id
  Condition: equals
  Value: $json.record.booking_id
```

**Database Schema (bookings):**
```sql
- id (UUID)
- booking_number (text)
- event_date (date)
- location (text)
- total_amount (numeric)
- products_requested (jsonb)
- customer_id (UUID) [FK]
```

**Resultat:** Hämtar EN bokning från `bookings`-tabellen baserat på booking_id från webhook.

---

### **NODE 2: Get Customer Details (SELECT) - TABLE: `customers`**

**Klicka på noden → Fyll i:**

```
Credentials: [Supabase credential]

Operation: "get" (för en post) eller "get many" (för flera)
Resource: "Database"

TABLE: customers
├─ Columns to fetch:
│  ├─ email
│  ├─ name
│  └─ phone
│
Limit: 1

WHERE Condition:
  Field: id
  Condition: equals
  Value: $input.first().json[0].customer_id
  (Hämtar customer_id från förra noden)
```

**Database Schema (customers):**
```sql
- id (UUID)
- email (text)
- name (text)
- phone (text)
- ... (andra fält)
```

**Resultat:** Hämtar kunduppgifter (email, name, phone) från `customers`-tabellen.

---

### **NODE 3: Log Webhook Event (INSERT) - TABLE: `webhook_logs`**

**Klicka på noden → Fyll i:**

```
Credentials: [Supabase credential]

Operation: "create"
Resource: "Database"

TABLE: webhook_logs
├─ Fields to insert:
│  ├─ event_type: "booking_confirmation_sent"
│  ├─ table_name: "booking_confirmations"
│  ├─ booking_id: $json.booking_id
│  ├─ payload: $json.subject
│  ├─ status: "success"
│  └─ created_at: NOW()
```

**Database Schema (webhook_logs):**
```sql
- id (UUID)
- event_type (text) ← "booking_confirmation_sent"
- table_name (text) ← "booking_confirmations"
- booking_id (UUID)
- payload (text)
- status (text) ← "success"
- created_at (timestamp)
- error_message (text, nullable)
```

**Resultat:** Loggar webhook-event till `webhook_logs`-tabellen för spårning och debugging.

---

## 📋 WORKFLOW 2: CUSTOMER EMAIL

### **NODE 1: Get Customer Email (SELECT) - TABLE: `customers`**

**Klicka på noden → Fyll i:**

```
Credentials: [Supabase credential]

Operation: "get"
Resource: "Database"
Action: "Select Records"

TABLE: customers
├─ Columns to fetch:
│  ├─ email
│  └─ name
│
Limit: 1

WHERE Condition:
  Field: id
  Condition: equals
```

**Database Schema (customers):**
```sql
- id (UUID)
- email (text)
- name (text)
- phone (text)
- ... (andra fält)
```

**Resultat:** Hämtar kundens email och namn från `customers`-tabellen baserat på customer_id från HTTP POST.

---

### **NODE 2: Log Email (INSERT) - TABLE: `outgoing_emails`**

**Klicka på noden → Fyll i:**

```
Credentials: [Supabase credential]

Operation: "create"
Resource: "Database"
Action: "Insert Record"

TABLE: outgoing_emails
├─ Fields to insert:
│  ├─ customer_id: $json.customer_id
│  ├─ subject: $json.subject
│  ├─ body_html: $json.body_html
│  ├─ status: "sent"
│  └─ created_at: NOW()
```

**Database Schema (outgoing_emails):**
```sql
- id (UUID)
- customer_id (UUID)
- subject (text)
- body_html (text)
- status (text) ← "sent"
- created_at (timestamp)
- ... (andra fält)
```

**Resultat:** Loggar skickad email till `outgoing_emails`-tabellen för spårning.

---

## 🎨 STEG-FÖR-STEG I N8N

### **Så konfigurerar du en Supabase-nod:**

1. **Klicka på noden** i workflow
2. **Credentials:** Dropdown → Select Supabase
3. **Operation:** Välj "Read" (Select) eller "Create" (Insert)
4. **Resource:** "Database"
5. **Action:** 
   - For SELECT: "Select Records"
   - For INSERT: "Insert Record"
6. **Table:** Välja tabell från dropdown
7. **Fyll i parametrar** (se ovan för varje nod)
8. **Test:** Click "Test" button
9. **Save:** Ctrl+S

---

## 📊 EXPRESSIONS & VARIABLES

### **Använd dessa i Value-fälten:**

```
$json.record.booking_id
  → Från webhook payload (booking_confirmations INSERT)

$json.customer_id
  → Från HTTP POST (CRM email-knapp)

$json.subject
  → Custom subject från webhook

$json.message
  → Custom message från webhook

$input.first().json[0].customer_id
  → Från tidigare nod's output

new Date().toISOString()
  → Aktuell timestamp
```

---

## ✅ CONFIGURATION CHECKLIST

### **WORKFLOW 1 - Booking Confirmation:**

- [ ] Get Booking Details:
  - [ ] Credentials connected
  - [ ] Table: bookings
  - [ ] Where ID = $json.record.booking_id
  
- [ ] Get Customer Details:
  - [ ] Credentials connected
  - [ ] Table: customers
  - [ ] Where ID = from booking (see expression)
  
- [ ] Log Webhook Event:
  - [ ] Credentials connected
  - [ ] Table: webhook_logs
  - [ ] Insert all fields

### **WORKFLOW 2 - Customer Email:**

- [ ] Get Customer Email:
  - [ ] Credentials connected
  - [ ] Table: customers
  - [ ] Where ID = $json.customer_id
  
- [ ] Log Email:
  - [ ] Credentials connected
  - [ ] Table: email_logs
  - [ ] Insert all fields

---

## 🧪 TEST EACH NODE

Efter konfiguration:

1. **Click node** → **"Test"**
2. **Provide test data:**
   
   For Workflow 1:
   ```json
   {
     "record": {
       "booking_id": "test-123",
       "customer_id": "cust-456",
       "token": "token-789"
     }
   }
   ```
   
   For Workflow 2:
   ```json
   {
     "customer_id": "cust-456",
     "subject": "Test",
     "message": "Test message"
   }
   ```

3. **Check output** - Ska visa data från Supabase

---

## 🚨 COMMON MISTAKES

### ❌ **Mistake 1: Credentials not selected**
```
Symptoms: Red X on node, error "No credentials"
Fix: Click credentials dropdown → Select Supabase
```

### ❌ **Mistake 2: Wrong table name**
```
Symptoms: Error "Table not found"
Fix: Use exact table name (bookings, customers, webhook_logs, email_logs)
```

### ❌ **Mistake 3: Wrong WHERE expression**
```
Symptoms: No data returned
Fix: Make sure expression matches incoming data
     Verify: $json.record.booking_id vs $json.booking_id
```

### ❌ **Mistake 4: Missing fields in INSERT**
```
Symptoms: Error "Required field missing"
Fix: Check which fields are NOT NULL in database
     Fill in all required fields
```

---

## 📌 DATABASE SCHEMA REFERENCE

### **Tables du hämtar/skriver till:**

#### **1. bookings (SELECT)**
```sql
TABLE: public.bookings
Columns:
├─ id (UUID, Primary Key)
├─ booking_number (text)
├─ event_date (date)
├─ location (text)
├─ total_amount (numeric)
├─ products_requested (jsonb)
├─ customer_id (UUID, Foreign Key → customers.id)
└─ status (text) ← 'confirmed', 'pending', etc.
```

#### **2. customers (SELECT)**
```sql
TABLE: public.customers
Columns:
├─ id (UUID, Primary Key)
├─ email (text)
├─ name (text)
├─ phone (text)
└─ ... (övriga fält)
```

#### **3. webhook_logs (INSERT)**
```sql
TABLE: public.webhook_logs
Columns:
├─ id (UUID, Primary Key)
├─ event_type (text)           ← "booking_confirmation_sent"
├─ table_name (text)           ← "booking_confirmations"
├─ booking_id (UUID)
├─ payload (text)              ← Email subject eller message
├─ status (text)               ← "success" eller "error"
├─ error_message (text, NULL)
└─ created_at (timestamp)      ← NOW()
```

#### **4. outgoing_emails (INSERT)**
```sql
TABLE: public.outgoing_emails
Columns:
├─ id (UUID, Primary Key)
├─ customer_id (UUID)
├─ subject (text)
├─ message (text)
├─ status (text)               ← "sent"
├─ created_at (timestamp)      ← NOW()
└─ ... (andra fält)
```

---

## 🔄 DATA FLOW OVERVIEW

### **Workflow 1:**
```
Webhook Input
  ├─ record.booking_id
  ├─ record.customer_id
  └─ record.token
       ↓
Get Booking Details
  └─ booking data
       ↓
Get Customer Details
  └─ customer data
       ↓
Format Email
  └─ HTML email
       ↓
Send Email
       ↓
Log Webhook Event
  └─ INSERT to webhook_logs
```

### **Workflow 2:**
```
Webhook Input
  ├─ customer_id
  ├─ subject
  └─ message
       ↓
Get Customer Email
  └─ email & name
       ↓
Format Email
  └─ HTML email
       ↓
Send Email
       ↓
Log Email
  └─ INSERT to email_logs
       ↓
Respond to Webhook
```

---

## 💡 TIPS

- **Test early:** Test each node individually before activating workflow
- **Use expressions:** Don't hardcode values, use $json.field
- **Check database:** Verify table/field names in Supabase Console
- **Monitor logs:** Check N8N execution logs for errors
- **Verify credentials:** Make sure Supabase credential has correct permissions

---

## 🎯 NEXT STEPS

1. **Open each workflow** in N8N
2. **Configure each Supabase node** using settings above
3. **Test each node** individually
4. **Verify** no errors
5. **Activate workflows**
6. **Test end-to-end**

---

**Du är redo! Börja konfigurera noderna!** 🚀

