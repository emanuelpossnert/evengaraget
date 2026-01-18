# Hybrid Email Handling - FAQ + Priser i Samma Mail

## 🎯 Problem som Lösts

Kunder skriver ofta mail som innehåller **både** prisförfrågningar **och** FAQ-frågor i samma meddelande:

### Exempel:
> "Hej! Vad kostar det att hyra ett partytält för 50 personer?  
> Och ingår leverans och montering i priset?  
> Hur lång tid tar leveransen?"

Detta mail innehåller:
- ✅ **Prisförfrågan** (tält för 50 personer)
- ✅ **FAQ-frågor** (leverans ingår?, montering ingår?, leveranstid?)

**Tidigare problem:** Mailet klassificerades som ANTINGEN quote_request ELLER support_question, och AI:n svarade bara på en del.

**Nu:** AI:n får tillgång till BÅDE FAQ OCH Prislista och kan svara på ALLT samtidigt! 🎉

---

## 🔄 Nya Workflow-flödet

```
Gmail Trigger
    ↓
Extract Email Data (+ extrahera email-adress)
    ↓
🔍 Fetch Customer History (Supabase)
    ↓
📝 Format Customer Context
    ↓
┌─────────────────────────────────┐
│  Hämta BÅDA datakällorna        │
│  parallellt (samtidigt)         │
├──────────────┬──────────────────┤
│ Get FAQ Data │ Get Price List   │
└──────┬───────┴────────┬─────────┘
       └────────┬────────┘
                ↓
🤖 AI Agent - Email Classifier
    (har nu tillgång till FAQ OCH Priser)
    ↓
Router (baserat på klassificering)
    ↓
┌───────────────┬──────────────────┬──────────────┐
│ Output 0:     │ Output 1:        │ Output 2:    │
│ Saknar info   │ Quote Request    │ Support      │
│ → Follow-up   │ → Skapa offert   │ → FAQ-svar   │
└───────────────┴──────────────────┴──────────────┘
```

### **Viktiga förändringar:**

✅ **FAQ och PriceList hämtas FÖRE AI Classifier**  
- Båda datakällor är tillgängliga för ALLA flöden
- Inga dubbla hämtningar
- Snabbare exekvering

✅ **Quote Generator kan svara på FAQ-frågor**  
- Har tillgång till både prislista OCH FAQ-databas
- Kan kombinera offert + FAQ-svar i samma mail
- Använder `extracted_questions` från Classifier

✅ **Support Agent kan ge prisinformation**  
- Har tillgång till både FAQ OCH prislista
- Kan ge översiktliga priser utan att skapa offert
- Föreslår att skapa offert om kunden vill ha exakt pris

---

## 📧 Exempel på AI-beteende

### **Scenario 1: Pris + FAQ**

**Inkommande mail:**
> "Hej! Vad kostar ett tält för 50 personer?  
> Och ingår leverans?"

**AI Classifier ser:**
```json
{
  "classification": "quote_request",
  "extracted_questions": ["Ingår leverans?"],
  "has_all_info": false,
  "missing_info": ["phone", "start_date", "end_date", "delivery_address"]
}
```

**Router → Output 0** (saknar info)

**AI:s follow-up mail:**
> Hej och välkommen till EventGaraget! 🎉
> 
> Tack för din intresse i våra festtält! För att ge dig en exakt offert behöver jag:
> - Telefonnummer
> - Önskat datum för leverans och upphämtning
> - Fullständig leveransadress
> 
> Angående din fråga om leverans: **Ja, leverans ingår** i priset inom 50km från Stockholm!
> 
> Kan du komplettera med ovan information så återkommer jag direkt med en offert? 😊

**Resultat:**
- ✅ Bekräftar att den tar emot förfrågan
- ✅ Ber om saknad information
- ✅ **Svarar på FAQ-frågan direkt** (ingen extra väntetid)

---

### **Scenario 2: Komplett info + FAQ**

**Inkommande mail:**
> "Hej! Jag vill boka partytält 6x12m till Storgatan 1, Stockholm  
> Leverans 15 juni, upphämtning 17 juni  
> Ca 80 gäster på företagsfest  
> 
> Ingår bord och stolar? Och montering?  
> 
> Kontakt: Anders Svensson, 070-123 45 67, Företaget AB (org.nr 556677-8899)"

