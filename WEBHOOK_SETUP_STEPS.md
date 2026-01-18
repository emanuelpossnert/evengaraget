# Webhook Setup - Steg för Steg

## 🔴 **PROBLEM**
`booking_confirmations` tabellen existerar inte med rätt kolumner.

## 🟢 **LÖSNING - SAFE MIGRATION**

### **STEG 1: Kör SAFE MIGRATION-scriptet**

**File:** `/supabase/SAFE_MIGRATE_WEBHOOK_TABLES.sql`

**Vad det gör:**
1. ✅ **BACKAR UP** all gammal data (3 backup-tabeller skapas)
2. ✅ **DROPPAR** gamla, felaktiga tabeller (men data är sparad!)
3. ✅ **SKAPAR** NYA, RENA tabeller med alla kolumner
4. ✅ **MIGRERAR** data från backups → nya tabeller
5. ✅ **LÄGGER TILLBAKA** triggers & functions
6. ✅ **LÄGGER TILL** RLS policies
7. ✅ **VERIFIERAR** allt och rapporterar statistik

**Hur:**
```bash
# Öppna Supabase SQL Editor
# Kopiera innehållet från SAFE_MIGRATE_WEBHOOK_TABLES.sql
# Klistra in och kör "Run" knappen
# Du får en rapport med hur många records som migrerades
```

### **STEG 2: Verifiera med DIAGNOSE-scriptet**

**File:** `/supabase/DIAGNOSE_DATABASE.sql`

**Kör detta för att verifiera:**
- ✅ Alla tre tabeller existerar
- ✅ Alla kolumner finns
- ✅ Triggers är aktiva
- ✅ Inga fel i webhook_logs

**Output du bör se:**
```
booking_confirmations | 7 columns
outgoing_emails       | 11 columns
webhook_logs          | 7 columns

WEBHOOKS TABLES SETUP COMPLETE!
```

---

## 🎯 **TABELLER SCHEMA**

### **1. booking_confirmations**
```
id (UUID) - Primary Key
booking_id (UUID) - FK → bookings.id ⭐ VIKTIGT!
confirmation_sent_at (TIMESTAMP)
pdf_url (TEXT)
email_sent (BOOLEAN)
email_sent_at (TIMESTAMP)
error_message (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### **2. outgoing_emails**
```
id (UUID) - Primary Key
customer_id (UUID) - FK → customers.id
booking_id (UUID) - FK → bookings.id (optional)
recipient_email (VARCHAR)
subject (VARCHAR)
body_html (TEXT)
body_plain (TEXT)
email_type (VARCHAR) - 'booking_confirmation', 'custom_message'
sent_at (TIMESTAMP)
n8n_webhook_id (VARCHAR)
status (VARCHAR) - 'pending', 'sent', 'failed'
error_message (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### **3. webhook_logs**
```
id (UUID) - Primary Key
webhook_name (VARCHAR) - 'booking_confirmation', 'send_email'
event_type (VARCHAR) - 'booking_confirmed', 'email_sent'
data (JSONB) - Full event data
response (TEXT)
success (BOOLEAN)
error_message (TEXT)
created_at (TIMESTAMP)
```

---

## ⚡ **TRIGGERS**

### **Trigger 1: trg_booking_confirmation**
**När:** Booking status ändras till "confirmed"
**Vad den gör:**
- Skapar rad i `booking_confirmations`
- Loggar webhook-call i `webhook_logs`
- Ready för N8N webhook

### **Trigger 2: trg_email_sent**
**När:** Ny rad läggs in i `outgoing_emails`
**Vad den gör:**
- Loggar webhook-call i `webhook_logs`
- Ready för N8N webhook

---

## 🧪 **TESTING**

### **Test 1: Kolla webhook_logs**
```sql
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

### **Test 2: Uppdatera en bokning till "confirmed"**
```sql
UPDATE bookings 
SET status = 'confirmed' 
WHERE id = 'some-booking-id';

-- Kolla sedan webhook_logs och booking_confirmations
SELECT * FROM webhook_logs WHERE event_type = 'booking_confirmed';
SELECT * FROM booking_confirmations;
```

### **Test 3: Lägg till ett test-email**
```sql
INSERT INTO outgoing_emails (customer_id, recipient_email, subject, body_plain, email_type)
VALUES (
  'customer-uuid-here',
  'test@example.com',
  'Test Email',
  'This is a test email',
  'custom_message'
);

-- Kolla webhook_logs
SELECT * FROM webhook_logs WHERE event_type = 'email_sent';
```

---

## 📋 **NÄSTA STEG**

1. ✅ **Kör FIX_WEBHOOK_TABLES.sql** i Supabase
2. ✅ **Verifiera** med DIAGNOSE_DATABASE.sql
3. ✅ **Uppdatera Frontend** - Booking-sidan för att trigga webhooks
4. ✅ **Uppdatera Frontend** - Kundkort-mailen för att spara till `outgoing_emails`
5. ✅ **Skapa N8N Workflows** för webhooks
6. ✅ **Testa End-to-End**

---

## 🚨 **TROUBLESHOOTING**

### **Q: `booking_id` kolumnen existerar inte?**
- Kör FIX_WEBHOOK_TABLES.sql igen
- Verifiera med DIAGNOSE_DATABASE.sql

### **Q: Triggers startar inte?**
- Kolla webhook_logs tabell
- Verifiera att triggers finns: 
  ```sql
  SELECT * FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  ```

### **Q: Vilka RADER läggs in?**
```sql
-- Visa allt från webhook_logs
SELECT * FROM webhook_logs ORDER BY created_at DESC;

-- Visa status på emails
SELECT status, COUNT(*) FROM outgoing_emails GROUP BY status;

-- Visa booking confirmations
SELECT * FROM booking_confirmations;
```

---

## 📞 **SUPPORT**

Om något inte fungerar:
1. Kör DIAGNOSE_DATABASE.sql
2. Kolla webhook_logs för errors
3. Verifiera alla kolumner finns
4. Läs error messages i webhook_logs.error_message

