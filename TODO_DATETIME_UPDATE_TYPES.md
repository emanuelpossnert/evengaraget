# Update types.ts Task Interface

I `app/lib/types.ts`, uppdatera `Task` interface:

```typescript
export interface Task {
  id: string;
  booking_id?: string | null;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'draft';
  task_type?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  assigned_to_user_ids?: string[];
  assigned_to_name?: string;
  
  // NEW FIELDS FOR TODO SCHEDULING
  start_date?: string;      // YYYY-MM-DD
  start_time?: string;      // HH:MM
  end_date?: string;        // YYYY-MM-DD (can be same as start_date or later)
  end_time?: string;        // HH:MM
}
```

Dessa nya fält möjliggör:
- Sätta specifika start- och sluttider för To-Dos
- Låta To-Dos sträcka sig över flera dagar
- Visa To-Dos i kalendern med tidsintervall
