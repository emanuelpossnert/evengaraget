# EventGaraget - Supabase Setup Guide

## Step-by-Step Installation

### Phase 1: Copy SQL Schema

**File:** `/supabase/schema-v2.sql` (700+ lines)

This file contains:
- ✅ 12 optimized tables
- ✅ 20+ indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp triggers
- ✅ Sample product data (10 products)

---

## Step 1: Go to Supabase

1. Open your Supabase project: https://app.supabase.com
2. Select your project: `EventGaraget`
3. Navigate to **SQL Editor** (left sidebar)

---

## Step 2: Copy the SQL Code

1. Open file: `/supabase/schema-v2.sql`
2. Select ALL code (Ctrl+A or Cmd+A)
3. Copy (Ctrl+C or Cmd+C)

---

## Step 3: Execute in Supabase

1. In Supabase SQL Editor, click **"New Query"** (blue button top-right)
2. Paste the SQL code (Ctrl+V or Cmd+V)
3. Click **"Run"** button (⏵ play icon)

**Wait 30-60 seconds for execution**

---

## Step 4: Verify Success

Look for these messages in the output:

```
CREATE EXTENSION
CREATE FUNCTION
CREATE TABLE (repeated 12 times)
CREATE INDEX (repeated 20+ times)
ALTER TABLE
CREATE POLICY (repeated 12 times)
CREATE TRIGGER (repeated multiple times)
INSERT 0 10  ← Sample products inserted
```

---

## Step 5: Verify Tables

Run this verification query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Result (12 rows):**
```
ai_analytics
booking_items
booking_products
bookings
conversations
customers
escalations
messages
products
quotation_items
quotations
reminders
signatures
```

---

## Step 6: Verify Sample Products

Run this query:

```sql
SELECT name, category, base_price_per_day, quantity_total 
FROM products 
ORDER BY category, name;
```

**Expected Result (10 rows):**
```
Bord 180cm | furniture | 150 | 20
Golv trä (per kvm) | flooring | 85 | 200
Grillstation | equipment | 800 | 3
Lysrör LED | lighting | 120 | 30
Partytält 3x3m | tents | 1200 | 5
Partytält 4x4m | tents | 1800 | 3
Partytält 4x8m | tents | 2500 | 4
Partytält 6x12m | tents | 5500 | 2
Stol vit | furniture | 45 | 100
Värmepump 9kW | heating | 450 | 8
```

---

## Step 7: Check RLS Policies

Run this query:

```sql
SELECT tablename, policyname 
FROM pg_policies 
ORDER BY tablename;
```

**Expected Result:** 12 policies (one per table)

Each policy should be: "Enable full access for service role"

---

## Troubleshooting

### Issue: "Error: relation already exists"
**Solution:** The schema already exists. Either:
- Option A: Clear and restart (Contact Supabase support)
- Option B: Skip to Step 4 (Verify Success)

### Issue: "Error: permission denied"
**Solution:** Check you have admin access to the project
- Go to Project Settings > Team > Check your role

### Issue: Sample products not inserted
**Solution:** Run insert manually:
```sql
INSERT INTO products (name, category, description, base_price_per_day, quantity_total, can_be_wrapped, wrapping_cost) VALUES
('Partytält 3x3m', 'tents', 'Mindre partytält perfekt för upp till 15 personer', 1200, 5, false, 0);
-- ... (add other products)
```

### Issue: Cannot see tables in Supabase UI
**Solution:** Refresh the page (Cmd+R or Ctrl+R)

---

## What's Next?

After successful Supabase setup:

1. ✅ Verify all 12 tables exist
2. ✅ Verify 10 sample products inserted
3. ✅ Verify RLS policies enabled
4. ⏳ **Build n8n Workflows** (see N8N_WORKFLOWS.md)

---

## Supabase Credentials (for n8n)

You'll need these for n8n workflows:

**Get from:** Supabase Project Settings > API

- **SUPABASE_URL:** `https://[project-id].supabase.co`
- **SUPABASE_API_KEY:** Copy "Service Role Secret" (⚠️ Keep private!)
- **SUPABASE_ANON_KEY:** (Public, for frontend)

Store in `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

---

## Timeline

- ⏱️ **SQL Execution:** 30-60 seconds
- ⏱️ **Verification:** 5 minutes
- ⏱️ **Total:** ~10 minutes

---

## Success Checklist ✅

- [ ] All 12 tables created
- [ ] 20+ indexes created
- [ ] 12 RLS policies enabled
- [ ] 10 sample products inserted
- [ ] Can query products table
- [ ] Credentials saved in `.env`
- [ ] Ready for n8n setup

---

**Next Step:** Build n8n Workflows (see N8N_WORKFLOWS.md)
