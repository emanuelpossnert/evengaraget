# 🎯 FINAL DEMO INSTRUCTIONS - AI RECEPTIONIST

## ⚠️ KRITISKA POINTS FÖR DEMO

### 1. TEST MÅ GÖRAS FRÅN ANNAN EMAIL
**❌ FELAKT:** Mail från `admin@striky.se` TILL `admin@striky.se`
- Then `From: admin@striky.se`
- Then agent responds TO itself! 🔁

**✅ RÄTT:**  Mail från **ANNAN account** (tex gmail.com) TILL `admin@striky.se`
- Then `From: kunde@gmail.com`
- Then agent responds TO `kunde@gmail.com` ✅

---

## 📋 DEMO-FLOW (Steg-för-steg)

### SETUP (Innan demo)
1. [ ] Öppna n8n n9 och verifiera att `01-email-classification.json` är IMPORTERAD och AKTIV
2. [ ] Öppna Supabase och kolla `conversations` och `messages` tables är tomma
3. [ ] Öppna Google Sheets och verifiera att produktlista har rätt data
4. [ ] Öppna n8n Logs för att se debug-info

### TEST 1: Kundsupport (FAQ-fråga)
```
Från: demo@gmail.com (YOUR GMAIL ACCOUNT)
Till: admin@striky.se
Ämne: Vad kostar det att hyra ett partytält?
Body: Hej! Jag undrar vad det kostar att hyra ett partytält för en bröllopsceremoni för 100 personer. Ingår leverans i priset?
```

**Förväntad resultat:**
- ✅ Du får svar FRÅN admin@striky.se TILL din gmail
- ✅ AI svarar med priser på partytält från Google Sheets
- ✅ AI svarar på frågan om leverans (från FAQ)
- ✅ Data sparas i Supabase `conversations` table
- ✅ Messages sparas i `messages` table

**Debug info att kolla:**
```
n8n Logs ska visa:
✅ extractEmail1: email_address: demo@gmail.com
✅ formatEmail1: customer: demo@gmail.com
✅ prepareIncomingMsg: from_email: demo@gmail.com
✅ prepareOutgoingMsg: to_email: demo@gmail.com
```

### TEST 2: Bokningsförfrågan (Med all info)
```
Från: demo@gmail.com
Till: admin@striky.se
Ämne: Bokningsförfrågan - Partytält för event
Body: 
Hej!

Vi behöver hyra ett partytält 6x12m för ett event.
- Datum: 15-17 november 2025
- Antal gäster: 150
- Leveransadress: Storgatan 5, 123 00 Stockholm
- Telefon: 070-123 45 67
- Företag: ABC Events AB

Vänliga hälsningar,
Anna
```

**Förväntad resultat:**
- ✅ AI klassificerar som "booking_request"
- ✅ AI-svar med offert (priser)
- ✅ Bokning skapas i Supabase
- ✅ Customer sparas/uppdateras

---

## 🔍 FELSÖKNING OM NÅGOT GÅR FEL

### Problem: Svar går inte till rätt email

**Debug:** Kolla n8n logs för `formatEmail1`
```
Ska visa:
🔍 formatEmail1 - email_address: demo@gmail.com
```

Om det visar `admin@striky.se`:
- Du testade från fel email-adress
- Gör om TEST 1 från ANNAN email

### Problem: Inget sparas i Supabase

**Debug:** Kolla n8n logs för `saveIncomingMsg` och `saveOutgoingMsg`
```
Ska visa:
✅ prepareIncomingMsg - OUTGOING PAYLOAD: {conversation_id: "...", gmail_message_id: "...", ...}
```

Om du ser ERROR:
1. Kolla Supabase RLS är OFF (för test)
2. Verifiera kolumn-namn i `messages` table
3. Kolla credentials är rätt

**Quick fix i Supabase:**
```sql
-- Disable RLS for testing
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- After testing - re-enable:
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

### Problem: AI svar är tom eller generisk

**Debug:**
1. Kolla `AI Support Response` node körs (ska ta priceList från mergeData)
2. Verifiera Google Sheets är samma URL i node
3. Kolla AI Response har `choices[0].message.content`

---

## 📊 VAD SKA VISAS FÖR KUNDEN

### Scenario för Demo:

**Email kommer in (från test-mail):**
```
"Vill hyra tält för 50 personer"
```

**Systemet gör (automatiskt):**
1. 📧 Läser email från Gmail
2. 🔍 Kollar kundhistorik
3. 📚 Hämtar FAQ & PriceList
4. 🤖 AI klassificerar & skapar svar
5. ✉️ Skapar personligt svar
6. 💾 Sparar i Supabase
7. 📤 Skickar email till kund

**Kunden ser:**
```
Från: admin@striky.se
Till: din-epost@gmail.com
Ämne: Re: Vill hyra tält för 50 personer

Hej!

Tack för din förfrågan! Vi har följande partytält tillgängliga:

• Partytält 3x3m: 1200 SEK/dag
• Partytält 4x4m: 1800 SEK/dag
• Partytält 4x8m: 2400 SEK/dag
• Partytält 6x12m: 3600 SEK/dag

För 50 personer rekommenderar vi partytält 6x12m.

För att skapa en offert behöver jag:
- Startdatum
- Slutdatum
- Leveransadress

Vänliga hälsningar,
EventGaraget (AI-assistent)
```

**I Supabase - Data som sparades:**
```
conversations:
- gmail_thread_id: "..."
- subject: "Vill hyra tält för 50 personer"
- status: "active"
- customer_id: "..."

messages:
- direction: "inbound"
- from_email: "demo@gmail.com"
- body: "Vill hyra tält för 50 personer"
---------------------------------
- direction: "outbound"  
- to_email: "demo@gmail.com"
- body: "[AI:s svar]"
```

---

## ✅ DEMO CHECKLIST

Innan du visar för kunden:
- [ ] n8n är igång och workflow är ACTIVE
- [ ] Google Sheets är uppdaterade med rätt produkter
- [ ] Supabase RLS är OFF (för testing)
- [ ] Du har ANNAN gmail-account för testing
- [ ] n8n logs är redo för att visa debug-info

