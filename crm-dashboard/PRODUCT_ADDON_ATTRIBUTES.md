# 📊 Products & Addons - Database Attributes

## PRODUCTS TABLE
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY
  name VARCHAR(255) UNIQUE NOT NULL          -- Ex: "Grillstation"
  category VARCHAR(100)                       -- Ex: "Grill", "Tält", "Möbler", etc.
  description TEXT                            -- Produktbeskrivning
  base_price_per_day DECIMAL(10, 2)          -- Pris per dag
  min_rental_days INTEGER DEFAULT 1           -- Minimum hyrtid
  quantity_total INTEGER DEFAULT 1            -- Total antal i lager
  quantity_available INTEGER DEFAULT 1        -- Tillgängligt antal nu
  requires_setup BOOLEAN DEFAULT false        -- Behöver setup?
  setup_cost DECIMAL(10, 2) DEFAULT 0        -- Setup kostnad
  can_be_wrapped BOOLEAN DEFAULT false        -- Kan folieras?
  wrapping_cost DECIMAL(10, 2) DEFAULT 0     -- Folieringstid
  image_url TEXT                              -- Produktbild
  specifications JSONB                        -- Tekniska specifikationer
  created_at TIMESTAMP                        -- Auto
  updated_at TIMESTAMP                        -- Auto
)
```

## ADDONS TABLE (NEW STRUCTURE)
```sql
CREATE TABLE addons (
  id UUID PRIMARY KEY
  name VARCHAR(255) UNIQUE NOT NULL           -- Ex: "Grillkol", "LED-belysning"
  price DECIMAL(10, 2) NOT NULL              -- Ex: 150.00
  category VARCHAR(100)                       -- Ex: "Tillbehör", "Belysning"
  is_active BOOLEAN DEFAULT TRUE              -- Aktiv/Inaktiv
  description TEXT                            -- Beskrivning
  created_at TIMESTAMP                        -- Auto
  updated_at TIMESTAMP                        -- Auto
)
```

## PRODUCT_ADDONS LINKING TABLE
```sql
CREATE TABLE product_addons (
  id UUID PRIMARY KEY
  product_id UUID REFERENCES products(id)     -- FK till produkt
  addon_id UUID REFERENCES addons(id)         -- FK till addon
  display_order INT DEFAULT 0                 -- Visningsordning
  is_mandatory BOOLEAN DEFAULT FALSE          -- Obligatorisk?
  created_at TIMESTAMP                        -- Auto
  updated_at TIMESTAMP                        -- Auto
  UNIQUE(product_id, addon_id)               -- Var addon per produkt
)
```

## API ENDPOINTS

### 1. Hämta produkter med addons
```bash
GET /rest/v1/products?select=*
```

### 2. Hämta addons för en produkt
```bash
GET /rest/v1/product_addons?product_id=eq.{UUID}&select=addon_id,addons(*),display_order
```

### 3. Hämta alla addons
```bash
GET /rest/v1/addons?select=*
```

### 4. Skapa produkt
```json
POST /rest/v1/products
{
  "name": "Grillstation",
  "category": "Grill",
  "description": "Professionell grillstation...",
  "base_price_per_day": 500.00,
  "quantity_total": 2,
  "quantity_available": 2,
  "can_be_wrapped": true,
  "wrapping_cost": 150.00
}
```

### 5. Skapa addon
```json
POST /rest/v1/addons
{
  "name": "Grillkol",
  "price": 150.00,
  "category": "Tillbehör",
  "is_active": true
}
```

### 6. Länka addon till produkt
```json
POST /rest/v1/product_addons
{
  "product_id": "{UUID}",
  "addon_id": "{UUID}",
  "display_order": 1,
  "is_mandatory": false
}
```

## FORM FIELDS - NYA PRODUKTER

### Bas Information
- [x] Produktnamn (VARCHAR)
- [x] Kategori (SELECT dropdown)
- [x] Beskrivning (TEXTAREA)
- [x] Bild (FILE/URL)

### Priser
- [x] Pris per dag (DECIMAL)
- [x] Min hyrtid dagar (NUMBER)

### Lager
- [x] Total antal (NUMBER)
- [x] Tillgängligt antal (NUMBER)

### Tjänster
- [x] Kräver setup? (CHECKBOX)
  - If YES → Setup kostnad (DECIMAL)

- [x] Kan folieras? (CHECKBOX)
  - If YES → Folieringskostnad (DECIMAL)

### Tekniska detaljer
- [x] Specifikationer (JSON/TEXT)

### Kopplade Addons
- [ ] Multiselect av tillgängliga addons
- [ ] Visa all addons från addons-tabellen
- [ ] Markera som obligatorisk/valfri
- [ ] Drag & drop för ordning

## FORM FIELDS - NYA ADDONS

### Bas Information
- [x] Addonnamn (VARCHAR)
- [x] Kategori (SELECT dropdown)
- [x] Beskrivning (TEXTAREA)

### Pris
- [x] Pris (DECIMAL)

### Status
- [x] Aktiv? (CHECKBOX, default TRUE)

---

## IMPLEMENTATION TODO

1. ✅ Supabase tabeller skapade
2. ⏳ Uppdatera produktformulär med alla attribut
3. ⏳ Lägg till addon-multiselector i produktformulär
4. ⏳ Skapa separat addon-management sida
5. ⏳ Uppdatera produktlistan för att visa addons
6. ⏳ Uppdatera quotation-sidan (redan gjort, men verifiera)
7. ⏳ Uppdatera signing-sidan för PDF
8. ⏳ Uppdatera CRM bokningskort

