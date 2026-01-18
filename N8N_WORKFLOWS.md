# EventGaraget - n8n Workflows Documentation

## Overview

Four main workflows orchestrate the AI Receptionist system:

1. **01-email-classification** - Email ingestion & classification
2. **02-quotation-generation** - Generate & send quotations
3. **03-escalation-handler** - Human escalations
4. **04-reminders** - Scheduled reminders

---

## Workflow 1: Email Classification & Routing

**File:** `01-email-classification.json`

### Trigger
- **Type:** Gmail Trigger
- **Config:** Poll every minute for new emails in INBOX
- **Output:** Gmail email object

### Steps

#### 1. Extract Email Data
**Node:** Code node
**Input:** Gmail email
**Output:** Normalized email object

```javascript
const gmailData = $input.first().json;
const emailMatch = gmailData.From.match(/<(.+?)>/) || gmailData.From.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);

return [{
  json: {
    thread_id: gmailData.threadId,
    message_id: gmailData.id,
    from: gmailData.From,
    to: gmailData.To,
    subject: gmailData.Subject,
    body: gmailData.snippet || '',
    email_address: emailMatch ? emailMatch[1] : gmailData.From.trim()
  }
}];
```

#### 2. Fetch Customer History
**Node:** HTTP Request to Supabase
**Endpoint:** `/rest/v1/customers?email=eq.{email_address}&select=*`
**Output:** Customer record or empty array

#### 3. Format Customer Context
**Node:** Code node
**Input:** Customer history
**Output:** Formatted context string

```javascript
const history = $input.first().json;
let context = '';

if (history && history.length > 0) {
  const customer = history[0];
  context = `\n📊 Customer since: ${new Date(customer.created_at).toLocaleDateString('sv-SE')}`;
  if (customer.total_bookings > 0) {
    context += `\n📅 Total bookings: ${customer.total_bookings}`;
    context += `\n💰 Total revenue: ${customer.total_revenue} SEK`;
  }
}

return [{
  json: {
    ...$('Extract Email Data').first().json,
    customer_context: context || '\n📊 New customer'
  }
}];
```

#### 4. Get Price List
**Node:** Google Sheets
**Document ID:** `1yiEYoKFYx-Y018NiL2sg54lXjq_CjJ1DGtbuVv1cGsw`
**Sheet Name:** `PriceList_template` (or whatever your sheet tab is named)
**Operation:** Read Rows
**Output:** Array of products with prices

**Columns expected:**
- Product Name (column A)
- Category (column B)  
- Price Per Day (column C)
- Description (column D)

---

#### 5. Get FAQ Data
**Node:** Google Sheets
**Document ID:** `1gX3lQ5Ns5n5-cwqT4fAuU3Spcx86UtUPcUeWPNj2tAQ`
**Sheet Name:** `FAQ_template` (or whatever your sheet tab is named)
**Operation:** Read Rows
**Output:** Array of FAQs

**Columns expected:**
- Question (column A)
- Answer (column B)
- Category (column C) - optional

---

### 🔗 Google Sheets Node Configuration (n8n)

#### For Price List:

1. Add new **Google Sheets** node
2. **Authentication:** Select your existing Google Drive credentials
3. **Operation:** `Read Rows`
4. **Spreadsheet:** Paste: `1yiEYoKFYx-Y018NiL2sg54lXjq_CjJ1DGtbuVv1cGsw`
5. **Sheet Name:** Determine from your spreadsheet (see below how to find)
6. **Range:** Leave empty (reads all rows)

#### For FAQ:

1. Add new **Google Sheets** node  
2. **Authentication:** Select your existing Google Drive credentials
3. **Operation:** `Read Rows`
4. **Spreadsheet:** Paste: `1gX3lQ5Ns5n5-cwqT4fAuU3Spcx86UtUPcUeWPNj2tAQ`
5. **Sheet Name:** Determine from your spreadsheet
6. **Range:** Leave empty

---

### 📋 How to Find Sheet Names

In Google Sheets:

1. Look at the **sheet tabs** at the bottom of the spreadsheet
2. Your sheet name appears there (e.g., "PriceList_template", "FAQ_template", etc.)
3. Use EXACTLY that name in n8n configuration

