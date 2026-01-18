# Context Injection - Kundhistorik i AI-agenten

## 🎯 Vad är Context Injection?

Context Injection betyder att AI:n får tillgång till kundens historik **innan** den analyserar mailet. Detta gör att AI:n kan:

✅ Känna igen återkommande kunder  
✅ Hälsa kunder välkomna tillbaka personligt  
✅ Förifylla information som redan finns (telefon, adress, org.nr)  
✅ Referera till tidigare bokningar  
✅ Anpassa tonalitet baserat på kundtyp (privat/företag/VIP)  
✅ Ge bättre service baserat på tidigare sentiment

---

## 🔧 Hur Det Fungerar

### Workflow-flöde:

```
Gmail Trigger
    ↓
Extract Email Data (+ extraherar email-adress)
    ↓
🔍 Fetch Customer History (Supabase GET request)
    ↓
📝 Format Customer Context (formaterar data för AI)
    ↓
🤖 AI Agent - Email Classifier (med kundhistorik)
    ↓
[Resten av flödet...]
```

---

## 📊 Vad Hämtas från Supabase?

### 1. **Kundinformation**
- Email, namn, telefon
- Företagsnamn och org.nr (om företag)
- Adress och postnummer
- Kundtyp (privat/företag/VIP)
- Total omsättning
- Antal bokningar

### 2. **Tidigare Bokningar** (senaste 5)
- Bokningsnummer
- Status (confirmed, completed, cancelled)
- Leveransdatum
- Belopp

### 3. **Tidigare Konversationer** (senaste 5)
- Ämne
- Status (resolved, pending, escalated)
- Sentiment (positiv/neutral/negativ)

---

## 🎭 Exempel på AI-beteende

### **Scenario 1: Ny kund**

**Email:** "Hej, vad kostar ett tält att hyra?"

**AI ser:**
```
📊 KUNDHISTORIK: Ny kund (ingen tidigare historik)
💡 Detta är en ny potentiell kund - var extra välkomnande!
```

**AI:s svar:**
> Hej och välkommen till EventGaraget! 🎉
> 
> Roligt att du är intresserad av våra festtält! För att ge dig en exakt offert behöver jag lite mer information...

---

### **Scenario 2: Återkommande kund**

**Email:** "Hej, jag vill boka tält igen som förra året"

**AI ser:**
```
📊 KUNDHISTORIK:
- Kund sedan: 2023-05-15
- Kundtyp: privat
- Totalt antal bokningar: 3
- Total omsättning: 12500 kr
- Telefon: 070-123 45 67
- Adress: Storgatan 1, 11234 Stockholm

📅 Tidigare bokningar (senaste 5):
  1. BK-2024-001 - completed - 2024-06-15 - 4500 kr
  2. BK-2023-042 - completed - 2023-07-20 - 4000 kr
  3. BK-2023-015 - completed - 2023-05-28 - 4000 kr

💬 Tidigare konversationer (senaste 5):
  1. Bokningsförfrågan sommarfest - resolved - 😊 Positiv
  2. Fråga om leverans - resolved - 😊 Positiv
```

**AI:s svar:**
> Hej igen och välkommen tillbaka! 😊
> 
> Roligt att höra att du vill boka från oss igen! Jag ser att du tidigare bokade ett tält för 4500 kr den 15 juni i år till Storgatan 1 i Stockholm. 
> 
> Vill du ha samma uppsättning som då, eller önskar du något annat? 
> 
> För att skapa din offert behöver jag bara veta:
> - Datum för leverans och upphämtning
> - Samma adress (Storgatan 1) eller annan?
> 
> Ring gärna på 070-123 45 67 om du har frågor!

**Fördelar:**
- ✅ Personlig hälsning
- ✅ Refererar till tidigare bokning
- ✅ Föreslår samma produkter
- ✅ Redan har adress och telefon
- ✅ Måste bara fråga om datum

---

### **Scenario 3: VIP-kund med hög omsättning**

**AI ser:**
```
📊 KUNDHISTORIK:
- Kund sedan: 2022-03-10
- Kundtyp: vip
- Totalt antal bokningar: 15
- Total omsättning: 95000 kr
- Företag: EventAB
- Org.nr: 556677-8899
```

