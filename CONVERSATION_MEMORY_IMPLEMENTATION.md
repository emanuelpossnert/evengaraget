# 🤖 Workflow 01 - Conversation Memory Implementation Guide

## 📋 Problem Statement
Workflow 01 (AI Booking Agent) currently does NOT remember conversation history. Each email is treated as an isolated message without context from previous interactions with the same customer.

**Issues:**
- Customer asks "What products do you have?" → AI responds with full list
- Customer replies "What about grillstationen?" → AI doesn't remember the context
- Customer says "When is my delivery?" → AI can't find the booking info they discussed earlier
- No conversation thread memory = poor user experience

---

## 🎯 Solution Architecture

### 1. **Database Structure** ✅ ALREADY EXISTS
```sql
-- Tables needed:
customers (id, email, name, phone, company_name, ...)
conversations (id, gmail_thread_id, customer_id, subject, status, created_at, updated_at, ...)
messages (id, conversation_id, from_email, to_email, subject, body, message_type, created_at, ...)
```

### 2. **Workflow Flow** 📧 → 🔍 → 💬 → 🤖 → 📤

```
Email Triggered
    ↓
Extract Email Data (from, subject, body, thread_id)
    ↓
Check/Create Customer in Supabase
    ↓
Fetch Full Conversation History (fetchHistory node)
    ↓
Build Conversation Context String
    ↓
Pass to AI with Full Context
    ↓
AI Generates Response (aware of history)
    ↓
Save Response + Incoming Message to DB
    ↓
Send Reply via Email
```

---

## 🔧 Implementation Steps

### Step 1: **Extract Email Data**
Node type: Gmail Trigger → Parse Email
```json
{
  "from": "customer@example.com",
  "to": "bookings@eventgaraget.se",
  "subject": "Grillstation availability?",
  "body": "Hi, do you have the grillstation available for Nov 8?",
  "thread_id": "17a2c3d4e5f6g7h8",  // Gmail thread identifier
  "timestamp": "2024-11-17T10:30:00Z"
}
```

### Step 2: **Check/Create Customer**
Node: Supabase Query
```sql
SELECT id FROM customers WHERE email = $1
```

If not found → Create new customer with email

### Step 3: **Fetch Conversation History** ⭐ KEY STEP
Node: Supabase Query
```sql
SELECT 
  m.id, 
  m.body, 
  m.from_email, 
  m.to_email, 
  m.message_type,  -- 'incoming' or 'outgoing'
  m.created_at
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.gmail_thread_id = $1
ORDER BY m.created_at ASC
```

Returns: Array of all previous messages in this thread

### Step 4: **Build Conversation Context String**
Node: Code Node (JavaScript)
```javascript
const messages = $input.all();  // From fetchHistory

let conversationHistory = "FULL CONVERSATION HISTORY:\n\n";

messages.forEach((msg, index) => {
  const isIncoming = msg.json.message_type === 'incoming';
  const sender = isIncoming ? 'CUSTOMER' : 'EVENTGARAGET';
  const body = msg.json.body.substring(0, 500); // Truncate long messages
  const time = new Date(msg.json.created_at).toLocaleDateString('sv-SE');
  
  conversationHistory += `[${time}] ${sender}:\n${body}\n\n`;
});

return [{
  json: {
    ...previousData,
    conversationHistory: conversationHistory
  }
}];
```

**Output Example:**
```
FULL CONVERSATION HISTORY:

[2024-11-15] CUSTOMER:
Hi, I'm looking for a grillstation for an event on Nov 8. What's the price?

[2024-11-15] EVENTGARAGET:
Thanks for your interest! Our Grillstation costs 2500 SEK/day...

[2024-11-16] CUSTOMER:
That sounds good. Can I add LED lighting?

[2024-11-16] EVENTGARAGET:
Of course! LED lighting is 250 SEK...
```

### Step 5: **Pass to AI with Context**
Node: OpenAI (GPT-4o-mini)

**System Prompt Update:**
```
💬 CONVERSATION HISTORY:
{{ $json.conversationHistory }}

INSTRUCTIONS:
1. Review the full conversation above
2. Remember what the customer has already said
3. Don't repeat information already discussed
4. Reference previous messages when relevant
5. Build on what they've asked before

For example:
- If they asked "What's the price?" before → Don't ask it again
- If they mentioned "grillstation" before → Know they're interested in it
- If they asked about dates → Know their event is Nov 8
- If they said "Add LED" → Know they want the addon
```

**AI Response:** Will now be context-aware!

### Step 6: **Save to Conversation Database**
After AI responds:

**Save Incoming Message:**
```sql
INSERT INTO messages (conversation_id, from_email, body, message_type, created_at)
VALUES ($1, $2, $3, 'incoming', NOW())
```

**Save Outgoing Message:**
```sql
INSERT INTO messages (conversation_id, from_email, to_email, body, message_type, created_at)
VALUES ($1, 'bookings@eventgaraget.se', $2, $3, 'outgoing', NOW())
```