**AI Classifier ser:**
```json
{
  "classification": "quote_request",
  "has_all_info": true,
  "extracted_questions": ["Ingår bord och stolar?", "Ingår montering?"],
  "customer_info": { "name": "Anders", "email": "...", "phone": "070-123 45 67", ... }
}
```

**Router → Output 1** (komplett info - skapa offert)

**Quote Generator AI får:**
- ✅ Prislistan → kan räkna ut totalpris
- ✅ FAQ-databasen → kan svara på frågor om bord/stolar/montering
- ✅ Kundinfo + bokningsdetaljer
- ✅ `extracted_questions` från Classifier

**AI:s offert-mail:**
> Hej Anders!
> 
> Tack för din bokningsförfrågan! Här kommer din offert för företagsfesten 15-17 juni:
> 
> **OFFERT #BK-2025-123456**
> 
> | Produkt | Antal | Pris/st | Totalt |
> |---------|-------|---------|--------|
> | Partytält 6x12m | 1 | 5 500 kr | 5 500 kr |
> | Monteringskostnad | 1 | 1 200 kr | 1 200 kr |
> | **TOTALT** | | | **6 700 kr** |
> 
> **Leveransdetaljer:**
> - Leverans: 15 juni 2025
> - Upphämtning: 17 juni 2025
> - Adress: Storgatan 1, Stockholm
> 
> ---
> 
> **Angående dina frågor:**
> 
> ❓ *Ingår bord och stolar?*  
> → Nej, bord och stolar är tillval. Vi har:
> - Bord (180cm): 150 kr/st
> - Stolar: 45 kr/st
> - För 80 gäster rekommenderar vi 10 bord + 80 stolar (2 850 kr)
> 
> ❓ *Ingår montering?*  
> → Montering kostar 1 200 kr (redan inkluderat i offerten ovan!)
> 
> ---
> 
> **Vill du lägga till bord och stolar?** Säg till så uppdaterar jag offerten!
> 
> För att godkänna offerten, klicka här: [Signeringslänk]
> 
> Med vänliga hälsningar,  
> EventGaraget

**Resultat:**
- ✅ Komplett offert med priser
- ✅ Svarar på **alla** FAQ-frågor i samma mail
- ✅ Föreslår tillval (merförsäljning!)
- ✅ Signeringslänk för direkt godkännande

---

### **Scenario 3: Ren FAQ-fråga (men prisinformation finns)**

**Inkommande mail:**
> "Hej! Vilka betalningsmetoder accepterar ni?  
> Och ungefär vad kostar ett mindre tält?"

**AI Classifier ser:**
```json
{
  "classification": "support_question",
  "extracted_questions": ["Vilka betalningsmetoder?", "Vad kostar mindre tält?"]
}
```

**Router → Output 2** (support)

**Support Agent AI får:**
- ✅ FAQ-databasen → betalningsmetoder
- ✅ Prislistan → kan ge översiktlig prisinformation
- ⚠️ Men skapar INGEN offert (det kräver mer info)

**AI:s FAQ-svar:**
> Hej!
> 
> Tack för dina frågor! 😊
> 
> **Betalningsmetoder:**  
> Vi accepterar:
> - Faktura (endast företag)
> - Swish
> - Kortbetalning
> - Banköverföring
> 
> **Priser för mindre tält:**  
> Våra mindre festtält kostar från:
> - Partytält 3x3m: från 1 200 kr
> - Partytält 4x4m: från 1 800 kr
> - Partytält 4x8m: från 2 500 kr
> 
> Priserna inkluderar leverans inom 50km från Stockholm.
> 
> **Vill du ha en exakt offert?** För det behöver jag:
> - Önskat datum
> - Leveransadress
> - Antal gäster (ungefär)
> 
> Kontakta oss gärna på 08-123 456 78 om du har fler frågor!
> 
> Med vänliga hälsningar,  
> EventGaraget

**Resultat:**
- ✅ Svarar på FAQ-frågan från databas
- ✅ Ger översiktlig prisinformation
- ✅ Uppmanar till att skapa offert (lead generation!)

---

## 🎨 AI-instruktioner

