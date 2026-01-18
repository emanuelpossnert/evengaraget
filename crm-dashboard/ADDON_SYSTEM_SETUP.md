# 🎁 Addon System - Architecture & Implementation Guide

## 📋 Overview

Vi behöver skapa ett system där:
- **Addons** kan skapas oberoende (t.ex. Grillkol, LED-belysning)
- **Produkter** kan ha **länkade addons** (Grillstationen → Grillkol)
- Varje produkt kan ha sina egna specifika addons
- Kunderna kan välja addons när de bokar

---

## 🗄️ Supabase Database Changes Required

### 1. **Skapa `addons` Tabell** ✅ (redan gjord)
```sql
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100), -- 'addon' eller 'wrapping'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **Skapa `product_addons` Tabell** (NYTT - linking table)
```sql
CREATE TABLE product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE, -- Om true, måste man välja addon
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);
```

**Varför denna struktur?**
- ✅ En produkt kan ha många addons
- ✅ En addon kan tillhöra flera produkter
- ✅ Vi kan ändra vilka addons som tillhör vilka produkter utan att ändra produkttabellen
- ✅ Flexibelt system

---

## 🛠️ Required Changes

### Step 1: Update `products` Table (Optional Enhancement)
```sql
-- Lägg till dessa kolumner om du vill hålla extra metadata
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_addons BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS addons_required BOOLEAN DEFAULT FALSE;
```

### Step 2: Create SQL Script
```sql
-- Run this in Supabase SQL Editor

-- Create product_addons table
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);

-- Enable RLS
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;

-- Disable RLS for now (can enable later)
ALTER TABLE product_addons DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_product_addons_product_id ON product_addons(product_id);
CREATE INDEX idx_product_addons_addon_id ON product_addons(addon_id);
```

### Step 3: Example Data
```sql
-- Lägg till addons
INSERT INTO addons (name, description, price, category) VALUES
  ('Grillkol', 'Högkvalitativt grillkol', 100, 'addon'),
  ('LED-belysning', 'Professionell LED-belysning', 400, 'addon'),
  ('Värmefläkt', 'Elektrisk värmefläkt', 250, 'addon'),
  ('Folierung', 'Professionell folieringsservice', 3500, 'wrapping');

-- Länka addons till Grillstationen
INSERT INTO product_addons (product_id, addon_id, is_mandatory, display_order)
SELECT 
  (SELECT id FROM products WHERE name = 'Grillstation'),
  id,
  FALSE,
  ROW_NUMBER() OVER (ORDER BY name)
FROM addons
WHERE name IN ('Grillkol', 'LED-belysning', 'Värmefläkt');
```

---

## 💻 Frontend Changes Needed

### 1. Update Product Form to Add Addons

**File:** `app/dashboard/products/page.tsx`

Add new section in form:
```typescript
// After price_per_day input
<div className="lg:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">Länkade Addons</label>
  <div className="space-y-2 max-h-40 overflow-y-auto p-3 border border-gray-300 rounded-lg bg-gray-50">
    {availableAddons.map((addon) => (
      <label key={addon.id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedAddons.includes(addon.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedAddons([...selectedAddons, addon.id]);
            } else {
              setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
            }
          }}
          className="rounded"
        />
        <span className="text-sm text-gray-700">{addon.name} ({addon.price} SEK)</span>
      </label>
    ))}
  </div>
</div>
```

### 2. Create Product Addons Management Page

**File:** `app/dashboard/products/addons/page.tsx`

Similar to current addons page but for managing product-addon linkages.

---

## 🔄 n8n Workflow Updates

### Workflow 02 (Quotation Generation)

When creating a quotation, we need to:

1. **Fetch Product Details** → Include linked addons
2. **Include Available Addons** in quotation data
3. **Pass to Customer** so they can select

**Update in n8n:**

```json
// In "Get Quotation Details" node, change query to:
{
  "select": "*,product_addons(addons(*))"  // Include linked addons
}
```

### Updated Flow:
```
Customer Request
    ↓
