# 🎁 Addon System - Setup Instructions

## ✅ Quick Start (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your EventGaraget project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Copy & Run SQL Script
1. Open file: `ADDON_SYSTEM.sql`
2. Copy ALL the code
3. Paste in Supabase SQL Editor
4. Click **Run** button (or `Cmd+Enter`)

### Step 3: Verify Setup
You should see output:
```
Addons created:
✅ 4 addons

Product-Addon links created:
✅ 3 links

Example: Grillstation addons:
✅ Grillkol - 100 SEK
✅ LED-belysning - 400 SEK  
✅ Värmefläkt - 250 SEK
```

---

## 🎯 If You Get an Error

### "syntax error at end of input"
**Solution:** Run each section separately (Step 1-7 in the SQL file)

**How:**
1. Highlight Step 1 code (CREATE TABLE...)
2. Click Run
3. Wait for success
4. Go to Step 2
5. Repeat

---

## 📊 What Was Created

### New Table: `product_addons`
Links products to their available addons.

**Example:**
```
Grillstation (Product)
    ├── Grillkol (100 SEK)
    ├── LED-belysning (400 SEK)
    └── Värmefläkt (250 SEK)

Partytält (Product)
    └── (no addons)
```

### How to Query
```sql
-- Get Grillstation with all its addons
SELECT 
  p.name as product,
  a.name as addon,
  a.price
FROM product_addons pa
JOIN products p ON pa.product_id = p.id
JOIN addons a ON pa.addon_id = a.id
WHERE p.name = 'Grillstation'
ORDER BY a.name;
```

---

## 🔧 Manual Setup (If SQL Doesn't Work)

### Option A: Copy-Paste Commands One-by-One

**Command 1:**
```sql
CREATE TABLE IF NOT EXISTS product_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, addon_id)
);
```

**Command 2:**
```sql
CREATE INDEX IF NOT EXISTS idx_product_addons_product_id ON product_addons(product_id);
```

**Command 3:**
```sql
CREATE INDEX IF NOT EXISTS idx_product_addons_addon_id ON product_addons(addon_id);
```

**Command 4:**
```sql
ALTER TABLE product_addons DISABLE ROW LEVEL SECURITY;
```

**Command 5:** (Only if addons table is missing)
```sql
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Command 6:** (Insert addons)
```sql
INSERT INTO addons (name, description, price, category, is_active)
VALUES 
  ('Grillkol', 'Högkvalitativt grillkol för optimal eldning', 100, 'addon', TRUE),
  ('LED-belysning', 'Professionell LED-belysning för kvälls-events', 400, 'addon', TRUE),
  ('Värmefläkt', 'Elektrisk värmefläkt för behaglig temperatur', 250, 'addon', TRUE),
  ('Folierung', 'Professionell folieringsservice för branding', 3500, 'wrapping', TRUE)
ON CONFLICT DO NOTHING;
```

**Command 7:** (Link Grillstation to addons)
```sql
WITH grillstation AS (
  SELECT id FROM products WHERE name = 'Grillstation' LIMIT 1
),
addons_to_link AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as ord
  FROM addons 
  WHERE name IN ('Grillkol', 'LED-belysning', 'Värmefläkt')
)
INSERT INTO product_addons (product_id, addon_id, display_order, is_mandatory)
SELECT grillstation.id, addons_to_link.id, addons_to_link.ord, FALSE
FROM grillstation, addons_to_link
WHERE grillstation.id IS NOT NULL
ON CONFLICT DO NOTHING;
```

---

## ✅ Verification Checklist

After running SQL, verify:

- [ ] `product_addons` table exists
  ```sql
  SELECT * FROM product_addons;
  ```

- [ ] Indexes created
  ```sql
  SELECT * FROM pg_indexes WHERE tablename = 'product_addons';
  ```

- [ ] Grillstation has 3 addons
  ```sql
  SELECT COUNT(*) FROM product_addons 
  WHERE product_id = (SELECT id FROM products WHERE name = 'Grillstation');
  ```

- [ ] Can query product with addons
  ```sql
  SELECT p.name, json_agg(json_build_object('addon', a.name, 'price', a.price))
  FROM product_addons pa
  JOIN products p ON pa.product_id = p.id
  JOIN addons a ON pa.addon_id = a.id
  GROUP BY p.name;
  ```

---

## 🚀 Next Steps

After SQL setup is done:

1. **Update Frontend** - Add addon selection UI
2. **Update n8n** - Include addons in quotation flow
3. **Test** - Create quotation with addons
4. **Deploy** - Go live with new feature

---

## 📞 Troubleshooting

### Problem: "relation 'addons' does not exist"
**Cause:** addons table missing (should exist from earlier setup)
**Solution:** Uncomment and run the CREATE TABLE addons command in Step 5

### Problem: "products' table does not exist"
**Cause:** products table missing (something went wrong in earlier setup)
**Solution:** Run `SUPABASE_INITIAL_SETUP.sql` first

### Problem: "permission denied for schema public"
**Cause:** User doesn't have write permissions
**Solution:** Use role with higher permissions (service_role or admin)

---

## 📝 Reference

**Files Involved:**
- `ADDON_SYSTEM.sql` - Complete SQL script
- `ADDON_SYSTEM_SETUP.md` - Architecture guide
- `ADDON_SETUP_INSTRUCTIONS.md` - This file

**Next Files to Update:**
- `app/dashboard/products/page.tsx` - Add UI for addons
- `app/quotation/[token]/page.tsx` - Show available addons
- n8n workflows - Include addons in flow

---

**Status:** Ready to run ✅  
**Time to setup:** 5-10 minutes  
**Difficulty:** Easy (just copy-paste SQL)

