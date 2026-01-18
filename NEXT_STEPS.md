# EventGaraget - Nästa Steg (Phase 2 fortsättning)

## ✅ Vad Vi Gjort Hittills

1. ✅ Dokumentation (PROJECT_PLAN.md, SUPABASE_SCHEMA_v2.md, N8N_WORKFLOWS.md, FRONTEND_SPECS.md)
2. ✅ Supabase Schema (schema-v2.sql skapat)
3. ✅ Google Sheets IDs identifierade

## 🚀 Nästa Steg (Du Måste Göra)

### STEG 1: Rensa Supabase Database (5 minuter)

Kör denna SQL i Supabase SQL Editor:

```sql
-- Drop all tables
DROP TABLE IF EXISTS ai_analytics CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS escalations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS booking_items CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

**Vänta tills den är klar**, sen:

### STEG 2: Kör schema-v2.sql (1-2 minuter)

1. Öppna `/supabase/schema-v2.sql`
2. Ctrl+A (select all)
3. Gå till Supabase SQL Editor > New Query
4. Ctrl+V (paste)
5. Click "Run"

**Verifiera:**
```sql
SELECT COUNT(*) FROM products;
-- Should return: 10
```

---

## 📊 Google Sheets Integration

Dina Google Sheets är redo att användas i n8n:

### Price List:
- **Document ID:** `1yiEYoKFYx-Y018NiL2sg54lXjq_CjJ1DGtbuVv1cGsw`
- **Vad du ska göra:** Kolla vilka Sheet-namn du har (se flikar längst ner)
- **Exempel namn:** "PriceList_template", "Prislista", etc.

### FAQ:
- **Document ID:** `1gX3lQ5Ns5n5-cwqT4fAuU3Spcx86UtUPcUeWPNj2tAQ`
- **Vad du ska göra:** Kolla vilka Sheet-namn du har
- **Exempel namn:** "FAQ_template", "FAQ", etc.

**Säg till mig exakta Sheet-namnen** så uppdaterar jag n8n-workflowsen!

---

## 🎯 Nästa Fas (Jag Gör)

När Supabase är klart + du säger Sheet-namnen:

1. ✅ Uppdatera n8n Workflow 1 (Email Classification) med dina Google Sheets
2. ✅ Uppdatera n8n Workflow 2 (Quotation Generation)
3. ✅ Uppdatera n8n Workflow 3 (Escalation Handler)
4. ✅ Uppdatera n8n Workflow 4 (Reminders)
5. ✅ Ge dig JSON-filer redo för import i n8n

---

## 📋 Checklist

- [ ] Supabase database rensat (gamla tabeller borta)
- [ ] schema-v2.sql körts (nya tabeller + 10 produkter)
- [ ] Verifiera: `SELECT COUNT(*) FROM products;` returerar 10
- [ ] Ge mig exakta Sheet-namnen från Google Sheets

---

## 🔄 Timeline

**Idag:**
- Rensa Supabase (5 min)
- Kör schema-v2.sql (2 min)
- Säg mig Sheet-namnen (1 min)

**Imorgon:**
- Bygga n8n Workflows (3-4 timmar)
- Testa end-to-end (1 timmar)

---

**Säg till när Supabase är klar! 🚀**
