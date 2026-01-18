# Workflow 1 - Fix Invalid Products Handling

## 🐛 Problem

Kunden frågade om "Bajstält" och "Prutttält" som **inte finns i prislistan**.

**Expected:** Email med tillgängliga produkter
**Actual:** Tack-för-frågan email (behandlades som FAQ)

## 🔍 Root Cause

1. **AI Orchestrator** extraherade produkterna korrekt
2. **Product Validation** mot Supabase returnerade tomma resultat (inga matchningar)
3. **Handle Product Validation** skulle ha skickat `invalid_products`
4. Men istället gick flödet till **FAQ Response** route

## ✅ Lösning

Vi behöver förbättra **3 noder**:

### 1. Förbättra AI Orchestrator Prompt

**Uppdatera systemmeddelandet:**
```
Du är EventGaragets AI Orchestrator. Analysera email och extrahera:
1. Produktnamn (array) - ENDAST från tillgänglig prislista nedan
2. Om kunden frågar om produkter som INTE finns i listan → markera som "unknown_products"
3. Grundläggande kundinfo (name, company)
4. FAQ-frågor (array) - ENDAST om de frågar om hyra-villkor, priser, leverans osv

ReturnERA ENDAST JSON format (no markdown):
{
  "products": ["Partytält 4x8m"],
  "unknown_products": ["Bajstält", "Prutttält"],
  "customer_info": {
    "name": "...",
    "company": "..."
  },
  "extracted_questions": [],
  "confidence": 0.95
}
```

### 2. Uppdatera Handle Product Validation Logic

**Ny kod:**
```javascript
const aiOutput = $('aiOrchestratorExtract').first().json;
const requestedProducts = aiOutput.products || [];
const unknownProducts = aiOutput.unknown_products || [];
const validProductsResponse = $('validateProductsSupabase').first().json;
const validProducts = Array.isArray(validProductsResponse) ? validProductsResponse.map(p => p.name) : [];

// Hitta ogiltiga produkter (inte i Supabase)
const invalidProducts = requestedProducts.filter(p => !validProducts.includes(p));

// Kombinera okända och ogiltiga
const allInvalidProducts = [...unknownProducts, ...invalidProducts];

if (allInvalidProducts.length > 0) {
  return [{
    json: {
      action: 'invalid_products',
      invalid_list: allInvalidProducts,
      message: `Vi har inte: ${allInvalidProducts.join(', ')}. Tillgängliga: ${validProducts.join(', ')}`
    }
  }];
}

if (requestedProducts.length === 0 && unknownProducts.length === 0) {
  // Endast FAQ-frågor, skicka FAQ-svar
  return [{
    json: {
      action: 'faq_only',
      questions: aiOutput.extracted_questions || []
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

### 3. Uppdatera Router - Product Validation

**Lägg till 3 regler istället för 2:**

```
Rule 1: action == "invalid_products" → Output 1 (invalid email)
Rule 2: action == "faq_only" → Output 2 (FAQ email)
Rule 3: action == "valid_products" → Output 0 (booking process)
```

### 4. Lägg Till FAQ-Only Handler Node

**Ny Code Node efter Router Output 2:**

```javascript
const questions = $('aiOrchestratorExtract').first().json.extracted_questions || [];
const faqList = $('mergeSheetData').first().json.faqList;

// Om bara FAQ-frågor (ingen produktförfrågan)
if (questions.length === 0) {
  return [{
    json: {
      to: $('mergeSheetData').first().json.email_address,
      subject: `Re: ${$('mergeSheetData').first().json.subject}`,
      html: `
        <p>Tack för din fråga!</p>
        <p>Vi tror att vi inte kunde hitta de produkter du sökte.</p>
        <p><strong>Tillgängliga produkter:</strong></p>
        <ul>
          ${$('mergeSheetData').first().json.priceList.map(p => 
            `<li>${p.Name || p.name}: ${p['Price Per Day'] || p.price_per_day} SEK/dag</li>`
          ).join('')}
        </ul>
        <p>Kontakta oss om du har frågor!</p>
        <p>Mvh EventGaraget Team</p>
      `
    }
  }];
}

// Om det finns FAQ-frågor, svara på dem
let responses = [];
questions.forEach(q => {
  const faq = faqList.find(f => 
    (f.Question || f.question || '').toLowerCase().includes(q.toLowerCase())
  );
  if (faq) {
    responses.push(`<p><strong>F: ${faq.Question || faq.question}</strong></p><p>${faq.Answer || faq.answer}</p>`);
  }
});

return [{
  json: {
    to: $('mergeSheetData').first().json.email_address,
    subject: `Re: ${$('mergeSheetData').first().json.subject}`,
    html: `
      <p>Tack för din fråga!</p>
      ${responses.length > 0 ? responses.join('') : '<p>Vi kunde tyvärr inte hitta svar på din fråga.</p>'}
      <p>Mvh EventGaraget Team</p>
    `
  }
}];
```

## 🎯 Lösnings Ordning i n8n

1. **AI Orchestrator - Extract Core Data:** Uppdatera prompt
2. **Handle Product Validation:** Uppdatera logik
3. **Router - Product Validation:** Lägg till regel för "faq_only"
4. **Create new node:** "FAQ or Product Not Found Response"
5. **Uppdatera connections:**
   - Router Output 2 → "FAQ or Product Not Found Response" → Send FAQ Email

## 📊 Resultat

**För "Bajstält" och "Prutttält" förfrågan:**

✅ AI Orchestrator: `unknown_products: ["Bajstält", "Prutttält"]`
✅ Handle Product Validation: `action: "invalid_products"`
✅ Router: Output 1 (invalid products)
✅ Email: "Vi har inte: Bajstält, Prutttält. Tillgängliga: Partytält 3x3m, Partytält 4x4m, ..."

## 🚀 Test Efter Fix

Skicka email:
```
Subject: Produktförfrågan
Body: Hej, har du bajstält och prutttält att hyra?
```

**Expected Response:**
```
Subject: Re: Produktförfrågan

Hej Johan!

Vi har inte: Bajstält, Prutttält. 

Vi har följande produkter tillgängliga:
• Partytält 3x3m: 800 SEK/dag
• Partytält 4x4m: 1200 SEK/dag
• ...

Mvh EventGaraget Team
```

