# 🔧 SLUTGILTIGA FIXAR ATT APPLICERA MANUELLT

## ⚠️ JSON-filen blev trasig vid automatiska ändringar

Eftersom JSON-syntaxen är känslig för newlines, här är **EXAKT** vad du behöver ändra **manuellt i n8n GUI**:

---

## 🎯 FIX #1: Uppdatera AI Email Classifier Prompt

**Node:** `🤖 AI Agent - Email Classifier & Info Check`

**Hitta denna text i System Prompt (längst upp):**
```
🔥 KRITISK REGEL: Frågor om PRIS = quote_request!
Exempel: "Vad kostar...?", "Priser på...?", "Hur mycket kostar...?" → ALLTID quote_request!
```

**Ersätt med:**
```
🔥🔥🔥 ABSOLUT VIKTIGASTE REGEL - LÄS DETTA FÖRST! 🔥🔥🔥
OM MAILET INNEHÅLLER ORDEN: "kostar", "kostnad", "pris", "priser", "hur mycket", "vad får", "offert"
→ DÅ ÄR DET **ALLTID** "quote_request" - ALDRIG "other"!

EXEMPEL SOM ÄR quote_request:
- "Vad kostar det att hyra ett tält?" → quote_request
- "Hur mycket kostar partytält?" → quote_request
- "Kan jag få en prisuppgift?" → quote_request
- "Priser på festtält?" → quote_request
- "Vad får det kosta?

" → quote_request
```

---

**Hitta denna text (foliering-sektionen):**
```
🎨 FOLIERING/WRAPPING:
Vi erbjuder FOLIERING av maskiner (värmepumpar, grillstationer).
Detektera om kunden vill ha foliering:
- Nyckelord: "foliering", "foliera", "branding", "logga på", "eget tryck", "design", "egen profil"
```

**Ersätt med:**
```
🎨 FOLIERING/WRAPPING:
Vi erbjuder FOLIERING av maskiner (värmepumpar, grillstationer).
Detektera om kunden vill ha foliering:
- Nyckelord: "foliering", "foliera", "branding", "logga på", "logga", "logotyp", "sätt vår logga", "eget tryck", "design", "egen profil", "var hamnar loggan", "sätta logga"
- Om ja: Sätt wants_wrapping=true och lägg till "wrapping_design_request" i extracted_questions
- Om foliering önskas: Förklara att vi erbjuder foliering och behöver bildmaterial (logga, färger, mått)

📋 BOKNINGSÄNDRING (booking_modification):
Detektera om kunden ÄNDRAR en befintlig bokning (svarar på tidigare offert):
- Nyckelord: "byta", "ändra", "kan vi byta till", "istället för", "ändra bokningen", "ändra från", "byta till"
- Om ja: classification="booking_modification"
- Extrahera: Vad de vill byta FRÅN och vad de vill byta TILL
```

---

## 🎯 FIX #2: Uppdatera Support Response Prompt

**Node:** `🤖 AI Agent - Support Response1`

**Hitta denna text (längst upp i System Prompt):**
```
Du är EventGaragets hjälpsamma supportagent. Svara på kundens frågor baserat på FAQ-databasen OCH prislistan.
```

**Ersätt med:**
```
Du är EventGaragets hjälpsamma supportagent. Svara på kundens frågor baserat på FAQ-databasen OCH prislistan.

🚨 KRITISK REGEL: HITTA ALDRIG PÅ PRODUKTER!
- Om en produkt INTE finns i prislistan → Säg att vi INTE har den
- Föreslå istället liknande produkter som FAKTISKT finns i prislistan
- Var ÄRLIG om vad vi har och inte har
```

**Hitta denna text (i regler-sektionen):**
```
Regler:
- Var vänlig och professionell
- Använd information från FAQ när möjligt
```

**Ersätt med:**
```
Regler:
- Var vänlig och professionell
- Använd ENDAST information från FAQ och prislistan
- Om kunden frågar om produkter vi INTE har → Säg att vi tyvärr inte har det, men föreslå alternativ från prislistan
- Om kunden frågar om logga/branding/foliering → Förklara att vi erbjuder folieringstjänster (värmepumpar, grillstationer) och att de behöver skicka bildmaterial
```

---

## 🎯 FIX #3: Uppdatera Router - Classification & Info Check

**Node:** `Router - Classification & Info Check`

**I Rules:**

Lägg till en NY regel (Output 3):
- **Conditions:** `$json.classification` equals `booking_modification`
- **Output:** 3

Uppdatera "Requires Human"-regeln:
- Ändra från **Output 3** till **Output 4**

Uppdatera Fallback:
- Ändra från **3** till **4**

---

## 🎯 FIX #4: Uppdatera Router - Route to AI Agent

**Node:** `Router - Route to AI Agent`

Hitta Output 2 regel (för "other"):
- **Conditions:** `$('Parse AI Response1').all()[0].json.classification` equals `other`

**Ändra till:**
- **Operation:** `regex` (istället för equals)
- **Value:** `other|booking_modification`

---

## 🎯 FIX #5: Lägg till Connections

**I n8n Canvas:**

1. `Router - Classification & Info Check` → Output 3 → `Prepare Customer Data`
2. `Router - Classification & Info Check` → Output 4 → `Prepare Customer Data`

---

## ✅ SLUTRESULTAT:

Efter dessa ändringar kommer AI:n att:
- ✅ ALDRIG klassificera prisfrågor som "other"
- ✅ ALDRIG hitta på produkter som inte finns
- ✅ Detektera foliering-frågor korrekt ("sätt vår logga")
- ✅ Hantera bokningsändringar ("kan vi byta till...")
- ✅ Alltid svara ärligt om vad som finns/inte finns

---

## 💡 TEST EFTER FIXARNA:

```
Email: "vad kostar det att hyra ett partytält?"
→ Ska bli: quote_request (inte "other")
→ Ska skicka follow-up email

Email: "kan vi byta till en popcorn maskin? Sätt vår logga på den?"
→ Ska bli: booking_modification
→ Ska svara: "Vi har tyvärr ingen popcornmaskin, men kan erbjuda [alternativ från prislistan]"
→ Ska detektera: wants_wrapping=true
→ Ska förklara: "Vi kan absolut sätta er logga! Vi behöver bildmaterial..."
```

---

**🎯 Nu kan du importera den återställda filen och göra ändringarna manuellt i n8n!**
