# 🔧 n8n Workflow 01 - Configuration Guide

## The Problem
Workflow 01 exists but **conversation history is not being passed to the AI**. Each customer email is treated independently.

## The Solution
We need to:
1. ✅ Fetch previous messages from `messages` table
2. ✅ Format them into a readable conversation history
3. ✅ Add this to the AI system prompt
4. ✅ Ensure new messages are saved back to the database

---

## 📍 Key Nodes to Check/Fix

### Node 1: **Gmail Trigger** ✅ SHOULD WORK
- Triggers on new email
- Extracts: `from`, `subject`, `body`, `thread_id`
- **Status:** Likely already working

### Node 2: **Extract Email Data** ✅ SHOULD WORK
- Parse email into structured format
- **Current output should be:**
  ```json
  {
    "from": "customer@example.com",
    "subject": "Question about grillstation",
    "body": "Hi, what's the price?",
    "thread_id": "17a2c3d4e5f6g7h8",
    "timestamp": "2024-11-17T10:30:00Z"
  }
  ```

### Node 3: **Check/Create Customer** ✅ SHOULD WORK
- Supabase: `SELECT id FROM customers WHERE email = $1`
- If not found → Create new customer

### Node 4: **Find/Create Conversation** ✅ SHOULD EXIST
- Supabase: `SELECT id FROM conversations WHERE gmail_thread_id = $1`
- If not found → Create new conversation

### Node 5: **Fetch History** ⚠️ THIS NEEDS FIX/VERIFICATION

**What it should do:**
```javascript
// This node should query ALL messages in the conversation thread
SELECT 
  m.id,
  m.body,
  m.message_type,  // 'incoming' or 'outgoing'
  m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.gmail_thread_id = '{{ $json.thread_id }}'
ORDER BY m.created_at ASC
```

**How to set up in n8n:**
1. Add **Supabase node** named "fetchHistory"
2. Operation: `getAll`
3. Table: `messages`
4. Add JOIN to get conversation thread_id
5. Order by: `created_at ASC`

### Node 6: **Build Conversation History** ⚠️ THIS NEEDS TO BE CREATED

**Code Node (JavaScript):**
```javascript
// Input: All messages from fetchHistory
// Output: Formatted conversation string

const messagesData = $input.all();
let conversationHistory = "";

if (messagesData.length === 0) {
  // First message in thread
  conversationHistory = "Första meddelandet i denna konversation.";
} else {
  conversationHistory = "💬 TIDIGARE KONVERSATION MED DENNA KUND:\n\n";
  
  messagesData.forEach((msg) => {
    const body = msg.json.body || '';
    const type = msg.json.message_type === 'incoming' ? 'KUND' : 'EVENTGARAGET';
    const date = msg.json.created_at 
      ? new Date(msg.json.created_at).toLocaleDateString('sv-SE')
      : 'N/A';
    
    conversationHistory += `[${date}] ${type}:\n${body}\n\n`;
  });
}

return [{
  json: {
    ...($('mergeData').first().json || {}),  // Keep previous data
    conversationHistory: conversationHistory
  }
}];
```

### Node 7: **OpenAI (GPT-4o-mini)** ⚠️ NEEDS UPDATE

**System Prompt - ADD THIS:**

Current system prompt has lots of instructions. KEEP all of it, but ADD at the top:

```
💬 TIDIGARE KONVERSATION:
{{ $json.conversationHistory }}

INSTRUKTIONER:
1. Läs FULL konversationshistoriken ovan
2. Kom ihåg vad kunden redan frågat
3. Upprepa INTE information som redan diskuterades
4. REFERERA till tidigare svar om relevant
5. Bygg vidare på det kunden redan sagt

EXEMPEL:
- Om kund skrev "grillstation" tidigare → Du vet redan att de är intresserad
- Om de frågade om "pris" tidigare → Svara med kontext
- Om de nämnde "nov 8" tidigare → Du vet datumet
```

**Keep the existing instructions below this.**

---

## 🔌 Node Connections (Flow)

The workflow should look like this:

```
Gmail Trigger
    ↓
Extract Email
    ↓
Check/Create Customer
    ↓
Find/Create Conversation
    ↓
Fetch History ← KEY!
    ↓
Build Context ← KEY!
    ↓
Get Price List
    ↓
Get FAQ
    ↓
Merge Data
    ↓
OpenAI Response ← USES CONTEXT
    ↓
Format Email Response
    ↓
Save Incoming Message
    ↓
Save Outgoing Message
    ↓
Send Reply Email
```

---

## 💾 Save Messages Node

**After AI response, save to database:**

### Save Incoming Message:
```
Supabase Node: "saveIncomingMsg"
Operation: Insert
Table: messages
Fields:
  - conversation_id: {{ $json.conversation_id }}
  - from_email: {{ $json.from }}
  - to_email: {{ $json.to }}
  - body: {{ $json.body }}
  - message_type: "incoming"
  - subject: {{ $json.subject }}
```

### Save Outgoing Message:
```
Supabase Node: "saveOutgoingMsg"
Operation: Insert
Table: messages
Fields:
  - conversation_id: {{ $json.conversation_id }}
  - from_email: "bookings@eventgaraget.se"
  - to_email: {{ $json.from }}
  - body: {{ $json.response }}
  - message_type: "outgoing"
  - subject: "Re: " + {{ $json.subject }}
```