**Example:**
```
If your sheet tab says: "PriceList_template"
Then in n8n, set Sheet Name to: PriceList_template
```

---

#### 6. AI Orchestrator - Extract Core Data
**Node:** OpenAI Chat Model
**Model:** gpt-4o-mini
**Max Tokens:** 500
**Temperature:** 0.2
**Response Format:** JSON

**System Prompt:**
```
Du är EventGaragets AI Orchestrator. Analysera email och extrahera:
1. Produktnamn (array) - from price list only
2. Grundläggande kundinfo (name, company)
3. FAQ-frågor (array)

Returnera ENDAST JSON format (no markdown):
{
  "products": ["Partytält 4x8m"],
  "customer_info": {
    "name": "...",
    "company": "..."
  },
  "extracted_questions": ["How long can I rent?"],
  "confidence": 0.95
}
```

**User Message:**
```
Från: {{ $json.from }}
Ämne: {{ $json.subject }}

Meddelande:
{{ $json.body }}

Kundkontext:
{{ $json.customer_context }}

Tillgängliga produkter:
{{ $('Get Price List').all().map(p => `${p.json.name}: ${p.json.price} SEK/dag`).join('\n') }}

FAQ-samling:
{{ $('Get FAQ Data').all().map(f => `F: ${f.json.question}\nS: ${f.json.answer}`).join('\n\n') }}
```

#### 7. Validate Products with Supabase
**Node:** HTTP Request
**Endpoint:** `/rest/v1/products?select=name,base_price_per_day&name=in.({{ names_formatted }})`
**Output:** Valid product records

#### 8. Handle Product Validation
**Node:** Code node
**Logic:** Compare requested vs valid products

```javascript
const requestedProducts = $('AI Orchestrator - Extract Core Data').first().json.products || [];
const validProducts = $('Validate Products with Supabase').all().map(p => p.json.name);
const invalidProducts = requestedProducts.filter(p => !validProducts.includes(p));

if (invalidProducts.length > 0) {
  return [{
    json: {
      action: 'invalid_products',
      invalid_list: invalidProducts,
      message: `We don't have: ${invalidProducts.join(', ')}. Available: ${validProducts.join(', ')}`
    }
  }];
}

return [{
  json: {
    action: 'valid_products',
    products: validProducts
  }
}];
```

#### 9. Router - Product Validation
**Node:** Switch
**Rules:**
- `action == "valid_products"` → Output 0 (proceed)
- `action == "invalid_products"` → Output 1 (escalate)

#### 10. AI Classifier - Classify Request
**Node:** OpenAI Chat Model (Output 0 only)
**Model:** gpt-3.5-turbo
**Max Tokens:** 800

**System Prompt:**
```
Du är EventGaragets AI-agent. Klassificera email enligt:

TYPER:
- booking_request: Kunden vill hyra produkter för ett event
- support_question: Kunden frågar om produkter/priser (från FAQ)
- price_inquiry: Enbart prisfråga utan bokningsintention
- complaint: Klagan eller problem

Returnera JSON:
{
  "classification": "booking_request",
  "confidence": 0.95,
  "missing_info": [],
  "ai_response": "Would you like a quotation?"
}
```

#### 11. Format Product Response (Output 1)
**Node:** Code node
**Input:** Invalid products message

```javascript
const response = $input.first().json;
const customer = $('AI Orchestrator - Extract Core Data').first().json.customer_info;

return [{
  json: {
    to: customer.email || 'support@eventgaraget.se',
    subject: 'Re: Din förfrågan - EventGaraget',
    html: `
      <p>Hej ${customer.name || 'där'}!</p>
      <p>${response.message}</p>
      <p>Vi har följande produkter:</p>
      <ul>
        ${$('Get Price List').all().map(p => `<li>${p.json.name}: ${p.json.price} SEK/dag</li>`).join('')}
      </ul>
      <p>Mvh EventGaraget Team</p>
    `
  }
}];
```

#### 12. Send Invalid Products Email (Output 1)
**Node:** Gmail
**Config:** Send HTML email

### Routing Logic

```
Email Received
    ↓
