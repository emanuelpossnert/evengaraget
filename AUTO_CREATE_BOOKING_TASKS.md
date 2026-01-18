# 🤖 AUTO-SKAPA TASKS FRÅN N8N (OPT)

## Idé: Automatisk Task-generering

Denna n8n-workflow kan **automatiskt skapa booking_tasks** när:
1. En ny bokning skapas
2. En bokning blir "pending" (godkänd)
3. Fler händelser...

### Option A: Webhook från Supabase

**Trigger**: `bookings INSERT`
- Hämta bokning
- Skapa tasks:
  - "Kontrollera leveransuppgifter" (priority: high)
  - "Vänta på godkännande från kund" (priority: medium)
  - "Skicka bekräftelse" (priority: high)

**Webhook-URL**: `https://[ngrok]/webhook/auto-create-tasks`

### Option B: N8N Schedule

Varje timma: Hämta alla "pending" bokningar → Skapa tasks

---

## 🚀 IMPLEMENTERING I N8N

Eftersom vi redan har en webhooks setup, kan vi:

1. **Skapa en ny workflow**: "Auto-Create Booking Tasks"
2. **Webhook node**: Lyssna på `/auto-create-tasks`
3. **Supabase node**: Hämta bokning
4. **Code node**: Generera task-lista
5. **Loop**: Skapa 1-3 tasks per bokning

### ALTERNATIV: Manuell Integration

Lägg till detta i befintliga workflows där bokningar skapas/uppdateras!

---

## 📝 SQL-EXAMPLES FÖR MANUELL TASK-CREATION

```sql
-- Skapa task när ny bokning skapas
INSERT INTO booking_tasks (booking_id, title, description, priority, due_date, task_type)
VALUES (
  'booking-id-here',
  'Granskas av admin',
  'Ny bokning behöver granskas och godkännas',
  'high',
  CURRENT_DATE + interval '1 day',
  'review'
);

-- Skapa task för pending confirmation
INSERT INTO booking_tasks (booking_id, title, description, priority, task_type)
VALUES (
  'booking-id-here',
  'Vänta på kundbekräftelse',
  'Bekräftelselänk skickad - väntar på svar från kund',
  'medium',
  'follow_up'
);
```

---

## ✅ NÄSTA STEG

Du kan:
1. **Implementera i n8n nu** (avancerat)
2. **Lägga till manuellt i CRM** (enklare)
3. **Skapa trigger från Supabase** (bättre)

Vilken vill du?
