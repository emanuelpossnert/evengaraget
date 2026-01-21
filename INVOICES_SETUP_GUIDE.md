# 🎯 INVOICING SYSTEM SETUP GUIDE

## 📋 OVERVIEW

This guide walks you through setting up the complete invoicing system for EventGaraget:
- Customer information display in customer profile
- Automatic invoice task creation when bookings complete
- Invoice management dashboard
- PDF generation

---

## 🚀 SETUP STEPS

### Step 1: Run SQL in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your EventGaraget project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the contents of:
   ```
   supabase/CREATE_INVOICES_TABLES.sql
   ```
5. Click **Run**

**What this creates:**
- ✅ `invoices` table - Store all invoices
- ✅ `invoice_tasks` table - Track what needs to be invoiced
- ✅ Auto-trigger - Creates invoice task when booking status = "completed"
- ✅ RLS policies - Secure access control
- ✅ Indexes - Performance optimization

**You should see:** "Success. No rows returned" (that's good!)

---

### Step 2: Verify Customer Information

The customer profile now displays:
- ✅ Namn (Name)
- ✅ Email
- ✅ Telefon (Phone)
- ✅ Företag (Company)
- ✅ Org-nummer (Org number)
- ✅ Gatuadress (Street address)
- ✅ Postnummer (Postal code)
- ✅ Stad (City)
- ✅ Land (Country)
- ✅ Kundtyp (Customer type)
- ✅ Status (Active/Inactive/Blocked)
- ✅ Anteckningar (Notes)

**Location:** `/dashboard/customers/[id]` → "Kontaktinformation" section

---

### Step 3: Test Invoice Task Creation

When a booking status changes to "completed":

1. Go to `/dashboard/bookings`
2. Find a booking
3. Go to booking details
4. Change status to "completed"
5. An invoice task is automatically created in `invoice_tasks` table
6. This will show as a notification to create invoice

---

### Step 4: Create Invoices Manually

**Currently:** Invoices are created manually or from bookings

**To create an invoice:**
1. Go to `/dashboard/invoices`
2. Click "Ny Faktura (från bokning)"
3. Select the booking to invoice
4. Fill in invoice details
5. Click "Spara"
6. Invoice appears in list

---

## 📊 INVOICES DASHBOARD FEATURES

Location: `/dashboard/invoices`

### Features Included:

✅ **Search & Filter**
- Search by invoice number, customer name, booking number
- Filter by status: Draft, Sent, Paid, Overdue, Cancelled

✅ **Status Management**
- Draft (📝) - Not yet sent
- Sent (📧) - Sent to customer
- Paid (✅) - Payment received
- Overdue (⚠️) - Past due date
- Cancelled (❌) - Cancelled

✅ **Invoice Actions**
- **Download PDF** - Generate and download invoice as PDF
- **View** - See detailed invoice information
- **Delete** - Remove invoice (if not needed)

✅ **Invoice Details**
- Customer address
- Invoice amounts (subtotal, tax, total)
- Due date
- Items list
- Payment information

✅ **Badge Count**
- Shows number of draft invoices that need to be sent
- Located in sidebar next to "Fakturor" link
- Updates automatically

---

## 🔄 WORKFLOW

### Automatic Workflow:
```
1. Booking Created (draft/pending)
2. Booking Confirmed
3. Event Happens
4. Booking Status Changed to "completed"
   ↓
5. Trigger: Auto-creates invoice_task
6. Notification appears in:
   - Att Göra (TODO) list
   - Customer profile
7. Admin/Manager reviews invoice_task
8. Creates invoice from booking
9. Marks invoice as "sent"
10. Receives payment
11. Marks invoice as "paid"
```

---

## 💾 DATA STORAGE

### Invoices Table Stores:
- Invoice number (auto-formatted: INV-YYYY-NNN)
- Booking reference
- Customer snapshot (name, address, org number, etc.)
- Items list (JSONB - products, quantities, prices)
- Financial info (subtotal, tax, total)
- Status tracking
- Payment information
- Timestamps

### Preserved Customer Info:
When invoice is created, customer details are "snapshotted":
- If customer updates later, invoice keeps original data
- Prevents invoices from changing when customers update info

---

## 🎯 NEXT FEATURES TO ADD

After basic setup works, consider:

1. **Auto-send invoices via email**
   - Automatic email to customer when invoice created
   - Include PDF attachment
   - Track email status

2. **Payment tracking**
   - Mark invoice as "paid"
   - Track payment date and method
   - Generate payment receipts

3. **Invoice templates**
   - Custom company header
   - Custom terms and conditions
   - Brand colors and logo

4. **Bulk operations**
   - Send multiple invoices
   - Mark multiple as paid
   - Export to Excel

5. **Integration with payment systems**
   - Stripe/Swish integration
   - Auto-mark paid when payment received
   - Recurring invoices

---

## 🧪 TESTING CHECKLIST

- [ ] Run CREATE_INVOICES_TABLES.sql in Supabase
- [ ] Verify customer profile shows all fields
- [ ] Create a test booking
- [ ] Change booking status to "completed"
- [ ] Check invoice_tasks table has new entry
- [ ] Go to `/dashboard/invoices`
- [ ] See "Fakturor" in sidebar with badge count
- [ ] Create a test invoice
- [ ] Download PDF
- [ ] Verify PDF contains correct data
- [ ] Filter invoices by status
- [ ] Search by invoice number
- [ ] Delete a test invoice

---

## 🔐 SECURITY

All tables have:
- ✅ RLS (Row Level Security) enabled
- ✅ Service role full access
- ✅ Admin only access via policies
- ✅ Automatic audit trail (created_at, updated_at)
- ✅ Creator tracking (created_by_email)

---

## 🐛 TROUBLESHOOTING

### Issue: "invoice_tasks table not found"
**Solution:** Run CREATE_INVOICES_TABLES.sql in Supabase SQL Editor

### Issue: Invoice PDF not downloading
**Solution:** Check browser console for errors, verify invoice data is complete

### Issue: Customer fields showing "-"
**Solution:** Verify customer was created with all fields filled in

### Issue: Badge count not updating
**Solution:** Refresh page, or check if draft invoices exist in database

---

## 📞 SUPPORT

For issues:
1. Check Supabase SQL logs for errors
2. Verify all SQL ran successfully
3. Check browser DevTools console for JavaScript errors
4. Verify RLS policies allow access

---

**Status:** ✅ READY TO USE

Run the SQL, and the invoicing system is operational!