Extract & Validate
    ↓
AI Classification
    ├→ Valid Products + booking_request → WORKFLOW 2 (Quotation)
    ├→ Valid Products + support_question → Answer FAQ + Send Email
    ├→ Invalid Products → Send Available Products Email
    ├→ Confidence < 60% → WORKFLOW 3 (Escalation)
    └→ Complaint → Escalation
```

---

## Workflow 2: Quotation Generation & Sending

**File:** `02-quotation-generation.json`

### Trigger
- **Type:** Webhook (called from Workflow 1)
- **Input:** Classification result + products

### Steps

#### 1. AI Generate Quotation
**Node:** OpenAI Chat Model
**Model:** gpt-3.5-turbo
**Max Tokens:** 1200

**System Prompt:**
```
Du är EventGaragets pris- och offertexpert. Generera en offert:

REGLER:
1. Endast produkter i prislistan
2. Lägg till 20% marginal på totalt pris
3. Lägg till 25% moms om företag
4. Minimum 2 dagars hyra

Returnera JSON:
{
  "quotation_number": "QT-2025-001",
  "line_items": [
    {
      "product_name": "Partytält 4x8m",
      "quantity": 1,
      "unit_price": 2500,
      "days": 2,
      "total": 5000
    }
  ],
  "subtotal": 5000,
  "tax": 1000,
  "total": 6000,
  "terms": "Betalning senast 5 dagar före event"
}
```

#### 2. Generate Signature Token
**Node:** Code node

```javascript
const uuid = require('uuid');
return [{
  json: {
    signature_token: uuid.v4(),
    signature_link: `https://sign.eventgaraget.se/sign/${uuid.v4()}`
  }
}];
```

#### 3. Save Quotation to Supabase
**Node:** HTTP Request (POST)
**Endpoint:** `/rest/v1/quotations`
**Body:**
```json
{
  "customer_id": "{{ customer_id }}",
  "quotation_number": "{{ quotation_number }}",
  "total_amount": "{{ total }}",
  "signature_token": "{{ signature_token }}",
  "signature_link": "{{ signature_link }}",
  "valid_until": "{{ valid_until_date }}",
  "status": "pending_signature"
}
```

#### 4. Save Quotation Items
**Node:** Code + Loop
**For each:** product in quotation
**Action:** POST to `/rest/v1/quotation_items`

#### 5. Format Quotation Email
**Node:** Code node

```javascript
const quotation = $('AI Generate Quotation').first().json;
const customer = $('Extract Email Data').first().json;

return [{
  json: {
    to: customer.email_address,
    subject: `Offert - EventGaraget - ${quotation.quotation_number}`,
    html: `
      <h2>Offert från EventGaraget</h2>
      <p>Hej ${customer.name}!</p>
      <p>Tack för din förfrågan. Här är din offert:</p>
      
      <table border="1">
        <tr>
          <th>Produkt</th>
          <th>Antal</th>
          <th>Dagar</th>
          <th>Pris/dag</th>
          <th>Totalt</th>
        </tr>
        ${quotation.line_items.map(item => `
          <tr>
            <td>${item.product_name}</td>
            <td>${item.quantity}</td>
            <td>${item.days}</td>
            <td>${item.unit_price} SEK</td>
            <td>${item.total} SEK</td>
          </tr>
        `).join('')}
      </table>
      
      <h3>Totalt pris</h3>
      <p>Delsumma: ${quotation.subtotal} SEK</p>
      <p>Moms (25%): ${quotation.tax} SEK</p>
      <p><strong>Totalt: ${quotation.total} SEK</strong></p>
      
      <p><a href="${signature_link}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Visa & Signera Offert
      </a></p>
      
      <p>Offerten gäller till {{ valid_until }}</p>
      <p>Mvh EventGaraget Team</p>
    `
  }
}];
```

#### 6. Send Quotation Email
**Node:** Gmail
**Config:** Send HTML email

#### 7. Log to Conversations
**Node:** HTTP Request (POST)
**Endpoint:** `/rest/v1/conversations`
**Body:**
```json
{
  "customer_id": "{{ customer_id }}",
  "quotation_id": "{{ quotation_id }}",
  "subject": "Quotation sent",
  "status": "active",
  "type": "booking"
}
```

---

## Workflow 3: Escalation Handler

**File:** `03-escalation-handler.json`

### Triggers (any of these)
1. AI confidence < 60%
2. Manual escalation from CRM
3. Customer complaint detected
4. Query Supabase for escalation_required = true

### Steps

#### 1. Create Escalation Record
**Node:** HTTP Request (POST)
**Endpoint:** `/rest/v1/escalations`
**Body:**
```json
{
  "customer_id": "{{ customer_id }}",
  "conversation_id": "{{ conversation_id }}",
  "reason": "{{ reason }}",
  "ai_confidence": {{ confidence }},
  "status": "pending",
  "assigned_to": "support@eventgaraget.se"
}
```

#### 2. Update Conversation Status
**Node:** HTTP Request (PATCH)
**Endpoint:** `/rest/v1/conversations/{{ conversation_id }}`
**Body:**
```json
{
  "status": "escalated",
  "human_required": true,
  "human_takeover_reason": "{{ reason }}"
}
```

#### 3. Notify Staff
**Node:** Gmail
**To:** support@eventgaraget.se
**Subject:** Escalation Required

```html
<h3>⚠️ Escalation Required</h3>
<p>Customer: {{ customer_name }}</p>
<p>Email: {{ customer_email }}</p>
<p>Reason: {{ reason }}</p>
<p>AI Confidence: {{ confidence }}%</p>
<a href="https://crm.eventgaraget.se/escalations/{{ escalation_id }}">
  View in CRM
