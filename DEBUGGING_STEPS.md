# 🔍 DEBUGGING - STEG FÖR STEG

## 🎯 VAD VI MÅSTE VERIFIERA

```
1. Supabase - Är RLS disabled? Existerar tables?
2. n8n - Vad säger logs när email kommer in?
3. HTTP vs Supabase - Vilken metod funkar?
4. Email-adress - Är den rätt utstruken?
5. Payload - Vad skickas faktiskt till Supabase?
```

---

## STEG 1: SUPABASE RLS CHECK (GÖR NU!)

Gå till: supabase.com → Din projekt → SQL Editor

Kör denna query:
```sql
-- 1. Kolla om RLS är PÅ
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('customers', 'conversations', 'messages');

-- 2. Om row_level_security = true → RLS ÄR PÅ!
-- Då måste vi disabla den:

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;  
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 3. Verifiera tables existerar
\dt public.*

-- 4. Verifiera struktur
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';
```

**Vad ska du se:**
```
customers - RLS disabled ✅
conversations - RLS disabled ✅
messages - RLS disabled ✅

messages table har dessa kolumner:
- id (uuid)
- conversation_id (uuid) 
- gmail_message_id (varchar)
- from_email (varchar)
- to_email (varchar)
- subject (varchar)
- body (text)
- body_plain (text)
- direction (varchar) - "inbound" eller "outbound"
- sender_type (varchar) - "customer" eller "ai_agent"
- created_at (timestamp)
```

**Om något är fel:** Rapport tillbaka här vilket error du ser!

---

## STEG 2: N8N LOGS CHECK (GÖR EFTER TEST-EMAIL)

1. **Öppna n8n** → http://localhost:5678
2. **Hitta workflow** → "01-email-classification"
3. **Kolla status** → Ska vara "Active" (grön toggle)
4. **Skicka test-email:**
   - Från: `test@gmail.com` (ANNAN än admin@striky.se!)
   - Till: `admin@striky.se`
   - Ämne: `Test AI Receptionist`
5. **Vänta 1-2 minuter**
6. **Kolla Execution:**
   - Gå till "Executions" tab
   - Hitta senaste run
   - Klicka på den

**Vad du ska leta efter i logs:**
```
❌ Röda errors?
❌ "RLS policy" error?
❌ "Authentication" error?
❌ "Not null violation"?

✅ Vilken node stoppar?
```

**Dokumentera detta:**
```
Execution status: [SUCCESS/ERROR]
Error node: [vilken node?]
Error message: [exakt text]
```

---

## STEG 3: PAYLOAD DEBUG

Om du ser error i `saveIncomingMsg` eller `saveOutgoingMsg`:

**Lägg till debug-node före save:**

I n8n, redigera `prepareIncomingMsg`:

```javascript
// Lägg till denna rad:
console.log('📤 FINAL PAYLOAD BEFORE SAVE:', JSON.stringify($json, null, 2));

// Sedan i execution logs, se vad som skickas!
```

Kolla n8n logs och se exakt JSON som skickas!

**Vad ska du se:**
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "gmail_message_id": "1234567890",
  "from_email": "test@gmail.com",
  "to_email": "admin@striky.se",
  "subject": "Test",
  "body": "Test message",
  "direction": "inbound",
  "sender_type": "customer"
}
```

**Om något saknas:** Det är problemet!

---

## STEG 4: VERIFIERA EMAIL-ADRESS

Skicka test-email och kolla i n8n:

**I `extractEmail1` logs, se:**
```
Ska visa:
email_address: test@gmail.com ← KUNDENS MAIL!

Inte:
email_address: admin@striky.se ← AGENTENS MAIL!
```

**Om det visar agent-mailen:**
- Du testade från fel adress!
- Använd test@gmail.com (ANNAN account)

---

## STEG 5: HTTP REQUEST DEBUGGING

Om save-nodes använder HTTP (inte native Supabase nodes):

**Kolla HTTP response:**
1. I `saveIncomingMsg` node → Se "Response"
2. Kolla Status code:
   - `201` = Success ✅
   - `401` = Authentication error ❌
   - `403` = RLS blockerar ❌
   - `400` = Bad payload ❌

**Om 403 Forbidden:**
```
→ RLS är PÅ och blockerar!
→ Kör SQL: ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

**Om 400 Bad Request:**
```
→ Payload-format är fel!
→ Kontrollera kolumn-namn matchar
→ Se STEG 4 ovan
```

---

## STEG 6: NATIVE SUPABASE NODES (ALTERNATIV)

Om HTTP requests inte funkar, byt till native Supabase nodes:

**For `saveIncomingMsg`:**
1. Ta bort HTTP Request node
2. Lägg till **Supabase node**
3. Konfiguration:
   - Credential: "Supabase account"
   - Resource: "Row"
   - Operation: "Create"
   - Table: "messages"
   - Columns to insert:
     ```
     conversation_id (from $json.conversation_id)
     gmail_message_id (from $json.gmail_message_id)
     from_email (from $json.from_email)
     to_email (from $json.to_email)
     subject (from $json.subject)
     body (from $json.body)
     body_plain (from $json.body_plain)
     direction (from $json.direction)
     sender_type (from $json.sender_type)
     ```

**Fördelar:**
✅ Native Supabase integration
✅ Automatic authentication
✅ Bättre error messages
✅ Enklare debugging

---

## STEG 7: TEST FLOW

**1. Verifiera setup:**
```bash
[ ] Supabase RLS disabled
[ ] Tables existerar med rätt struktur
[ ] n8n workflow är ACTIVE
[ ] Credentials är korrekt
```

**2. Skicka test-email:**
```
Från: test@gmail.com (INTE admin@striky.se!)
Till: admin@striky.se
Ämne: "Test message"
Body: "Hej, kan du svara?"
```

**3. Vänta 1-2 minuter**

**4. Verifiera resultat:**
```
[ ] Email-svar mottogs på test@gmail.com
[ ] Data finns i Supabase conversations table
[ ] Data finns i Supabase messages table
[ ] n8n logs visar inga errors
```

---

## ✅ RAPPORTERING

Skicka detta till mig:

```
SUPABASE:
- RLS disabled? [JA/NEJ]
- Tables existerar? [JA/NEJ]
- Error message från SQL? [ingenting/...]

N8N LOGS:
- Execution status? [SUCCESS/ERROR]
- Vilken node stoppade? [...]
- Exakt error? [...]

EMAIL TEST:
- Skickade från: [...]
- Mottogs svar på: [JA/NEJ]
- Var svaret från: [admin@striky.se/annan]

SUPABASE DATA:
- Conversations table - rows? [0/1/mer]
- Messages table - rows? [0/1/mer]
```

