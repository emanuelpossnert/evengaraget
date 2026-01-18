# 🎯 Customer KPI Update Implementation Guide

## Problem
The customer KPIs (Totala Bokningar, Total Intäkt, Livstidsvärde) always show 0 because they are never updated in the database.

## Solution
We've created a SQL function and trigger that automatically updates customer statistics when booking status changes.

---

## 🔧 Implementation Steps

### Step 1: Run SQL Script in Supabase
1. Go to Supabase Console → SQL Editor
2. Open the file: `supabase/UPDATE_CUSTOMER_STATS.sql`
3. Copy the entire content
4. Paste into Supabase SQL Editor
5. Click "Run" button
6. ✅ The function, trigger, and initial data population will execute

### Step 2: Verify the Implementation
After running the script:

1. Check if function was created:
```sql
SELECT * FROM pg_proc WHERE proname = 'update_customer_stats';
```

2. Check if trigger was created:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_update_customer_stats_on_booking';
```

3. Check if customer stats were populated:
```sql
SELECT id, name, email, total_bookings, total_revenue, lifetime_value 
FROM customers 
WHERE total_bookings > 0;
```

---

## 📊 How It Works

### Automatic Update Trigger
When a booking status is updated:
1. System checks if status changed to: `confirmed`, `completed`, or `cancelled`
2. Calls `update_customer_stats()` function for that customer
3. Function recalculates:
   - **total_bookings**: Count of confirmed + completed bookings
   - **total_revenue**: Sum of amounts from confirmed + completed bookings
   - **lifetime_value**: Same as total_revenue (cumulative value)

### Data Flow
```
User changes booking status
           ↓
Trigger fires (if status → confirmed/completed/cancelled)
           ↓
update_customer_stats() function runs
           ↓
Recalculates customer totals
           ↓
Updates customers table
           ↓
Next time customer detail page loads, KPIs show real data
```

---

## ✅ Database Schema

### Functions Created
- `update_customer_stats(customer_id UUID)` - Updates stats for one customer

### Triggers Created
- `trg_update_customer_stats_on_booking` - Fires when booking status changes

### Columns Used
These must already exist in `customers` table:
- `total_bookings` (INTEGER DEFAULT 0)
- `total_revenue` (DECIMAL(10,2) DEFAULT 0)
- `lifetime_value` (DECIMAL(10,2) DEFAULT 0)

✅ **All columns already exist in schema-v2.sql**

---

## 🧪 Test the Implementation

### Test Case 1: Create New Booking and Confirm It
1. Create a new booking
2. Go to `/dashboard/bookings/[id]`
3. Complete review checklist
4. Click "Godkänn Bokning" (changes status to pending)
5. Go to `/dashboard/customers/[id]` 
6. Check Overview tab - should still show 0 (needs to be confirmed)

### Test Case 2: Confirm Booking
1. On `/dashboard/bookings` page
2. Find the booking with status "Väntande" (pending)
3. Click "Bekräfta" button (changes status to confirmed)
4. Go to `/dashboard/customers/[id]`
5. Check Overview tab - **should now show updated KPIs!** ✅

### Test Case 3: Multiple Bookings
1. Confirm 3 bookings for same customer
2. Go to customer detail page
3. Should show:
   - Totala Bokningar: 3
   - Total Intäkt: sum of all 3 amounts
   - Livstidsvärde: same as total revenue

---

## 📝 Frontend Notes

The frontend already displays these fields correctly:
- `customer.total_bookings` - shown in Overview
- `customer.total_revenue` - shown in Overview
- `customer.lifetime_value` - shown in Overview

No frontend changes needed! Once the SQL trigger is set up, data will flow automatically.

---

## 🔄 How Status Changes Work

### Draft → Pending (Approval)
- Status changes to "pending"
- Function runs but **doesn't count yet** (pending ≠ confirmed)
- KPIs stay same

### Pending → Confirmed (Confirmation)
- Status changes to "confirmed"
- Function runs and **counts this booking** ✅
- KPIs update to include this booking

### Confirmed → Completed (After Event)
- Status changes to "completed"
- Function runs and still counts it ✅
- KPIs unchanged (already counted)

### Any → Cancelled
- Status changes to "cancelled"
- Function runs and **removes from count** if it was confirmed
- KPIs update accordingly

---

## 🚀 Next Steps

After implementation:

1. ✅ Run the SQL script in Supabase
2. ✅ Test with a real booking confirmation
3. ✅ Verify KPIs update on customer detail page
4. ✅ Monitor for any issues in development

---

## 📞 Troubleshooting

### KPIs still show 0
- Check if trigger was created: `SELECT * FROM pg_trigger WHERE tgname = 'trg_update_customer_stats_on_booking';`
- Check booking status: `SELECT id, booking_number, status FROM bookings WHERE customer_id = '...';`
- Try running manually: `SELECT update_customer_stats('customer-id');`

### Trigger not firing
- Make sure booking status is actually changing (check with SELECT before/after)
- Check Supabase logs for SQL errors
- Verify trigger syntax: `\d+ bookings` to see triggers

### Function error
- Check function created: `SELECT * FROM pg_proc WHERE proname = 'update_customer_stats';`
- Run manual test: `SELECT update_customer_stats('any-customer-uuid');`

---

## 📊 Performance Notes

- Function runs only on status changes to confirmed/completed/cancelled (minimal overhead)
- Recalculation is fast (just COUNT/SUM queries with indexes)
- Can handle thousands of customers without issue
- Initial run updates all customers in one go

---

**Status:** Ready for implementation in Supabase ✅