</a>
```

#### 4. Wait for Human Response (max 24h)
**Node:** Wait
**Duration:** 24 hours
**Event:** Escalation marked as resolved OR auto-escalate if timeout

#### 5. Process Human Response
**Node:** Webhook (when staff responds)
**Extract:** Resolution notes, feedback

#### 6. Extract AI Feedback
**Node:** Code node

```javascript
const feedback = {
  original_ai_classification: $('Original Classification').json.classification,
  human_classification: $input.first().json.correct_classification,
  feedback_notes: $input.first().json.notes,
  should_have_escalated: $input.first().json.human_classified_differently
};

return [{
  json: feedback
}];
```

#### 7. Log AI Learning
**Node:** HTTP Request (POST)
**Endpoint:** `/rest/v1/ai_analytics`
**Body:**
```json
{
  "conversation_id": "{{ conversation_id }}",
  "request_type": "escalation_feedback",
  "human_corrected": true,
  "correction_notes": "{{ feedback_notes }}",
  "accuracy_feedback": false
}
```

#### 8. Mark Escalation Resolved
**Node:** HTTP Request (PATCH)
**Endpoint:** `/rest/v1/escalations/{{ escalation_id }}`
**Body:**
```json
{
  "status": "resolved",
  "resolution_notes": "{{ notes }}",
  "ai_learned": true
}
```

---

## Workflow 4: Reminders & Follow-ups

**File:** `04-reminders.json`

### Trigger
- **Type:** Cron
- **Schedule:** Every 6 hours

### Steps

#### 1. Find Unsigned Quotations (2+ days old)
**Node:** HTTP Request (GET)
**Endpoint:** `/rest/v1/quotations?status=eq.pending_signature&created_at=lt.now()-2.days&select=*,customers(email,name)`
**Output:** Array of old unsigned quotations

#### 2. Send Reminder - Unsigned Quotations
**Node:** Loop + Gmail
**For each:** quotation

```html
<p>Hej {{ customer_name }}!</p>
<p>Vi märkte att du inte har signerat din offert än. 
Klicka här för att signera: {{ signature_link }}</p>
<p>Offerten gäller till {{ valid_until }}</p>
```

#### 3. Find Very Old Unsigned Quotations (7+ days)
**Node:** HTTP Request (GET)
**Endpoint:** `/rest/v1/quotations?status=eq.pending_signature&created_at=lt.now()-7.days`

#### 4. Escalate to Human
**Node:** Create Escalation
**Reason:** "quotation_never_signed"
**Assigned to:** support@eventgaraget.se

#### 5. Find Deliveries in 2 Days
**Node:** HTTP Request (GET)
**Endpoint:** `/rest/v1/bookings?status=eq.confirmed&delivery_date=eq.now()+2.days&select=*,customers(email,name)`

#### 6. Send Delivery Reminders
**Node:** Loop + Gmail

```html
<p>Hej {{ customer_name }}!</p>
<p>Påminnelse: Din event är om 2 dagar!</p>
<p>Leveransdatum: {{ delivery_date }}</p>
<p>Produkter:</p>
<ul>
  {{ products.map(p => `<li>${p.name} x${p.quantity}</li>`).join('') }}