Get Booking + Products
    ↓
Get Product Details + ADDONS ← NEW
    ↓
Generate Quotation with Addons ← UPDATED
    ↓
Send to Customer
```

---

## 📱 Quotation Page Updates

### File: `app/quotation/[token]/page.tsx`

Update to show available addons:

```typescript
// Fetch addons for this product
const { data: productAddons } = await supabase
  .from("product_addons")
  .select("addons(*)")
  .eq("product_id", productId);

// Display as checkboxes
{productAddons?.map((pa) => (
  <label key={pa.addon_id}>
    <input
      type="checkbox"
      checked={selectedAddons.includes(pa.addon_id)}
      onChange={(e) => handleAddonChange(e, pa.addon_id)}
    />
    {pa.addons.name} - {pa.addons.price} SEK
  </label>
))}
```

---

## 🎯 Implementation Steps

### Phase 1: Database Setup (Now)
- [ ] Create `product_addons` table
- [ ] Add indexes
- [ ] Insert example data
- [ ] Disable RLS temporarily

### Phase 2: Frontend - Products Page (Next)
- [ ] Update product form with addon checkboxes
- [ ] Create addon management UI
- [ ] Allow editing product-addon relationships

### Phase 3: Frontend - Quotation Page
- [ ] Fetch available addons for product
- [ ] Display addon checkboxes
- [ ] Calculate prices with addons
- [ ] Save selected addons to quotation

### Phase 4: n8n Workflows
- [ ] Update Workflow 02 to fetch addons
- [ ] Update Workflow 03 to include addons in email
- [ ] Update Workflow 01 if needed

---

## 📊 Data Flow Example

```
Grillstation (Product)
    ├── Grillkol (Addon) - 100 SEK
    ├── LED-belysning (Addon) - 400 SEK
    └── Värmefläkt (Addon) - 250 SEK

Customer Books Grillstation
    ↓
Selects: Grillkol + LED-belysning
    ↓
Price = 800 (Grillstation) + 100 (Kol) + 400 (LED) = 1300 SEK
    ↓
Saved to quotation_addons:
    - Grillkol: 100 SEK
    - LED-belysning: 400 SEK
```

---

## 🔒 Security Considerations

### RLS Policies (when ready):
```sql
-- Users can view addons
CREATE POLICY "Anyone can view addons"
  ON addons FOR SELECT
  USING (true);

-- Only admins can manage product_addons
CREATE POLICY "Admins manage product addons"
  ON product_addons FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

## ✅ Testing Checklist

- [ ] Create `product_addons` table
- [ ] Insert test data (Grillstation → Grillkol)
- [ ] Query product with addons via API
- [ ] Update product form UI
- [ ] Test addon selection
- [ ] Verify prices calculate correctly
- [ ] Test quotation generation with addons
- [ ] Verify n8n workflows work
- [ ] Test customer addon selection

---

## 📝 Quick Reference

### SQL Queries

**Get Product with Addons:**
```sql
SELECT p.*, 
  json_agg(json_build_object(
    'addon_id', pa.addon_id,
    'addon_name', a.name,
    'addon_price', a.price,
    'is_mandatory', pa.is_mandatory
  )) as addons
FROM products p
LEFT JOIN product_addons pa ON p.id = pa.product_id
LEFT JOIN addons a ON pa.addon_id = a.id
GROUP BY p.id;
```

**Link Addon to Product:**
```sql
INSERT INTO product_addons (product_id, addon_id, display_order)
VALUES ('product-uuid', 'addon-uuid', 1);
```

---

## 🚀 Next Steps

1. **Run SQL script** to create `product_addons` table
2. **Update Supabase policies** if needed
3. **Update frontend** to support addon management
4. **Update n8n** to fetch and include addons
5. **Test** entire flow

---

**Status:** Ready to implement  
**Priority:** High (needed for quotation customization)  
**Estimated Time:** 2-3 hours