---

## 📊 Testing the Fix

### Test Case 1: First Email
```
FROM: customer@example.com
SUBJECT: Vad kostar grillstationen?
BODY: Hej, vi behöver grillstationen för 8 november. Vad kostar det?

EXPECTED:
- New customer created
- New conversation created
- No history (first message)
- AI asks follow-up questions about date, location, etc.
- Message saved to DB
```

### Test Case 2: Follow-up Email (Next Day)
```
FROM: customer@example.com
SUBJECT: Re: Vad kostar grillstationen?
BODY: Kommer till Andersvägen 4. Fyra gäster totalt. Behöver också LED-belysning.

EXPECTED:
- Customer found (no new creation)
- Conversation found (same thread_id)
- History fetched: Shows they asked about grillstation on day 1
- AI knows they want grillstation on Nov 8
- AI knows delivery is Andersvägen 4
- AI provides price with LED addon included
- NO repeat of information
- Message appended to conversation
```

### Test Case 3: Booking Question
```
FROM: customer@example.com
SUBJECT: Re: Vad kostar grillstationen?
BODY: Okej, jag vill boka detta. Kan ni skicka avtalet?

EXPECTED:
- AI sees full history of conversation
- Knows: Product (grillstation), Date (Nov 8), Location (Andersvägen 4), Addons (LED)
- Creates quote directly
- Sends signing link
- Response shows AI understood context
```

---

## 🔍 How to Verify It's Working

1. **Check n8n Execution:**
   - Go to Workflow 01 in n8n
   - Send test email
   - Check execution logs
   - Look for "Fetch History" node output
   - Should show previous messages (if any)

2. **Check Database:**
   ```sql
   -- See conversations
   SELECT * FROM conversations 
   WHERE gmail_thread_id = 'test-thread-id'
   ORDER BY updated_at DESC;
   
   -- See messages in that conversation
   SELECT * FROM messages 
   WHERE conversation_id = 'conv-id'
   ORDER BY created_at ASC;
   ```

3. **Check Email Response:**
   - Send email to booking@eventgaraget.se
   - Check if AI response mentions previous details
   - Look for phrases like "Som du nämnde tidigare..." or context references

4. **Check n8n Logs:**
   - Open Workflow 01 in n8n
   - Look at execution logs
   - `buildContext` node should output conversation history
   - AI node should receive it in prompt

---

## 🚨 Common Issues & Fixes

### Issue 1: History Not Found
**Symptom:** "fetchHistory returns empty even though messages exist"

**Cause:** Thread IDs not matching

**Fix:**
```javascript
// Add logging in buildContext node
console.log('Thread ID:', $json.thread_id);
console.log('Messages found:', $input.all().length);

// Verify messages table has correct thread_id
SELECT gmail_thread_id, COUNT(*) FROM messages 
GROUP BY gmail_thread_id;
```

### Issue 2: Conversation ID Mismatch
**Symptom:** Saves to wrong conversation

**Cause:** createConversation using wrong ID

**Fix:**
```javascript
// In checkConversation node, ensure it returns correct ID
if (convResponse.length > 0 && convResponse[0].json.id) {
  return [{json: {
    ...email,
    conversation_id: convResponse[0].json.id  // ← Make sure this is set
  }}];
}
```

### Issue 3: AI Not Using Context
**Symptom:** AI responds without referencing history

**Cause:** conversationHistory not in system prompt

**Fix:**
1. Edit OpenAI node
2. Find system prompt (the long "Du är EventGaragets...")
3. Add at very top:
```
💬 TIDIGARE KONVERSATION MED DENNA KUND:
{{ $json.conversationHistory }}
```

### Issue 4: Duplicate Messages
**Symptom:** Same message saved twice

**Cause:** Multiple Save nodes executing

**Fix:** Ensure save nodes only run after successful response

---

## ✅ Success Indicators

When implemented correctly:

✅ Workflow remembers customer details from previous emails
✅ AI references previous discussions
✅ No repeated information in responses
✅ Context-aware answers
✅ All messages appear in `messages` table
✅ Conversation thread_ids match correctly
✅ Multi-day conversations work smoothly

---

## 📋 Checklist

- [ ] Workflow has fetchHistory node that queries `messages` table
- [ ] buildContext node formats messages into string
- [ ] System prompt includes `{{ $json.conversationHistory }}`
- [ ] saveIncomingMsg node saves customer messages
- [ ] saveOutgoingMsg node saves AI responses
- [ ] Test with single email → Works
- [ ] Test with reply → AI shows context awareness
- [ ] Database shows correct conversation_id
- [ ] Thread IDs match between Gmail and Supabase
- [ ] No duplicate saves
- [ ] AI generates better responses with context

---

## 🚀 Next Steps

1. Open Workflow 01 in n8n UI
2. Check if "fetchHistory" node exists and is properly configured
3. If not, add it after "Find Conversation" node
4. Add "buildContext" code node after fetchHistory
5. Update OpenAI system prompt to include `{{ $json.conversationHistory }}`
6. Test with multiple emails in same thread
7. Verify messages save to database
8. Monitor live customer interactions

**Expected Result:** AI agent that actually remembers conversations! 🎉

