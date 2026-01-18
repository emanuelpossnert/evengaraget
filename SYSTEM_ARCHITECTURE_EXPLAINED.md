# 🏗️ SYSTEMET - HUR DET SKA FUNGERA

## 📊 ÖVERSIKT

EventGaraget AI Receptionist ersätter en **bokings- & kundsupport person**

```
KUND EMAIL IN
     ↓
SYSTEM LÄSER FRÅN GMAIL
     ↓
AI KLASSIFICERAR
     ↓
AI GENERERAR PERSONLIGT SVAR
     ↓
SVAR SKICKAS TILL KUND (INTE AGENT!)
     ↓
ALLT SPARAS I SUPABASE
```

---

## 🔴 PROBLEM: "Svar går till agent & inget sparas"

Det finns **3 möjliga orsaker**:

### Orsak 1: Email-adressen är fel
```
❌ FELAKT: Mail från admin@striky.se → system svarar till admin@striky.se
✅ RÄTT:   Mail från kunde@gmail.com → system svarar till kunde@gmail.com
```

### Orsak 2: Supabase RLS blockerar efter reset
```
Efter du resetade Supabase:
- RLS policies kan vara ENABLED
- HTTP requests får 403 Forbidden
- Data sparas INTE
```

### Orsak 3: HTTP vs Supabase nodes
```
HTTP Requests kan ha:
- Payload format-fel
- Authentication-problem
- Body-encoding issues

Supabase nodes är native och säkrare!
```

---

## 🎯 KOMPONENTER SOM SKA FINNAS

### 1. Gmail Trigger
```
Vad: Läser nya emails från inbox
Input: Gmail account
Output: Email data (From, To, Subject, Body, ThreadId, MessageId)

MÅSTE VARA:
✅ Aktiv (enabled)
✅ Polling varje minut
✅ Läser från INBOX bara
```

### 2. Extract Email
```
Vad: Parsar Gmail-datan
Input: Gmail email object
Output: 
{
  thread_id: "...",
  message_id: "...",
  from: "Kund Name <kunde@gmail.com>",
  to: "admin@striky.se",
  email_address: "kunde@gmail.com" ← VIKTIGT!
  subject: "...",
  body: "..."
}

MÅSTE VARA:
✅ Extrakt email_address från From-fältet
✅ email_address = KUNDENS mail (inte agent!)
```

### 3. Check Customer (Supabase)
```
Vad: Kollar om kund redan finns
Input: email_address
Query: SELECT * FROM customers WHERE email = 'kunde@gmail.com'
Output: Customer record eller empty array

MÅSTE VARA:
✅ Query Supabase customers table
✅ Använd email-address som nyckel
```

### 4. Get Price List (Google Sheets)
```
Vad: Hämtar produkter & priser
Input: Document ID från Google Sheets
Output: Array of products with prices

MÅSTE VARA:
✅ Rätt Sheet ID
✅ Rätt tab namn
✅ Produktdata uppdaterat
```

### 5. Get FAQ (Google Sheets)
```
Vad: Hämtar FAQ-svar
Input: Document ID från Google Sheets
Output: Array of FAQ items

MÅSTE VARA:
✅ Rätt Sheet ID
✅ Rätt tab namn
```

### 6. Merge Data
```
Vad: Kombinerar allt data för AI
Input: email_data + customer + priceList + faqList + history
Output: En stor JSON med ALLT

MÅSTE INNEHÅLLA:
✅ email_address (kundens mail!)
✅ priceList (alla produkter)
✅ faqList (alla svar)
✅ history (tidigare meddelanden)
```

### 7. AI Response
```
Vad: Genererar personligt svar med GPT-4
Input: Email + priceList + FAQ
Output: Text-svar från AI

SYSTEM PROMPT MÅSTE:
✅ Säga: "Rekommendera ENDAST dessa produkter"
✅ Säga: "ALDRIG uppfinna produkter"
✅ Inkludera priceList dynamiskt
✅ Svara personligt

USER PROMPT MÅSTE:
✅ Innehålla kundens epost
✅ Innehålla kundens fråga
```

### 8. Format Email
```
Vad: Förbereder email för Gmail
Input: AI response + emailData
Output: 
{
  to: "kunde@gmail.com" ← KUNDENS EMAIL!
  subject: "Re: ursprungligt_ämne",
  html: "formaterad email",
  responseText: "AI svar",
  ...emailData
}

MÅSTE VARA:
✅ to = emailData.email_address (KUNDENS mail!)
✅ subject = Re: + original subject
✅ html = formaterad HTML
```

