# 🚀 Workflow 01 - Quick Reference Guide

## 🎯 Mission
**Fix Workflow 01 so the AI remembers previous conversations with customers**

---

## 📊 Current State vs. Target State

### ❌ CURRENT (Without Memory)
```
Email 1: "What's the price of grillstation?"
Response: "Grillstation is 2500 SEK/day. When do you need it?"

Email 2: "For November 8th. Do you have LED addon?"
Response: "We have LED addon for 250 SEK/day. Which product were you interested in?" 
         ↑ PROBLEM: Doesn't remember they asked about grillstation!

Email 3: "Can I get a quote for the grillstation with LED?"
Response: "Sure! I need your address and full name to create a quote."
         ↑ PROBLEM: Asked same questions again instead of just creating quote!
```

### ✅ TARGET (With Memory)
```
Email 1: "What's the price of grillstation?"
Response: "Grillstation is 2500 SEK/day. When do you need it?"

Email 2: "For November 8th. Do you have LED addon?"
Response: "Perfect! Grillstation with LED addon = 2750 SEK/day on Nov 8. 
          What's your delivery address?"
         ↑ GOOD: Remembers grillstation + references previous message!

Email 3: "Can I get a quote for the grillstation with LED?"
Response: "I'll create your quote right now: 
          - Grillstation (2500 SEK/day)
          - LED addon (250 SEK/day)  
          - Event date: Nov 8
          - Delivery: [address from before]
          I'm sending the quote link now!"
         ↑ PERFECT: Uses ALL previous context!
```

---

## 🔧 What Needs to Happen

### 1. **Fetch Previous Messages**
```
Customer: reply_to_email@example.com
Workflow: Query messages table for this customer's thread
Result: Get all previous messages from this conversation
```

### 2. **Format into Context**
```
Previous messages:
[Nov 15] CUSTOMER: What's price?
[Nov 15] EVENTGARAGET: Here's price...
[Nov 16] CUSTOMER: Want LED addon
[Nov 16] EVENTGARAGET: Yes, LED costs...

Format as readable string → Pass to AI
```

### 3. **AI Uses Context**
```
AI System Prompt includes:
"💬 EARLIER CONVERSATION:
[Previous messages here]

Remember what customer asked. Don't repeat info."

Result: AI references history in response
```

### 4. **Save New Messages**
```
After AI responds:
Save Customer Message → messages table
Save AI Response → messages table
Update Conversation → updated_at = NOW()
```

---

## 📍 Where Each Step Happens in n8n

| Step | Node Name | Type | Input | Output |
|------|-----------|------|-------|--------|
| 1 | Gmail Trigger | Trigger | New email | Email data |
| 2 | Extract Email | Code | Email data | Parsed fields |
| 3 | Check Customer | Supabase | Email | Customer ID |
| 4 | Check/Create Conv | Supabase | Thread ID | Conversation ID |
| 5 | **Fetch History** ⭐ | Supabase | Thread ID | Messages array |
| 6 | **Build Context** ⭐ | Code | Messages | conversationHistory |
| 7 | Get Price List | Supabase | - | Products |
| 8 | Get FAQ | Supabase | - | FAQs |
| 9 | Merge Data | Code | All above | Combined data |
| 10 | **OpenAI** ⭐ | OpenAI | conversationHistory in prompt | Response |
| 11 | Format Email | Code | AI response | Clean response |
| 12 | Save Incoming Msg | Supabase | Email + Conversation ID | Saved |
| 13 | Save Outgoing Msg | Supabase | Response + Conversation ID | Saved |
| 14 | Send Email | Gmail/SMTP | Response | Email sent |

**⭐ = Critical for memory to work**

---

## 🔑 Key Code Snippets

### A. Fetch History Query (Supabase Node)
```sql
SELECT 
  id,
  body,
  message_type,
  created_at
FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE gmail_thread_id = {{ $json.thread_id }}
)
ORDER BY created_at ASC
```

### B. Build Context (Code Node)
```javascript
const msgs = $input.all();
let ctx = "TIDIGARE KONVERSATION:\n\n";

msgs.forEach(m => {
  const sender = m.json.message_type === 'incoming' ? 'KUND' : 'EVENTGARAGET';
  ctx += `[${new Date(m.json.created_at).toLocaleDateString('sv-SE')}] ${sender}:\n`;
  ctx += `${m.json.body}\n\n`;
});

return [{json: {...$('mergeData').first().json, conversationHistory: ctx}}];
```

