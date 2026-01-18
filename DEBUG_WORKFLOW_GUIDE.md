# 🔍 Workflow Debug Guide

## Problem: Workflow inte körs och inget sparas i Supabase

### Steg 1: Kontrollera att workflowet är AKTIVERAT
1. Öppna n8n webinterface
2. Gå till "01-email-classification" workflowet
3. **VIKTIGT**: Se om det finns en röd/grön toggle i övre högra hörnet
4. Om den är **RÖDA** (inaktiv) → klicka för att aktivera den ✅

### Steg 2: Test med DEBUG-workflow först
1. Importera `workflows/01-email-classification-DEBUG.json`
2. Aktivera det
3. Skicka ett test-mail
4. Vänta 1-2 minuter
5. Öppna Executions tab och se om den körs
6. Kolla Console logs för debugging

### Steg 3: Om DEBUG-workflowet fungerar
- Gmail trigger fungerar ✅
- Email extraction fungerar ✅
- Gå tillbaka till main workflow och debugga från steg 4

### Steg 4: Debugga main workflow steg-för-steg

**Om den stannar vid "Extract Email":**
- Kolumner i Google Sheets felaktig
- Email data inte extraherad rätt

**Om den stannar vid "Get Price List":**
- Google Sheets credentials fel
- Document ID fel
- Sheet Name fel

**Om den stannar vid "AI Support Response":**
- OpenAI credentials fel
- Modell `gpt-4` inte tillgänglig (rate limit?)
- Byt till `gpt-3.5-turbo`

**Om den stannar vid "Create Conversation":**
- Supabase credentials fel
- Supabase URL fel
- Databas inte tillgänglig

**Om den stannar vid "Send Email":**
- Mailet skickades men något fel i Gmail credentials
- Kolla Gmail account 2 credentials

### Steg 5: Kolla Execution Logs
1. I n8n, gå till workflowet
2. Klicka på "Executions" eller "Logs" tabben
3. Se sista körningen
4. Kolla om det finns röda error messages
5. Se exakta error-meddelandet

### Steg 6: Kontrollera Credentials
**Gmail Account 2:**
- Är den konfigurerad?
- Är den autentiserad?

**OpenAI Account 2:**
- API Key giltig?
- Har du tokens kvar?

**Supabase:**
- URL korrekt?
- API Key giltig?
- RLS policies korrekt?

### Steg 7: Kontrollera Google Sheets
**Price List:**
- Document ID: `1yiEYoKFYx-Y018NiL2sg54lXjq_CjJ1DGtbuVv1cGsw`
- Sheet ID: `1874648354` (PriceList_template)
- Kolumner: "Product Name", "Price Per Day", osv.

**FAQ:**
- Document ID: `1gX3lQ5Ns5n5-cwqT4fAuU3Spcx86UtUPcUeWPNj2tAQ`
- Sheet ID: `1663703534` (FAQ_template)

---

## 🆘 Vanliga Problem & Lösningar

### Problem: "Workflow has no active trigger"
**Lösning**: Workflowet är inaktivt. Klicka aktivera-knappen.

### Problem: "Gmail trigger not working"
**Lösning**: 
1. Kolla Gmail credentials
2. Testa med DEBUG workflow
3. Se efter "Poll" modus i triggern

### Problem: "The workflow has issues and cannot be executed"
**Lösning**:
1. Se efter röda X på noderna
2. Kolla alla node-inställningar
3. Verifiera alla credentials
4. Se efter missing required parameters

### Problem: "Error: Cannot read properties of undefined"
**Lösning**:
1. Det är null/undefined data någonstans
2. Kolla console logs för exakt rad
3. Lägg till null-checks i code nodes

### Problem: "Bad request - please check your parameters" från Supabase
**Lösning**:
1. JSON body felaktig
2. Kolumnnamn inte matchande
3. Data type fel
4. Kolla Supabase schema för exakt kolumnnamn

---

## 📊 Hur man läser Console Logs

1. I n8n, höger-klicka på en nod
2. Välj "View Console"
3. Kör workflowet
4. Se alla `console.log()` outputs
5. Letar efter var det stannar

