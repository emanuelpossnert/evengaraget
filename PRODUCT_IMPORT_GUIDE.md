# 🚀 PRODUKTIMPORT - FULLSTÄNDIG GUIDE

## ✅ VAD VI GÖR

Importerar **31 produkter + 21 addons** in i Eventgaraget systemet!

### **PRODUKTER:**
- ✅ 1x EVENTPERSONAL
- ✅ 20x EVENTMASKINER (Basketmaskin, Jukebox, etc)
- ✅ 5x TRUCKAR (Foodtrucks, Citroen, etc)
- ✅ 4x CYKLAR (Eventcykel, Fryscykel, etc)

### **ADDONS:**
- ✅ Branding (Helfoliering, Magnetskyltar, etc)
- ✅ Tält/Markis (Enfärg, Tryck, etc)
- ✅ Elektriska (Batteri, Generator, Bränsle)
- ✅ Konsumtioner (Popcorn, Godis, etc)
- ✅ Service (Setup, Hämtning, etc)

---

## 🔧 **STEG 1: KÖRA PRODUKTIMPORT**

Kör denna SQL i Supabase SQL Editor:

**FILEN:** `/supabase/IMPORT_ALL_PRODUCTS.sql`

```sql
-- Kopiera hela innehållet från IMPORT_ALL_PRODUCTS.sql och paste här
-- Kör med play-knappen ▶️
```

**Verifiering:** Du ska se `total_products: 31` och `total_categories: 4`

---

## 🔧 **STEG 2: KÖRA ADDONS-IMPORT**

Kör denna SQL i Supabase SQL Editor:

**FILEN:** `/supabase/IMPORT_ALL_ADDONS.sql`

```sql
-- Kopiera hela innehållet från IMPORT_ALL_ADDONS.sql och paste här
-- Kör med play-knappen ▶️
```

**Verifiering:** Du ska se `total_addons: 21` och flera kategorier

---

## 📋 **STEG 3: VERIFIERA I CRM**

1. Gå till `/dashboard/products` i CRM
2. Du ska se alla produkter listade
3. Kategorier: EVENTPERSONAL, EVENTMASKINER, TRUCKAR, CYKLAR

---

## 🎯 **STEG 4: TEST I BOKNINGSSYSTEM**

1. Gå till `/dashboard/bookings`
2. Skapa en ny bokning (eller öppna befintlig)
3. Du ska kunna välja produkter från lista
4. Addons ska visas när du väljer produkt

---

## ⚙️ **MULTIPRICING SYSTEM**

Vissa produkter har **flera prisalternativ** (1 dag, 3 dagar, 1 vecka, etc):

### **TRUCKAR exempelvis:**
- 1 dag: 10000 SEK
- 3 dagar: 25000 SEK
- 1 vecka: 45000 SEK
- 1 månad: 100000 SEK

**NOTIS:** Base-priset (10000) lagras i `base_price_per_day`. 
För multi-dag-rabatter behöver vi **uppdatera booking-systemet** för att beräkna korrekt.

---

## 📝 **NÄSTA STEG EFTER IMPORT:**

Efter import behöver vi:

1. ✅ **Testa CRM-produktsidan** - visas allt?
2. 🔜 **Implementera multi-dag-rabatter** i booking-kalkylator
3. 🔜 **Koppla addons till bokningar** - visa i order
4. 🔜 **Uppdatera n8n-agenten** - hitta produkter när kund frågar

---

## 🚀 **KÖR NU!**

1. Öppna Supabase SQL Editor
2. Kör `IMPORT_ALL_PRODUCTS.sql`
3. Vänta på verifikation
4. Kör `IMPORT_ALL_ADDONS.sql`
5. Vänta på verifikation
6. Refresh CRM och test!

**RAPPORTERA** när du är klar! 💪