### **Quote Generator AI:**
```
Du är EventGaragets AI-agent som skapar offerter OCH svarar på FAQ-frågor i samma mail.

VIKTIGT: Om kunden har FAQ-frågor I TILLÄGG till offertförfrågan, svara på BÅDA!

1. Skapa offert baserat på prislistan
2. Svara på FAQ-frågor från FAQ-databasen
3. Kombinera offert + FAQ-svar i samma email_response
```

### **Support Agent AI:**
```
Du är EventGaragets supportagent med tillgång till FAQ OCH prislistan.

- Använd FAQ för support-frågor
- Ge översiktlig prisinformation från prislistan
- Men skapa INGEN offert (det kräver mer info)
- Föreslå att kunden skapar offert om de vill ha exakt pris
```

---

## 📊 Fördelar med Hybrid Handling

### **För Kunden:**
✅ Får **alla** sina frågor besvarade i **ett** mail  
✅ Slipper vänta på flera svar  
✅ Bättre kundupplevelse  
✅ Snabbare beslutsfattande  

### **För EventGaraget:**
✅ **Högre konverteringsrate** (alla frågor besvaras direkt)  
✅ **Färre mail-växlingar** (mer effektivt)  
✅ **Merförsäljning** (AI föreslår tillval baserat på FAQ)  
✅ **Bättre automation** (90%+ av mail hanteras utan manuell input)  

### **Tekniska Fördelar:**
✅ FAQ och PriceList hämtas **en gång** (inte duplicerat)  
✅ **Parallell hämtning** = snabbare svar  
✅ **Alla AI-agenter** har tillgång till båda datakällor  
✅ **Enklare att underhålla** (ingen duplicerad logik)  

---

## 🚀 Implementation Status

**Status:** ✅ **LIVE och redo att testa!**

**Vad som har ändrats:**
1. ✅ FAQ och PriceList hämtas parallellt INNAN AI Classifier
2. ✅ Quote Generator AI har tillgång till FAQ-databasen
3. ✅ Support Agent AI har tillgång till prislistan
4. ✅ Båda AI:er instruerade att kombinera svar
5. ✅ Router uppdaterad för enklare flöde

**Nästa steg:**
- Testa med hybrida mail (pris + FAQ)
- Övervaka AI:ns svar och kvalitet
- Justera FAQ-databasen baserat på vanliga frågor

---

## 🧪 Testscenarier

### Test 1: Prisförfrågan + FAQ
**Mail:**
> "Vad kostar ett tält för 30 personer? Ingår leverans?"

**Förväntat resultat:**
- Follow-up mail som ber om saknad info (datum, adress)
- Men svarar DIREKT på frågan om leverans

### Test 2: Komplett bokning + FAQ
**Mail:**
> "Boka tält 4x8m till Storgatan 1, Stockholm, 20-22 juni, 40 gäster, företagsfest.
> Kontakt: 070-123 45 67. Ingår montering?"

**Förväntat resultat:**
- Komplett offert med priser
- Svarar på frågan om montering
- Signeringslänk

### Test 3: Ren FAQ med prisintresse
**Mail:**
> "Hej! Hur lång leveranstid har ni? Och vad kostar det ungefär för ett mindre tält?"

**Förväntat resultat:**
- Svarar på FAQ om leveranstid
- Ger översiktliga priser
- Föreslår att skapa offert för exakt pris

---

## 💡 Framtida Förbättringar

### **Smart FAQ Learning** (nästa version)
När kunden ställer en fråga som INTE finns i FAQ:
- AI markerar frågan som "okänd"
- Human takeover
- När människa svarar, läggs fråga + svar till FAQ automatiskt

### **Dynamic Pricing** (framtida)
- AI kollar availability i kalender
- Dynamiska priser baserat på säsong/efterfrågan
- Automatiska rabattkoder för återkommande kunder

### **Multi-turn Conversations** (framtida)
- AI "minns" tidigare mail i samma thread
- Kan referera till tidigare diskussioner
- "Som jag nämnde i mitt förra mail..." 

---

## 🎉 Sammanfattning

**Tidigare:** Kunden fick ANTINGEN svar på FAQ ELLER pris (aldrig båda samtidigt)

**Nu:** AI:n har tillgång till BÅDE FAQ OCH priser och kan kombinera svar i samma mail!

**Resultat:** Bättre kundupplevelse, högre konvertering, färre mail-växlingar! 🚀


