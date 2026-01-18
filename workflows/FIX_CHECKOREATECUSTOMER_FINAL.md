# FIX: checkOrCreate Node - Befintliga Kunder Identifieras Inte

## Problem
Even om kunden existerar i databasen, `checkCustomer` returnerar tom array och `is_new` sätts till `true`.

## Orsak
- Email-matching är CASE-SENSITIVE
- Whitespace-problem
- `customerResponse.length` blir 0

## LÖSNING - Uppdatera `checkOrCreate` Node:

Ersätt ALL kod i `checkOrCreate` med detta:

```javascript
const email = $('extractEmail1').first().json;
const customerResponse = $input.all();

// CLEANUP email-adressen
const cleanEmail = (email.email_address || '').trim().toLowerCase();

console.log('=== DEBUG checkOrCreate ===');
console.log('📧 Looking for email:', cleanEmail);
console.log('📊 Customer response items:', customerResponse.length);

// DEBUGGING: Visa ALLT
if (customerResponse.length > 0) {
  console.log('✅ First item:', JSON.stringify(customerResponse[0], null, 2));
  console.log('✅ JSON data:', JSON.stringify(customerResponse[0].json, null, 2));
} else {
  console.log('❌ NO CUSTOMERS FOUND - will create new customer');
  console.log('⚠️ Make sure email exists in database!');
}

// Kontrollera om kund finns
if (customerResponse.length > 0 && customerResponse[0].json?.id) {
  const customerId = customerResponse[0].json.id;
  const customerData = customerResponse[0].json;
  
  console.log('✅ CUSTOMER EXISTS:', customerId);
  console.log('📋 Name:', customerData.name, 'Phone:', customerData.phone);
  console.log('📧 Customer Email:', customerData.email);
  
  return [{
    json: {
      ...email,  // ← FÖRST (spreads email properties)
      email_address: cleanEmail,  // ← USE CLEAN EMAIL
      customer_id: customerId,
      is_new: false,  // ← BOOLEAN (NOT string!)
      name: customerData.name || email.name,
      phone: customerData.phone,
      company_name: customerData.company_name
    }
  }];
}

console.log('📝 NO CUSTOMER FOUND - will create NEW');
return [{
  json: {
    ...email,
    email_address: cleanEmail,  // ← USE CLEAN EMAIL
    customer_id: null,
    is_new: true,  // ← BOOLEAN (NOT string!)
  }
}];
```

## MEN INNAN DET - vi måste fixa `checkCustomer` Supabase-noden!

`checkCustomer` måste göra case-insensitive lookup. 

**I n8n:**
1. Öppna `checkCustomer` noden
2. Gå till **Filter** → **Conditions**
3. **ÄNDR**: 
   - **Key**: `email`
   - **Condition**: `eq` → **ÄNDRA till:** använd en CUSTOM SQL istället

ELLER - **ENKLARE**: Använd en Code-node istället av Supabase-noden för lookup:

```javascript
const email = $('extractEmail1').first().json;
const cleanEmail = (email.email_address || '').trim().toLowerCase();

const { data, error } = await $input.first().json;

// Använd Supabase client för case-insensitive query
const customers = await supabase
  .from('customers')
  .select('*')
  .ilike('email', cleanEmail);  // ← ilike = case-insensitive!

if (error) {
  console.error('❌ Error:', error);
  return [];
}

console.log('✅ Found:', customers.data?.length, 'customers');
return customers.data || [];
```

---

## Alternativ - Helt ny workflow

Vill du att jag skapar ett **helt nytt, working workflow** som är:
- ✅ Case-insensitive email matching
- ✅ Proper debug logging
- ✅ Handles existing customers correctly
- ✅ Creates new customers only when needed

**Säg bara JA och jag exporterar det!** 🚀