</ul>
```

#### 7. Find Completed Bookings (no follow-up sent)
**Node:** HTTP Request (GET)
**Endpoint:** `/rest/v1/bookings?status=eq.completed&select=*,customers(email,name)&followup_sent=eq.false`

#### 8. Send Follow-up Survey
**Node:** Loop + Gmail

```html
<p>Hej {{ customer_name }}!</p>
<p>Tack för att du valde EventGaraget! Vi hoppas du är nöjd.</p>
<p>Kan du ta 2 minuter för denna enkät? {{ survey_link }}</p>
```

#### 9. Mark Reminders as Sent
**Node:** HTTP Request (PATCH)
**For each:** booking/quotation
**Update:** `followup_sent = true`, `last_reminder_sent = now()`

---

## 📊 Workflow Dependencies

```
Workflow 1: Email Classification
    ↓
    ├─→ If booking_request + valid products
    │       ↓
    │   Workflow 2: Quotation Generation
    │       ↓
    │   Webhook: Signature received
    │       ↓
    │   Create Booking
    │
    ├─→ If confidence < 60% OR complaint
    │       ↓
    │   Workflow 3: Escalation Handler
    │
    └─→ If invalid products
            ↓
        Send available products list

Workflow 4: Reminders (scheduled)
    ↓
    Runs every 6 hours regardless
    ├─→ Send reminder emails
    ├─→ Escalate old quotations
    └─→ Send delivery notifications
```

---

## 🔧 Configuration Checklist

### Before Deploying:

- [ ] All Supabase credentials configured
- [ ] All Gmail credentials configured
- [ ] OpenAI API key configured
- [ ] Google Sheets credentials configured
- [ ] All endpoints use correct Supabase URL
- [ ] Email templates reviewed
- [ ] Test workflows with dummy data
- [ ] Monitor error logs
- [ ] Set up alerts for failures

### Environment Variables:

```
SUPABASE_URL=https://your-instance.supabase.co
SUPABASE_API_KEY=your-api-key
OPENAI_API_KEY=sk-xxx
GMAIL_ACCOUNT=booking@eventgaraget.se
SIGNATURE_APP_URL=https://sign.eventgaraget.se
CRM_URL=https://crm.eventgaraget.se
```

---

## 🧪 Testing Procedures

### Test Email Classification:
1. Send test email with valid product: "I need Partytält 4x8m for July 20-22"
2. Expected: Quotation email within 2 minutes

### Test Escalation:
1. Send email with complaint: "Your service was terrible"
2. Expected: Escalation created, staff notified

### Test Reminders:
1. Create unsigned quotation
2. Wait 2 days (or modify time in test)
3. Expected: Reminder email sent

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| Email classification accuracy | > 90% |
| Quotation generation time | < 30 seconds |
| Signed quotation rate (2 days) | > 80% |
| Escalation time to staff | < 1 minute |
| Reminder delivery success | > 99% |

---

## 🐛 Common Issues & Fixes

### Issue: Gmail authentication fails
**Solution:** Re-authenticate Gmail credential, check permissions

### Issue: Quotation not saving to Supabase
**Solution:** Verify Supabase API key, check network logs

### Issue: AI classification inconsistent
**Solution:** Check temperature setting (should be 0.2-0.3), review prompts

### Issue: Reminders not sending
**Solution:** Check cron schedule, verify Gmail credentials, check rate limits

---

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io)
- [Supabase API Reference](https://supabase.com/docs/reference/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Gmail API Guide](https://developers.google.com/gmail/api)