### C. Update OpenAI Prompt
```
BEFORE system prompt, add:

💬 TIDIGARE KONVERSATION MED KUNDEN:
{{ $json.conversationHistory }}

REGLER:
1. Läs konversationen ovan
2. Kom ihåg vad de redan frågat
3. Upprepa INTE samma info
4. Referera till tidigare svar

[REST OF EXISTING PROMPT...]
```

---

## ✅ Testing Checklist

### Test 1: Single Email
- [ ] Send email to bookings@eventgaraget.se
- [ ] Check n8n logs - no history yet (first message)
- [ ] Response doesn't reference previous messages (correct)
- [ ] Message saved to database

### Test 2: Reply (Same Thread)
- [ ] Reply to previous email (same thread)
- [ ] Check n8n logs - should fetch 1 previous message
- [ ] AI response references previous message
- [ ] Example: "Som du nämnde tidigare..."
- [ ] Both messages in same conversation in DB

### Test 3: Full Conversation
- [ ] Email 1: "Price of grillstation?"
- [ ] Email 2: "For Nov 8, with LED"
- [ ] Email 3: "Send quote"
- [ ] Check Email 3 response mentions:
  - Grillstation (from Email 1)
  - November 8 (from Email 2)
  - LED addon (from Email 2)
- [ ] All 3 messages in same conversation

---

## 🐛 Debugging Checklist

```sql
-- 1. Check conversations exist
SELECT id, gmail_thread_id, created_at FROM conversations 
LIMIT 5;

-- 2. Check messages saved
SELECT id, body, message_type, created_at FROM messages 
LIMIT 10;

-- 3. Find test customer thread
SELECT c.id, c.gmail_thread_id, COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT 5;

-- 4. Get specific conversation messages
SELECT created_at, message_type, body 
FROM messages
WHERE conversation_id = 'your-conv-id'
ORDER BY created_at;
```

---

## 🎯 Success Indicators

✅ AI mentions previous details in responses
✅ No repeated questions in follow-ups
✅ Messages appear in `messages` table
✅ Same `conversation_id` for thread
✅ Thread IDs match between Gmail and DB
✅ Response quality improves

---

## ⚠️ Common Mistakes to Avoid

1. ❌ Forgetting to join conversations table in SQL
   - ✅ Use: `JOIN conversations WHERE gmail_thread_id`

2. ❌ conversationHistory not in AI system prompt
   - ✅ Add: `{{ $json.conversationHistory }}` at top

3. ❌ Not saving messages after response
   - ✅ Add Save nodes to capture both incoming and outgoing

4. ❌ Thread ID mismatch
   - ✅ Ensure `thread_id` from Gmail matches DB

5. ❌ Creating duplicate conversations
   - ✅ Check if exists before creating

---

## 📞 Need Help?

**Check n8n Workflow:**
1. Open Workflow 01
2. Look at last executed workflow
3. Click each node to see input/output
4. Check "buildContext" node - should have conversationHistory
5. Check OpenAI node - should show context in logs

**Check Database:**
```sql
-- Recent messages
SELECT * FROM messages 
ORDER BY created_at DESC 
LIMIT 20;

-- Thread details
SELECT * FROM conversations 
WHERE gmail_thread_id LIKE '%test%'
LIMIT 5;
```

---

## 🚀 Implementation Timeline

| Time | Task | Status |
|------|------|--------|
| Now | Review Workflow 01 structure | ⏳ |
| 5 min | Check if fetchHistory node exists | ⏳ |
| 10 min | Add buildContext node (if missing) | ⏳ |
| 5 min | Update OpenAI system prompt | ⏳ |
| 5 min | Test with single email | ⏳ |
| 10 min | Test with multi-email thread | ⏳ |
| Done! | Monitor live conversations | ⏳ |

**Total Time: ~35 minutes**

---

## 📝 Notes

- Gmail thread_id = Gmail's internal thread identifier
- conversation_id = Our database identifier
- message_type = 'incoming' (customer) or 'outgoing' (EventGaraget)
- conversationHistory = Formatted string passed to AI

---

**Status: READY FOR IMPLEMENTATION** ✅

