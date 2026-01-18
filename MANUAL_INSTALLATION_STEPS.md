# 🔧 Manuella Installationssteg - Inventory & Foliering

## ⚠️ VIKTIGT

Din befintliga `EventGaraget - Main Booking Agent Prod.json` är **1116 rader** och **FUNGERAR**.

Jag ska **INTE** skapa en ny fil som är mindre - istället får du **MANUELLA STEG** för att lägga till de nya funktionerna i ditt befintliga workflow i n8n.

---

## 📋 Vad som ska läggas till:

### 1. **Tillgänglighetskontroll (5 nya noder)**
- Kollar lagersaldo i Supabase
- Föreslår alternativa datum om upptaget

### 2. **Foliering-hantering (4 nya noder)**
- Detekterar foliering i AI-prompts
- Skickar PDF-guide automatiskt

---

## 🔧 STEG-FÖR-STEG INSTALLATION (i n8n GUI)

### **STEG 1: Förbered Supabase (1-2 min)**

1. Öppna **Supabase SQL Editor**
2. Kör denna fil: `supabase/inventory-system.sql`
3. Verifiera:
```sql
SELECT * FROM products;  -- Ska visa 10 produkter
SELECT * FROM check_product_availability('Partytält 4x8m', '2025-10-15', '2025-10-17', 1);  -- Ska fungera
```

---

### **STEG 2: Uppdatera AI-Prompt (REDAN KLAR! ✅)**

Din `🤖 AI Agent - Email Classifier & Info Check` har **REDAN** uppdaterad prompt med foliering-detektion:

```javascript
🎨 FOLIERING/WRAPPING:
Vi erbjuder FOLIERING av maskiner (värmepumpar, grillstationer).
Detektera om kunden vill ha foliering:
- Nyckelord: "foliering", "foliera", "branding", "logga på", "eget tryck", "design", "egen profil"
- Om ja: Sätt wants_wrapping=true och lägg till "wrapping_design_request" i extracted_questions
```

**✅ Detta är redan på plats! Inget att göra här.**

---

### **STEG 3: Lägg till Tillgänglighetskontroll-Noder (15 min)**

#### **3.1 Hitta rätt plats**

I ditt n8n workflow:
1. Leta upp noden: **`🤖 AI Agent - Quote Generator1`**
2. Denna nod ansluter just nu direkt till: **`Prepare Booking Data1`**
3. Vi ska LÄGGA TILL noder MELLAN dessa två

#### **3.2 Lägg till Node 1: "📅 Prepare Availability Checks"**

**Node-typ:** Code  
**Position:** Efter "🤖 AI Agent - Quote Generator1"

**JavaScript-kod:**
```javascript
// Extrahera produkter och datum från AI response
const parseAiItems = $('Parse AI Response1').all();
const bookingDetails = parseAiItems[0].json.booking_details;
const productsRequested = bookingDetails.products_requested || [];
const startDate = bookingDetails.start_date;
const endDate = bookingDetails.end_date;

if (!startDate || !endDate || productsRequested.length === 0) {
  return {
    availability_checks: [],
    all_available: true,
    message: 'No availability check needed (missing products or dates)'
  };
}

// Skapa requests för varje produkt
const availabilityRequests = productsRequested.map((product, index) => ({
  json: {
    product_name: typeof product === 'string' ? product : product.name,
    start_date: startDate,
    end_date: endDate,
    quantity_needed: typeof product === 'object' && product.quantity ? product.quantity : 1,
    check_index: index
  }
}));

return availabilityRequests;
```

#### **3.3 Lägg till Node 2: "✅ Check Availability (Supabase RPC)"**

**Node-typ:** HTTP Request  
**Method:** POST  
**URL:** `https://njiagzdssxoxycxraubf.supabase.co/rest/v1/rpc/check_product_availability`  
**Authentication:** Supabase API (samma som du redan har)  
**Body Content Type:** JSON  
**JSON Body:**
```json
{
  "p_product_name": "={{$json.product_name}}",
  "p_start_date": "={{$json.start_date}}",
  "p_end_date": "={{$json.end_date}}",
  "p_quantity_needed": {{$json.quantity_needed}}
}
```

#### **3.4 Lägg till Node 3: "📊 Aggregate Availability Results"**

**Node-typ:** Code

**JavaScript-kod:**
```javascript
// Sammanställ alla tillgänglighetskontroller
const allChecks = $input.all();
const unavailableProducts = [];
const alternativeNeeded = [];

for (const check of allChecks) {
  const result = check.json[0]; // Supabase RPC returns array
  
  if (!result.is_available) {
    unavailableProducts.push({
      product: check.json.product_name || 'Unknown product',
      requested: result.quantity_requested || 1,
      available: result.quantity_available || 0,
      conflicting_dates: result.conflicting_dates || []
    });
    
    alternativeNeeded.push(check.json.product_name);
  }
}

const allAvailable = unavailableProducts.length === 0;

return {
  all_available: allAvailable,
  unavailable_products: unavailableProducts,
  availability_message: allAvailable 
    ? '✅ Alla produkter är tillgängliga för dina önskade datum!'
    : `⚠️ Följande produkter är tyvärr inte tillgängliga för valda datum: ${alternativeNeeded.join(', ')}. Föreslår alternativa datum...`,
  checked_at: new Date().toISOString()
};
```