**Update Conversation:**
```sql
UPDATE conversations 
SET updated_at = NOW(), 
    status = $2
WHERE id = $1
```

---

## 🛠️ n8n Workflow Configuration

### Required Nodes:

1. **Gmail Trigger** → Triggers on new email
   - Extracts: `from`, `subject`, `body`, `thread_id`

2. **extractEmail** (Code) → Parse and format email
   - Outputs: Cleaned email data

3. **checkCustomer** (Supabase) → Check if customer exists
   - Query: `WHERE email = {{ $json.from }}`

4. **checkOrCreate** (Code) → Create if needed
   - Outputs: `customer_id`

5. **findConversation** (Supabase) ⭐ → Find thread
   - Query: `WHERE gmail_thread_id = {{ $json.thread_id }}`
   - Returns: `conversation_id` (if exists)

6. **checkConversation** (Code) → Verify response
   - Sets: `conversation_id` or marks as new

7. **createConversation** (Supabase) → Create if new
   - Inserts: New conversation record
   - Outputs: `conversation_id`

8. **fetchHistory** (Supabase) ⭐ → Get ALL messages
   - Query: See Step 3 above
   - Outputs: Array of all messages

9. **buildContext** (Code) ⭐ → Format for AI
   - Input: Messages array
   - Output: `conversationHistory` string

10. **getPriceList** (Supabase) → Get current products
    - Outputs: Price list array

11. **getFaq** (Supabase) → Get FAQ
    - Outputs: FAQ array

12. **mergeData** (Code) → Combine everything
    - Inputs: All previous data
    - Outputs: Single `$json` object with `conversationHistory`

13. **aiResponse** (OpenAI) ⭐ → Generate response
    - Input: `{{ $json.conversationHistory }}` in system prompt
    - Output: `response` from AI

14. **formatEmail** (Code) → Extract AI response
    - Handles both: Direct string or nested message.content
    - Outputs: Clean response text

15. **saveIncoming** (Supabase) → Save customer message
    - Insert: Incoming message

16. **saveOutgoing** (Supabase) → Save AI response
    - Insert: Outgoing message

17. **updateConversation** (Supabase) → Mark as updated
    - Update: conversation.updated_at

18. **sendEmail** (Gmail/SMTP) → Send reply
    - To: Customer email
    - Body: AI response

---

## 💡 Example Flow

**Day 1:**
```
Customer: "What's the price of grillstation?"
↓
Workflow: No history yet (first message)
AI: "Hi! Grillstation is 2500 SEK/day. When do you need it?"
↓
DB: Saves conversation_id + both messages
```

**Day 2:**
```
Customer: "We need it for Nov 8. Do you have addon??"
↓
Workflow: fetchHistory retrieves Day 1 conversation
↓
Context passed to AI:
  - Knows they want grillstation
  - Knows it's for Nov 8
  - Doesn't ask "Which product?" again
↓
AI: "Perfect for Nov 8! Yes, we have LED lighting for 250 SEK/day"
↓
DB: Appends message to same conversation
```

**Day 3:**
```
Customer: "Can I get a quote?"
↓
Workflow: Full conversation history available
↓
AI sees: They want grillstation, Nov 8, with LED addon
↓
AI: Creates quote with correct info
↓
Much faster than asking all questions again!
```

---

## 🧪 Testing Checklist

### Before Deployment:
- [ ] Test single email (no history)
- [ ] Test reply to customer (should retrieve history)
- [ ] Check that messages save correctly to DB
- [ ] Verify conversation_id is same for thread
- [ ] Check that AI responds with context awareness
- [ ] Test with 2+ back-and-forth emails
- [ ] Verify no duplicate messages saved
- [ ] Test error handling (missing data, etc)

### After Deployment:
- [ ] Monitor 5 real customer conversations
- [ ] Check that AI remembers details
- [ ] Verify no loops or duplicate responses
- [ ] Check email delivery
- [ ] Monitor n8n error logs

---

## 🔐 Security & Privacy

- All messages stored encrypted in Supabase
- RLS policies: Users can only see their own conversations
- PII: Email addresses, phone numbers encrypted
- Retention: Messages kept for 1 year per policy

---

## 📊 Success Metrics

✅ **Conversation remembrance rate:** 100% (AI recalls all previous messages)
✅ **Response quality:** Higher (context-aware answers)
✅ **Customer satisfaction:** Should increase
✅ **Response time:** Slightly longer (fetches history) but worth it
✅ **Error rate:** < 1% (robust error handling)

---

## 🚀 Implementation Priority

1. **HIGH:** Implement `fetchHistory` node (get messages)
2. **HIGH:** Build context string in Code node
3. **HIGH:** Add context to AI system prompt
4. **MEDIUM:** Ensure messages save to DB
5. **MEDIUM:** Test with real customers
6. **LOW:** Optimize query performance
7. **LOW:** Add conversation analytics

---

## 📝 Next: Actual n8n Configuration

The next step is to update the workflow JSON or n8n UI with these nodes and connections.

Current status: **READY FOR IMPLEMENTATION** ✅

