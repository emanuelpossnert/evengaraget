# ✅ ANVÄND DENNA NY WORKFLOW!

## 🎉 VAD SOM ÄR NYTT

Skapade: `01-email-classification-SUPABASE-NODES.json`

### ✅ FIXES:
1. **Native Supabase nodes** istället för HTTP
   - Checkboxes Customer: `SELECT * FROM customers WHERE email = ...`
   - Fetch History: `SELECT * FROM messages WHERE from_email = ...`
   - Find Conversation: `SELECT * FROM conversations WHERE gmail_thread_id = ...`
   - Create Conversation: `INSERT INTO conversations`
   - Save Messages: `INSERT INTO messages` (BOTH incoming + outgoing)

2. **INGEN "AI Agent" nämning** längre
   - AI Response nämner sig INTE som en agent
   - Säger bara "EventGaraget kundsupport"
   - sender_type: `"ai_support"` istället för `"ai_agent"`

3. **Rena Supabase integrations**
   - Inga HTTP request payload-problem
   - Direkta databas-operationer
   - Bättre error messages

---

## 🚀 ANVÄND SÅ HÄR:

### STEG 1: Delete gammal workflow
```
I n8n:
1. Gå till din "01-email-classification" workflow
2. Klicka "..." → Delete
3. Bekräfta
```

### STEG 2: Import ny workflow
```
1. I n8n, klicka "+ New" → "Import from file"
2. Välj: 01-email-classification-SUPABASE-NODES.json
3. Klicka "Import"
```

### STEG 3: Verifiera allt är connected
```
1. Se att alla 16 nodes är synliga
2. Se att alla connections är gröna
3. Toggle "Active" ON (grön knapp)
```

### STEG 4: Testa
```
1. Öppna Gmail
2. Från ANNAN account än admin@striky.se (VIKTIGT!)
3. Skicka email till admin@striky.se
4. Vänta 1-2 minuter
5. Se på:
   - Mottogs svar på din email?
   - Data i Supabase conversations?
   - Data i Supabase messages?
```

---

## 📊 VAD SKA SPARAS I SUPABASE

### conversations table:
```
- gmail_thread_id: (från din email)
- subject: (från din email)
- status: "active"
- type: "general"
- assigned_to: "ai_agent"
- customer_id: (ID eller null om ny)
```

### messages table (2 rows):

**Row 1 - Incoming (ditt email):**
```
- conversation_id: (samma som ovan)
- gmail_message_id: (unikt ID)
- from_email: din@email.com
- to_email: admin@striky.se
- direction: "inbound"
- sender_type: "customer"
- body: (ditt meddelande)
```

**Row 2 - Outgoing (AI svar):**
```
- conversation_id: (samma som ovan)
- gmail_message_id: (ditt message ID)
- from_email: "kundsupport@eventgaraget.se"
- to_email: din@email.com
- direction: "outbound"
- sender_type: "ai_support"
- body: (AI:s svar)
```

---

## 🆘 OM DET FORTFARANDE INTE FUNKAR

### Problem: "Supabase not configured"
```
→ Verifiera credentials i n8n
→ Settings → Credentials → "Supabase account" är rätt?
```

### Problem: "Column not found" error
```
→ Verifiera table struktur i Supabase:
  SQL Editor → SELECT * FROM messages LIMIT 1;
→ Kolumner måste vara exakt:
  - conversation_id (uuid)
  - gmail_message_id (varchar)
  - from_email (varchar)
  - to_email (varchar)
  - subject (varchar)
  - body (text)
  - body_plain (text)
  - direction (varchar)
  - sender_type (varchar)
```

### Problem: "Row Level Security violation"
```
→ I Supabase SQL Editor, kör:
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
```

---

## ✅ EXPECTED RESULT

**Du skickar email:**
```
Från: test@gmail.com
Till: admin@striky.se
Ämne: "Hej, vill hyra ett tält"
```

**Du mottar email från:**
```
Från: admin@striky.se
Till: test@gmail.com
Ämne: "Re: Hej, vill hyra ett tält"
Body: "Tack för din förfrågan! Vi har följande tält tillgängliga..."
       (INTE "Jag är en AI agent")
```

**I Supabase conversations:**
```
1 row med din thread_id och subject
```

**I Supabase messages:**
```
2 rows - en inbound, en outbound
```

---

**Nu ska det fungera! 🚀**

