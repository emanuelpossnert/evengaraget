# AI Learning & Improvement Guide - EventGaraget

## 🧠 Hur AI:n Fungerar Just Nu

### Nuvarande Tillstånd: **Stateless AI**
- OpenAI GPT-3.5/4 har **INGET minne** mellan konversationer
- Varje mail behandlas som en helt ny konversation
- AI:n lär sig **INTE** automatiskt från era kunders interaktioner

## ✅ Vad Är Redan Implementerat

### 1. **FAQ-databas (Google Sheets)**
- ✅ AI:n läser från er FAQ-sheet vid varje support-fråga
- ✅ Ni kan **manuellt uppdatera** FAQ:n i Google Sheets
- ✅ AI:n använder senaste versionen vid nästa körning

### 2. **Prislista (Google Sheets)**
- ✅ AI:n hämtar aktuella priser från Google Sheets
- ✅ Uppdatera priser i sheeten → AI använder nya priser direkt

### 3. **Konversationshistorik (Supabase)**
- ✅ Alla konversationer sparas i Supabase-databasen
- ✅ Innehåller: kundinfo, meddelanden, sentiment, AI-klassificering
- ❌ **Men:** AI:n använder INTE denna historik ännu

## 🚀 Förbättringar för "Inlärning"

### Nivå 1: **Enkel Context Injection** (Rekommenderat för Start)

**Vad:** Inkludera kundhistorik i AI-prompten

**Fördelar:**
- ✅ Enkel att implementera (1-2 timmars jobb)
- ✅ Inga extra kostnader
- ✅ AI:n känner igen återkommande kunder
- ✅ Kan referera till tidigare bokningar

**Hur det fungerar:**
```javascript
// I AI Agent-noden, lägg till:
const customerHistory = await fetchFromSupabase(
  `SELECT * FROM conversations WHERE customer_id = ${customerId} LIMIT 5`
);

// Lägg till i system prompt:
"Kundhistorik: ${JSON.stringify(customerHistory)}"
```

**Implementation:** Lägg till en Supabase-nod innan AI-klassificeraren som hämtar kundhistorik

---

### Nivå 2: **FAQ Auto-Learning från Support-konversationer**

**Vad:** När en människa tar över en konversation, spara frågan + svaret som nytt FAQ-entry

**Fördelar:**
- ✅ Automatisk FAQ-uppdatering
- ✅ AI:n blir bättre på vanliga frågor
- ✅ Ingen AI-träning krävs

**Implementation:**
1. När `requires_human = true`, flagga konversationen
2. När mänsklig support svarar, analysera fråga + svar
3. Lägg till i Google Sheets FAQ automatiskt
4. AI använder nya FAQ:n nästa gång

**Komplexitet:** Medium (3-5 timmar)

---

### Nivå 3: **RAG (Retrieval Augmented Generation)**

**Vad:** Använd vektorlagring för att hitta liknande tidigare konversationer

**Fördelar:**
- ✅ AI:n hittar relevanta tidigare svar
- ✅ Bättre kontext-förståelse
- ✅ Kan hantera komplexa frågor

**Nackdelar:**
- ❌ Kräver Supabase Vector extension
- ❌ Extra kostnad för embeddings (OpenAI)
- ❌ Mer komplext att implementera

**Verktyg:**
- Supabase pgvector
- OpenAI Embeddings API
- LangChain (finns i n8n)

**Komplexitet:** Hög (1-2 dagars jobb)

---

### Nivå 4: **Fine-Tuning** (Ej rekommenderat för er användning)

**Vad:** Träna en anpassad GPT-modell på era data

**Fördelar:**
- ✅ Modellen "lär sig" er terminologi
- ✅ Bättre på specifika uppgifter

**Nackdelar:**
- ❌ Dyrt (från 5000 SEK för grundträning)
- ❌ Kräver MYCKET träningsdata (1000+ exempel)
- ❌ Måste omtränas vid varje uppdatering
- ❌ Komplext att underhålla

**Rekommendation:** ❌ Inte värt det för bokningssystem

---

## 💡 Min Rekommendation: Börja med Nivå 1

### Steg 1: Kundhistorik i Context (Nu)
Lägg till en Supabase-nod i workflow:en som hämtar:
- Tidigare bokningar
- Senaste konversationen
- Kundtyp (VIP, Active, etc.)

### Steg 2: FAQ Auto-Learning (Om 1 månad)
När ni ser återkommande frågor som kräver human takeover, implementera automatisk FAQ-uppdatering.

### Steg 3: RAG (Om 3-6 månader)
När ni har 500+ konversationer i databasen, överväg RAG för bättre kontext-förståelse.

---

## 📊 Mätning av Förbättring

Spåra dessa KPI:er i Supabase:

```sql
-- AI Accuracy över tid
SELECT 
  DATE_TRUNC('week', created_at) as week,
  AVG(ai_confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE human_takeover = false) / COUNT(*)::float as automation_rate,
  AVG(sentiment) as avg_sentiment
FROM conversations
GROUP BY week
ORDER BY week DESC;
```

### Framgångsmått:
- ✅ **Automation rate > 80%** (80% av konversationer utan human takeover)
- ✅ **Avg confidence > 0.85** (AI:n är säker på sina klassificeringar)
- ✅ **Avg sentiment > 0.6** (kunderna är nöjda)

---

## 🎯 Nästa Steg

### För dig som projektledare:

1. **Testa den uppdaterade workflow:en** (nu med förbättrad prompt)
2. **Samla data i 2 veckor** för att se mönster
3. **Identifiera top 10 FAQ-frågor** som AI:n inte hanterar bra
4. **Lägg till dem i Google Sheets FAQ**
5. **Om ni fortfarande vill ha "inlärning"**, välj Nivå 1 (Context Injection)

### Vill du implementera Context Injection (Nivå 1)?
Säg till så hjälper jag dig att lägga till:
- En Supabase-nod som hämtar kundhistorik
- Uppdatera AI-prompten att inkludera historik
- Testa att AI:n känner igen återkommande kunder

---

## 📚 Resurser

- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [Supabase Vector/pgvector](https://supabase.com/docs/guides/ai/vector-columns)
- [LangChain RAG](https://python.langchain.com/docs/use_cases/question_answering/)
- [n8n AI Nodes](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.ai/)