#### **3.5 Lägg till Node 4: "🔀 Router - Availability"**

**Node-typ:** Switch  
**Mode:** Rules

**Rule 1 (Output 0 - Inte tillgängligt):**
- Condition: `$json.all_available` equals `false`

**Rule 2 (Output 1 - Tillgängligt):**
- Condition: `$json.all_available` equals `true`

**Fallback:** Output 1

#### **3.6 Lägg till Node 5: "📆 Suggest Alternative Dates"**

**Node-typ:** HTTP Request  
**Method:** POST  
**URL:** `https://njiagzdssxoxycxraubf.supabase.co/rest/v1/rpc/suggest_alternative_dates`  
**Authentication:** Supabase API  
**JSON Body:**
```json
{
  "p_product_name": "={{$('Parse AI Response1').all()[0].json.booking_details.products_requested[0]}}",
  "p_preferred_date": "={{$('Parse AI Response1').all()[0].json.booking_details.start_date}}",
  "p_duration_days": 3,
  "p_quantity_needed": 1,
  "p_days_to_search": 30
}
```

#### **3.7 Lägg till Node 6: "📧 Format Alternative Dates Email"**

**Node-typ:** Code

**JavaScript-kod:**
```javascript
// Format alternative dates for email
const alternatives = $input.all();
const parseAiItems = $('Parse AI Response1').all();
const customerInfo = parseAiItems[0].json.customer_info;
const unavailableProducts = $('📊 Aggregate Availability Results').all()[0].json.unavailable_products;

let alternativesText = '';
if (alternatives.length > 0 && alternatives[0].json.length > 0) {
  const firstThree = alternatives[0].json.slice(0, 3);
  alternativesText = firstThree.map((alt, idx) => 
    `${idx + 1}. ${alt.suggested_start_date} till ${alt.suggested_end_date} (${alt.days_from_preferred} dagar från önskat datum)`
  ).join('\n');
}

const emailBody = `Hej ${customerInfo.name || 'där'}!

Tack för din förfrågan! 🎉

Tyvärr är följande produkter redan bokade för dina önskade datum:
${unavailableProducts.map(p => `- ${p.product} (${p.available} av ${p.requested} tillgängliga)`).join('\n')}

📅 Vi kan erbjuda följande alternativa datum:
${alternativesText}

Är något av dessa datum intressant? Svara på detta mail så fixar vi det direkt!

Alternativt, kontakta oss på 08-123 456 78 så hjälper vi dig.

Med vänliga hälsningar,
EventGaraget-teamet
🎪 Vi gör ditt event oförglömligt!`;

return {
  to: customerInfo.email,
  subject: 'Alternativa datum - EventGaraget',
  body: emailBody
};
```

#### **3.8 Lägg till Node 7: "✉️ Send Alternative Dates Email"**

**Node-typ:** Gmail  
**Operation:** Send  
**To:** `={{$json.to}}`  
**Subject:** `={{$json.subject}}`  
**Email Type:** Text  
**Message:** `={{$json.body}}`  
**Credentials:** Gmail account 2 (samma som du har)

---

### **STEG 4: Lägg till Foliering-Noder (10 min)**

#### **4.1 Lägg till Node 8: "🎨 Check If Wrapping Requested"**

**Node-typ:** Code  
**Position:** Parallellt med "📅 Prepare Availability Checks"

**JavaScript-kod:**
```javascript
// Check if customer wants wrapping
const parseAiItems = $('Parse AI Response1').all();
const aiResponse = parseAiItems[0].json;
const wantsWrapping = aiResponse.wants_wrapping || false;
const wrappingProducts = aiResponse.wrapping_products || [];

if (wantsWrapping && wrappingProducts.length > 0) {
  return {
    send_wrapping_guide: true,
    wrapping_products: wrappingProducts,
    customer_email: aiResponse.customer_info.email,
    customer_name: aiResponse.customer_info.name
  };
}

return {
  send_wrapping_guide: false
};
```

#### **4.2 Lägg till Node 9: "🔀 Router - Wrapping"**

**Node-typ:** Switch  
**Mode:** Rules

**Rule 1 (Output 0):**
- Condition: `$json.send_wrapping_guide` equals `true`

**Fallback:** -1 (No output)

#### **4.3 Lägg till Node 10: "📄 Read Wrapping Guide Template"**

**Node-typ:** Read Binary File  
**File Path:** `/Users/emanuelpossnert/Documents/Dev projects/Eventgaraget/templates/wrapping-material-guide.html`

