# 📅 Advanced Calendar System

## 🎯 Features

### 1. **View Modes** 📊
- ✅ **Månadsvyn** - Överblick över alla bokningar
  - Minimal design med många bokningar per dag
  - Visa upp till 3 bokningar per dag, sedan "+X till"
  - Idag markerat med röd ram och bakgrund

- ✅ **Veckavyn** - Detaljerad veckoöversikt
  - 7 kolumner, en per dag (Mån-Sön)
  - Mer utrymme för varje dag
  - Perfekt för planering

- ✅ **Dagsvyn** - Fokuserad dagsöversikt
  - Se alla bokningar för en dag
  - Vänstersida: Bokningskort med detaljer
  - Högersida: Statistik för dagen

### 2. **Kategoribaserade Färger** 🎨
- ✅ Lagrat i `category_colors` tabell
- ✅ Automatisk färgning baserat på produktkategori
- ✅ Legend visar alla kategorier
- ✅ Färginställningar-modal (Admin-funktion)

**Befintliga kategorier:**
- 🔵 Tält - Blå
- 🟣 Möbler - Lila
- 🔴 Grill - Röd
- 🟡 Belysning - Gul
- 🟠 Värme - Orange
- ⚫ Övrigt - Grå

### 3. **Interaktiva Bokningar** 🖱️
- ✅ **Klick** - Öppna bokningsdetaljer i modal
- ✅ **Hover** - Visar bokningsnummer i tooltip
- ✅ **Detaljmodal** inkluderar:
  - Bokningsnummer & status
  - Kundnamn, email, telefon
  - Plats & datum (event, leverans, retur)
  - Produktlista
  - Totalt belopp
  - Länk till fullständig bokningssida

### 4. **Navigation** 🧭
- ✅ Föregående/Nästa-knappar (Månad/Vecka/Dag)
- ✅ "Idag"-knapp för snabbnävig
- ✅ Visar current month/week/day i header

### 5. **Filtrering** 🔍
- ✅ **Event-datum** - Visar event-start till end-datum
- ✅ **Leveransdatum** - Visar bara leveransdagar
- ✅ **Returdatum** - Visar bara returdagar

### 6. **Admin-funktioner** ⚙️
- ✅ Färginställningar-knapp
- ✅ Se alla kategorier & färger
- ✅ (Future) Redigera färger per kategori

## 🏗️ Technical Implementation

### Database Setup
```sql
-- Kör CALENDAR_SETUP.sql i Supabase
CREATE TABLE category_colors (
  id UUID PRIMARY KEY
  category VARCHAR(100) UNIQUE
  color_bg VARCHAR(50)
  color_text VARCHAR(50)
  color_border VARCHAR(50)
  hex_color VARCHAR(7)
)
```

### Data Flow
1. Hämta alla bookings från `bookings` table
2. Hämta kategorifarger från `category_colors` table
3. För varje bokning:
   - Extrahera produkter från `products_requested` JSON
   - Slå upp kategori från första produkten
   - Hitta matchande färg från `category_colors`
4. Rendera med rätt färg

### Components
- **MonthView** - 7x6 grid med 31 dagar
- **WeekView** - 7 kolumner med detaljer
- **DayView** - Fokuserad dagsöversikt
- **BookingDetailModal** - Popup med full info
- **ColorSettingsModal** - Admin-panel

## 🚀 Usage

### För att visa kalender:
```
http://localhost:3001/dashboard/calendar
```

### Växla mellan vyer:
- Klick på "Månad", "Vecka" eller "Dag" knappen

### Filtera efter typ:
- Klick på "Event-datum", "Leverans" eller "Retur"

### Se bokningsdetaljer:
- Klick på en bokning för att öppna modal

### Ändra färger:
- Klick "Färginställningar" och redigera i modal
- (Eller uppdatera `category_colors` tabell direkt)

## 📝 Future Enhancements

- [ ] Drag & drop för bokningar mellan dagar
- [ ] Redigera bokningsdatum direkt i kalender
- [ ] Exportera vecka/månad som PDF
- [ ] Notifieringar för kommande leveranser
- [ ] Integration med e-post för bokningsbekräftelser
- [ ] Multi-select för bulk-åtgärder
- [ ] Anpassade färger per användare
- [ ] Kalender-synkronisering (Google Calendar, etc)

## 🐛 Known Issues

- Färgredigering är placeholder (kan uppdateras via SQL)
- Kategorier baseras på första produkten i bokningen
- Event-datum måste ha korrekt format (yyyy-MM-dd)

## 📊 Test Data

Se CALENDAR_SETUP.sql för att initiera kategorifarger i Supabase.
Använd befintliga bokningar för att testa kalender-funktionalitet.