### 9. Send Email (Gmail)
```
Vad: Skickar svaret
Input: {to, subject, html}
Output: Email skickad

MÅSTE VARA:
✅ to = kunde@gmail.com
✅ Skickas från admin@striky.se
✅ Inte loopa tillbaka!
```

### 10. Save Incoming Message (Supabase)
```
Vad: Sparar kundens message
Input: 
{
  conversation_id: "...",
  gmail_message_id: "...",
  from_email: "kunde@gmail.com",
  to_email: "admin@striky.se",
  subject: "...",
  body: "...",
  direction: "inbound",
  sender_type: "customer"
}

INSERT INTO messages VALUES (...)

MÅSTE VARA:
✅ conversation_id existerar
✅ gmail_message_id är unik
✅ from_email = kundens mail
✅ direction = "inbound"
```

### 11. Save Outgoing Message (Supabase)
```
Vad: Sparar AI-svaret
Input:
{
  conversation_id: "...",
  gmail_message_id: "...",
  from_email: "ai_agent@eventgaraget.se",
  to_email: "kunde@gmail.com",
  subject: "...",
  body: "ai_response",
  direction: "outbound",
  sender_type: "ai_agent"
}

INSERT INTO messages VALUES (...)

MÅSTE VARA:
✅ to_email = kundens mail
✅ direction = "outbound"
✅ sender_type = "ai_agent"
```

---

## 🔧 FELSÖKNING - 3 STEG

### STEG 1: Verifiera Supabase RLS

Gå till Supabase och kör:
```sql
-- Kolla RLS policy
SELECT * FROM pg_policies 
WHERE tablename IN ('customers', 'conversations', 'messages');

-- Om RLS är PÅ och blockerar:
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Verifiera tables existerar:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### STEG 2: Testa HTTP Request Payload

I n8n, lägg till console.log innan Supabase save:

```javascript
// I prepareIncomingMsg node:
console.log('📤 OUTGOING PAYLOAD:', JSON.stringify($json, null, 2));
return [$json];
```

Sedan i n8n logs, se exakt vad som skickas.

### STEG 3: Byte från HTTP til Supabase nodes

Om HTTP Request funkar inte → Använd native Supabase nodes:

```
✅ NATIVE SUPABASE NODE:
- Kan välja Table direkt
- Kan välja Action (Insert, Update, etc)
- Automatic authentication
- Bättre error messages

❌ HTTP REQUEST:
- Kräver manual REST API URL
- Kräver manual authentication
- Payload-format fel
- Svåra att debugga
```

---

## 📋 CHECKLISTA - VAD MÅSTE FINNAS

```
NODE                  VHAT IT DOES              STATUS
───────────────────────────────────────────────────────
gmailTrigger1         Läser email              [ ] Active?
extractEmail1         Parser email             [ ] email_address?
checkCustomer         Kollar kund i DB         [ ] Query rätt?
getPriceList1         Hämtar produkter         [ ] Rätt Sheet ID?
getFaq1               Hämtar FAQ               [ ] Rätt Sheet ID?
mergeData1            Kombinerar data          [ ] Innehåller allt?
findConversation      Kollar conversation DB   [ ] Queries rätt?
checkConversation     Ny eller gammal?         [ ] Logic ok?
createConversation    Skapar conversation      [ ] INSERT rätt?
getFinalConversationId Gets conversation_id   [ ] Extractor ok?
aiResponse1           Genererar svar           [ ] Prompt rätt?
formatEmail1          Formaterar email         [ ] to = kunde@gmail.com?
sendEmail1            Skickar email            [ ] Inte loopa?
prepareIncomingMsg    Parser för DB            [ ] Payload ok?
saveIncomingMsg       Sparar incoming          [ ] INSERT rätt?
prepareOutgoingMsg    Parser för DB            [ ] Payload ok?
saveOutgoingMsg       Sparar outgoing          [ ] INSERT rätt?
classifyIntent1       Klassificerar email      [ ] Behöv?
router1               Router till booking/faq  [ ] Behöv?
triggerQuotation1     Triggar workflow 2       [ ] Behöv?
```

---

## ✅ NÄSTA STEG

1. **Kolla Supabase RLS** - Är det disabled?
2. **Kolla n8n logs** - Vad säger error-meddelandena?
3. **Välj metod**: HTTP eller native Supabase nodes?
4. **Fixa 01-email-classification.json** med rätt konfiguration

