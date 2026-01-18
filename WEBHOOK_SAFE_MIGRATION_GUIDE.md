# 🛡️ SAFE WEBHOOK MIGRATION GUIDE

## 🎯 Vad Detta Script Gör

Det här scriptet migrerar webhook-tabeller **UTAN att förlora någon data**.

### **Steg-för-Steg Flöde:**

```
1. BACKUP PHASE ✅
   ├─ Skapar: webhook_logs_backup
   ├─ Skapar: outgoing_emails_backup
   └─ Skapar: booking_confirmations_backup
      └─ Kopierar ALL gammal data härifrån

2. MIGRATION PHASE ✅
   ├─ Disabler gamla triggers (för att undvika konflikter)
   ├─ Droppar gamla tabeller (DATA är sparad i backups!)
   ├─ Skapar nya, rena tabeller
   └─ Migrerar data från backups → nya tabeller

3. TRIGGER PHASE ✅
   ├─ Skapar nya, uppdaterade functions
   ├─ Skapar nya triggers
   ├─ Enabler triggers igen
   └─ Ready för production!

4. VERIFICATION PHASE ✅
   ├─ Visar backup-tabeller skapade
   ├─ Visar nya prod-tabeller
   ├─ Visar hur många records migrerades
   └─ Visar att triggers är aktiva
```

---

## 📊 DATA FLOW

### **Scenario 1: Du har gamla webhook logs**

```
INNAN:
  webhook_logs (with problems)
  ├─ 50 rows

EFTER:
  webhook_logs_backup (original copy)
  ├─ 50 rows (sparad för referens)
  
  webhook_logs (NEW & CLEAN)
  ├─ 50 rows (migrerad från backup)
```

### **Scenario 2: Du har gamla emails**

```
INNAN:
  outgoing_emails (with problems)
  ├─ 100 rows

EFTER:
  outgoing_emails_backup (original copy)
  ├─ 100 rows (sparad för referens)
  
  outgoing_emails (NEW & CLEAN)
  ├─ 100 rows (migrerad från backup)
```

### **Scenario 3: Tom/felaktig tabell**

```
INNAN:
  booking_confirmations (empty or broken)
  ├─ 0 rows eller garbage data

EFTER:
  booking_confirmations_backup (original copy)
  ├─ 0 rows (empty backup)
  
  booking_confirmations (NEW & CLEAN)
  ├─ 0 rows (renstart)
```

---

## ✅ VAD FÖRSVINNER INTE

| Data | Försvinner? | Varför? |
|------|-----------|---------|
| Bookings | ❌ NEJ | Tabellen touchas aldrig |
| Customers | ❌ NEJ | Tabellen touchas aldrig |
| Products | ❌ NEJ | Tabellen touchas aldrig |
| Products_addons | ❌ NEJ | Tabellen touchas aldrig |
| User_profiles | ❌ NEJ | Tabellen touchas aldrig |
| **Webhook logs** | ✅ SPARAD | Migreras till ny tabell |
| **Outgoing emails** | ✅ SPARAD | Migreras till ny tabell |
| **Booking confirmations** | ✅ SPARAD | Migreras till ny tabell |

---

## 🧪 TESTING

### **Efter migrationen, testa:**

```sql
-- 1. Verifiera att data migrerades
SELECT 'webhook_logs', COUNT(*) FROM webhook_logs
UNION ALL
SELECT 'outgoing_emails', COUNT(*) FROM outgoing_emails
UNION ALL
SELECT 'booking_confirmations', COUNT(*) FROM booking_confirmations;

-- 2. Verifiera backups existerar
SELECT 'webhook_logs_backup', COUNT(*) FROM webhook_logs_backup
UNION ALL
SELECT 'outgoing_emails_backup', COUNT(*) FROM outgoing_emails_backup
UNION ALL
SELECT 'booking_confirmations_backup', COUNT(*) FROM booking_confirmations_backup;

-- 3. Verifiera triggers är aktiva
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name IN ('trg_booking_confirmation', 'trg_email_sent');

-- 4. Testa trigger: uppdatera bokning till "confirmed"
UPDATE bookings SET status = 'confirmed' WHERE id = 'test-booking-uuid' LIMIT 1;

-- 5. Kolla webhook_logs för ny entry
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1;
```

---

## 🛑 OM NÅGOT GÅR GALET

### **Scenario: "Migrationen misslyckades!"**

**Lösning:**
1. All data finns fortfarande i **backup-tabellerna**
2. Nya tabeller är tomma (safe state)
3. Du kan köra scriptet igen
4. Eller manuellt kopiera från backups:

```sql
INSERT INTO booking_confirmations 
SELECT * FROM booking_confirmations_backup;

INSERT INTO outgoing_emails 
SELECT * FROM outgoing_emails_backup;

INSERT INTO webhook_logs 
SELECT * FROM webhook_logs_backup;
```

### **Scenario: "Jag vill återställa gamla tabeller"**

**Om du ändrar dig:**
```sql
-- 1. Droppa nya tabeller
DROP TABLE booking_confirmations;
DROP TABLE outgoing_emails;
DROP TABLE webhook_logs;

-- 2. Skapa från backups igen
CREATE TABLE booking_confirmations AS SELECT * FROM booking_confirmations_backup;
CREATE TABLE outgoing_emails AS SELECT * FROM outgoing_emails_backup;
CREATE TABLE webhook_logs AS SELECT * FROM webhook_logs_backup;

-- 3. Lägg tillbaka triggers
-- (samma process som i scriptet)
```

---

## 📋 STEG-FÖR-STEG INSTRUKTIONER

### **1. Öppna Supabase SQL Editor**
```
https://app.supabase.com
  → Din projekt
  → SQL Editor
  → New Query
```

### **2. Kopiera innehållet från:**
```
supabase/SAFE_MIGRATE_WEBHOOK_TABLES.sql
```

### **3. Klistra in i SQL Editor**

### **4. Klicka "Run"**

### **5. Vänta på rapport:**
Du bör se något som:

```
SAFE WEBHOOK MIGRATION COMPLETE! ✅

Backup Tables Created:
- webhook_logs_backup
- outgoing_emails_backup
- booking_confirmations_backup

New Production Tables:
- booking_confirmations | 9 columns
- outgoing_emails | 12 columns
- webhook_logs | 7 columns

Data Migration Summary:
- booking_confirmations | 5 migrated_records
- outgoing_emails | 15 migrated_records
- webhook_logs | 42 migrated_records

Triggers Active:
- trg_booking_confirmation on bookings
- trg_email_sent on outgoing_emails
```

### **6. Klart! ✅**

---

## 🧹 CLEANUP (OPTIONAL)

**Efter migrationen, om allt fungerar bra, kan du ta bort backups:**

```sql
DROP TABLE webhook_logs_backup;
DROP TABLE outgoing_emails_backup;
DROP TABLE booking_confirmations_backup;
```

(Men du kan också lämna dem för framtida referens)

---

## 🚀 NÄSTA STEG

När migrationen är klar:

1. ✅ Verifiera med DIAGNOSE_DATABASE.sql
2. ✅ Uppdatera Frontend - Booking-sidan
3. ✅ Uppdatera Frontend - Kundkort-mailen
4. ✅ Skapa N8N Workflows
5. ✅ Testa End-to-End

---

## 📞 SUPPORT

Om något inte fungerar:
- Kolla webhook_logs för error_message
- Verifiera att backups existerar
- Kör DIAGNOSE_DATABASE.sql
- Läs error messages i scriptets output