**AI:s tonalitet:**
> Hej och tack för att du kontaktar oss igen!
> 
> Som en av våra värdefulla återkommande kunder vill vi självklart ge dig bästa möjliga service. Jag ser att ni tidigare bokat från oss 15 gånger - fantastiskt!
> 
> [... fortsättning ...]

---

## 🔒 Säkerhet & Integritet

### ✅ Vad som är säkert:
- Endast kunddata som **redan finns** i Supabase används
- API-nycklar är krypterade i n8n
- Inga känsliga data (lösenord, betalningsinformation) hämtas
- GDPR-compliant (kunden har själv gett informationen)

### ⚠️ Vad du bör tänka på:
- AI:n har tillgång till all kundhistorik - se till att databasen är korrekt
- Om kunden byter email får hen ingen historik (ny kund)
- Felaktig data i Supabase = felaktig context för AI:n

---

## 📈 Mätning av Förbättring

### KPI:er att spåra:

```sql
-- Jämför automation rate för nya vs återkommande kunder
SELECT 
  CASE 
    WHEN c.created_at > NOW() - INTERVAL '30 days' THEN 'Nya kunder'
    ELSE 'Återkommande kunder'
  END as customer_type,
  COUNT(*) FILTER (WHERE conv.human_takeover = false) / COUNT(*)::float as automation_rate,
  AVG(conv.sentiment) as avg_sentiment,
  AVG(conv.ai_confidence) as avg_confidence
FROM conversations conv
JOIN customers c ON conv.customer_id = c.id
WHERE conv.created_at > NOW() - INTERVAL '7 days'
GROUP BY customer_type;
```

**Förväntade resultat efter Context Injection:**
- ✅ **Automation rate för återkommande kunder: 90%+** (vs 80% för nya)
- ✅ **Sentiment för återkommande kunder: 0.7+** (vs 0.6 för nya)
- ✅ **Färre follow-up-mail** (AI har redan telefon/adress för återkommande kunder)

---

## 🚀 Nästa Nivå: Smart Pre-fill

Om du vill gå ännu längre kan du låta AI:n **automatiskt förifylla** information för återkommande kunder:

### Exempel i AI-prompten:

```
OM kunden är återkommande OCH har tidigare bokningar:
- Sätt customer_info.phone från kundhistoriken
- Sätt customer_info.company från kundhistoriken
- Sätt customer_info.org_number från kundhistoriken
- Sätt booking_details.delivery_address från senaste bokningen (om de inte specificerat annat)
- missing_info ska ENDAST innehålla det som VERKLIGEN saknas efter förifylla
```

Detta skulle innebära att för kunden i Scenario 2 ovan:
- `has_all_info` skulle vara **true** om de bara behöver ange datum
- En offert skulle skapas DIREKT
- Kunden får offert istället för follow-up-mail

**Vill du implementera detta? Säg till!** 🚀

---

## 🎯 Implementerad Version

**Status:** ✅ **Context Injection är nu LIVE!**

**Vad som händer nu:**
1. Varje inkommande mail → AI hämtar kundhistorik från Supabase
2. AI får en formaterad sammanfattning av:
   - Kundens information
   - Tidigare bokningar
   - Tidigare konversationer
3. AI använder denna information för att ge bättre, mer personlig service

**Nästa steg:**
- Testa med ett mail från en ny kund
- Testa med ett mail från en återkommande kund (om du har någon i databasen)
- Övervaka AI:s svar och se hur den använder historiken

---

## 📞 Support & Frågor

Om du märker att:
- ❌ AI:n inte använder kundhistoriken
- ❌ Fel kunddata visas
- ❌ Performance-problem (långsammare svar)

Då kan du:
1. Kolla n8n-loggen för "🔍 Fetch Customer History"-noden
2. Verifiera att Supabase-queryn returnerar data
3. Se att "📝 Format Customer Context" formaterar data korrekt

---

## 🎉 Grattis!

Du har nu ett AI-system som "minns" dina kunder och kan ge personlig service! 🚀