#### **4.4 Lägg till Node 11: "📤 Send Wrapping Guide PDF"**

**Node-typ:** Gmail  
**Operation:** Send  
**To:** `={{$('🎨 Check If Wrapping Requested').all()[0].json.customer_email}}`  
**Subject:** `🎨 Guide för Folieringsmaterial - EventGaraget`  
**Email Type:** HTML  
**Message:** `={{$('📄 Read Wrapping Guide Template').first().data}}`  
**Credentials:** Gmail account 2

---

### **STEG 5: Anslut Noderna (VIKTIGT!)**

#### **Connections för Tillgänglighetskontroll:**

1. **🤖 AI Agent - Quote Generator1**  
   → Anslut till: **📅 Prepare Availability Checks** (TA BORT anslutningen till "Prepare Booking Data1")

2. **📅 Prepare Availability Checks**  
   → Anslut till: **✅ Check Availability (Supabase RPC)**

3. **✅ Check Availability (Supabase RPC)**  
   → Anslut till: **📊 Aggregate Availability Results**

4. **📊 Aggregate Availability Results**  
   → Anslut till: **🔀 Router - Availability**

5. **🔀 Router - Availability**  
   - Output 0 (Inte tillgängligt) → **📆 Suggest Alternative Dates**  
   - Output 1 (Tillgängligt) → **Prepare Booking Data1** (befintlig nod)

6. **📆 Suggest Alternative Dates**  
   → Anslut till: **📧 Format Alternative Dates Email**

7. **📧 Format Alternative Dates Email**  
   → Anslut till: **✉️ Send Alternative Dates Email**

#### **Connections för Foliering (Parallellt med Availability):**

1. **🤖 AI Agent - Quote Generator1**  
   → ÄVEN anslut till: **🎨 Check If Wrapping Requested** (parallell anslutning!)

2. **🎨 Check If Wrapping Requested**  
   → Anslut till: **🔀 Router - Wrapping**

3. **🔀 Router - Wrapping**  
   - Output 0 → **📄 Read Wrapping Guide Template**

4. **📄 Read Wrapping Guide Template**  
   → Anslut till: **📤 Send Wrapping Guide PDF**

---

## 🎯 DIAGRAM: Hur det ska se ut

```
🤖 AI Agent - Quote Generator1
  ├─→ 📅 Prepare Availability Checks (NYTT)
  │     ├─→ ✅ Check Availability (Supabase RPC)
  │     ├─→ 📊 Aggregate Availability Results
  │     ├─→ 🔀 Router - Availability
  │           ├─ Output 0: UPPTAGET
  │           │   ├─→ 📆 Suggest Alternative Dates
  │           │   ├─→ 📧 Format Alternative Email
  │           │   └─→ ✉️ Send Alternative Email
  │           │
  │           └─ Output 1: LEDIGT
  │               └─→ Prepare Booking Data1 (befintlig)
  │
  └─→ 🎨 Check If Wrapping Requested (NYTT, parallellt)
        ├─→ 🔀 Router - Wrapping
              └─ Output 0: FOLIERING ÖNSKAD
                  ├─→ 📄 Read Wrapping Guide
                  └─→ 📤 Send Wrapping Guide
```

---

## ✅ Verifiering (Efter installation)

### Test 1: Normal bokning
```
Skicka email:
"Vill boka Partytält 4x8m för 50 personer, 15-17 oktober"

Förväntat:
- ✅ Kollar lagersaldo
- ✅ Om ledigt → Skapar offert
- ✅ Om upptaget → Föreslår alternativa datum
```

### Test 2: Foliering
```
Skicka email:
"Vill hyra värmepumpar och foliera dom med vår logga"

Förväntat:
- ✅ AI detekterar: wants_wrapping=true
- ✅ Skickar PDF-guide automatiskt
- ✅ Offert inkluderar folieringskostnad
```

---

## 📊 Sammanfattning

**Totalt 11 nya noder:**
- 7 noder för tillgänglighetskontroll
- 4 noder för foliering

**Alla credentials:**
- ✅ Supabase API (samma som befintlig)
- ✅ Gmail OAuth2 (samma som befintlig)

**Tid för installation:**
- Supabase setup: 2 min
- Lägg till noder: 20-25 min
- Anslut noder: 5 min
- **Totalt: ~30 min**

---

## 💡 Tips

1. **Spara ofta** när du lägger till noder
2. **Testa efter varje steg** genom att skicka test-email
3. **Använd "Execute Node"** i n8n för att testa individuella noder
4. Om något går fel, kolla **Execution logs** i n8n

---

**🎯 När du är klar har du ett system som automatiskt:**
- ✅ Kollar lagersaldo innan bokning
- ✅ Föreslår alternativa datum om upptaget
- ✅ Detekterar foliering och skickar guide
- ✅ Allt från email till signerad bokning!

**🚀 Lycka till med installationen!**

