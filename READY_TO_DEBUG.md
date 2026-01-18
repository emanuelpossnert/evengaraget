# ✅ READY TO DEBUG - COMPLETE CHECKLIST

## 📋 FILER DU HAR NU

```
✅ 01-email-classification-FIXED.json  - VALID & READY
✅ SYSTEM_ARCHITECTURE_EXPLAINED.md    - Förklaring
✅ DEBUGGING_STEPS.md                  - Debug-guide
✅ CRITICAL_FIX_SUMMARY.md             - Root cause
✅ DEMO_READY_STATUS.md                - Status
```

---

## 🎯 VÅ SKA DU GÖRA NU? (60 minuter)

### STEG 1: Supabase RLS Check (10 min)

1. Gå till: https://supabase.com
2. Logga in på Strikyprojects
3. Öppna "SQL Editor"
4. Kör denna query:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('customers', 'conversations', 'messages');

-- If rowsecurity = true, disable it:
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;  
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Verify tables exist with right columns
\dt public.*
```

**Vad ska du se:**
```
conversations  | false (RLS disabled)
messages       | false (RLS disabled)
customers      | false (RLS disabled)
```

---

### STEG 2: Import Workflow in n8n (10 min)

1. Gå till: http://localhost:5678
2. Klicka: "+ New" → "Import from file"
3. Välj: `01-email-classification-FIXED.json`
4. Klicka: "Import"
5. Verifiera alla nodes är connected
6. Toggle "Active" ON (grön knapp)

---

### STEP 3: Send Test Email (5 min)

1. Öppna Gmail
2. **Från annan account än admin@striky.se** (viktigt!)
   - Test Gmail: `test@gmail.com` eller liknande
   - Personal account, inte striky
3. **Skicka email:**
   - To: `admin@striky.se`
   - Subject: `Test message`
   - Body: `Hej, kan du svara? Vill hyra ett tält för 50 personer`
4. **Vänta 1-2 minuter** (trigger kör varje minut)

---

### STEG 4: Check n8n Logs (20 min)

1. I n8n, gå till "Executions" tab
2. Hitta latest execution
3. Se om status är:
   - ✅ SUCCESS (grön) → Flödet fungerar!
   - ❌ ERROR (röd) → Se vilken node stoppade

**Om ERROR - What to check:**
```
Vilken node visar error?
- extractEmail1 → Email parsing error
- checkCustomer → Supabase connection error
- formatEmail1 → Email address missing
- saveIncomingMsg → Supabase INSERT error
- saveOutgoingMsg → Supabase INSERT error
```

Kopiera **exakt error message** och rapportera!

---

### STEG 5: Check Supabase Data (15 min)

1. I Supabase, gå till "Table Editor"
2. Klicka på "conversations" table
3. **Ska du se:**
   - 1+ row med din test-email
   - gmail_thread_id = thread från din test-email
   - subject = "Test message"

4. Klicka på "messages" table
5. **Ska du se:**
   - 2 messages:
     - 1x "inbound" (från dig)
     - 1x "outbound" (från AI)
   - from_email = din email adress
   - to_email = din email adress

---

## 📊 RAPPORTFORMAT

Skicka mig detta:

```
═══════════════════════════════════════════════════════

SUPABASE:
✓ RLS disabled? [JA/NEJ]
✓ Error message? [ingenting/...]

N8N WORKFLOW:
✓ Imported? [JA/NEJ]
✓ Active? [JA/NEJ]
✓ Execution status? [SUCCESS/ERROR]
✓ Error node? [vilken?]
✓ Error message? [text...]

EMAIL TEST:
✓ Från email? [vilken?]
✓ Mottogs svar? [JA/NEJ]
✓ Svar från? [admin@striky.se/annan]

SUPABASE DATA:
✓ conversations rows? [0/1/mer] 
✓ messages rows? [0/2/mer]

═══════════════════════════════════════════════════════
```

---

## 🆘 TROUBLESHOOTING

### Problem: "RLS Error" in n8n logs

**Fix:**
```sql
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

### Problem: "401 Unauthorized" error

**Check:**
- Supabase credentials är rätt i n8n
- API Key är valid
- Project URL är korrekt

### Problem: "Payload format error"

**Debug:**
- Se DEBUGGING_STEPS.md → STEG 3
- Lägg till console.log före save
- Se exakt vad som skickas

### Problem: Inget sparas men ingen error

**Check:**
- RLS är disabled? 
- `neverError: true` döljer errors!
- Se response i HTTP node

---

## ✅ NÄSTA STEG

1. Gör STEG 1-5 ovan
2. Rapportera resultatet
3. Vi fixar problemet tillsammans!

---

**Du är nära lösningen! 💪**

