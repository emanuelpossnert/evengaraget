# ✅ IMPORT DENNA FIL NU!

## 📁 NY FILE KLAR:

**01-email-classification-COMPLETE.json**

✅ **18 nodes - ALLA KOPPLAD**
✅ **Supabase nodes endast**
✅ **Inga HTTP problem**
✅ **INGEN "AI Agent" nämning**

---

## 🚀 GÖRT SÅ HÄR:

### 1. I n8n - Delete gamla workflow
```
1. Öppna n8n
2. Hitta gamla "01-email-classification"
3. Klicka "..." → Delete
4. Bekräfta
```

### 2. Import ny workflow
```
1. Klicka "+ New"
2. Klicka "Import from file"
3. Välj: 01-email-classification-COMPLETE.json
4. Klicka "Import"
```

### 3. Aktivera workflow
```
1. Öppna nya workflow
2. Se att alla 18 nodes är synliga i ordning (1️⃣ - 1️⃣8️⃣)
3. Klicka toggle "Active" (ska vara grön)
4. Spara
```

### 4. Skicka test-email
```
1. Öppna Gmail
2. Från: test@gmail.com (INTE admin@striky.se!)
3. Till: admin@striky.se
4. Ämne: "Hej, vill hyra ett tält"
5. Vänta 1-2 minuter
```

### 5. Verifiera resultat
```
- ✅ Mottog svar på test@gmail.com?
- ✅ Data i Supabase conversations?
- ✅ 2 rows i Supabase messages (inbound + outbound)?
```

---

## 🔗 CONNECTIONS (ALLA KOPPLADE):

```
Gmail Trigger 
     ↓
Extract Email (1️⃣)
     ↓
Check Customer (2️⃣)
     ↓
Check/Create Customer (3️⃣)
     ↓
Fetch History (4️⃣)
     ↓
Get Price List (5️⃣)
     ↓
Get FAQ (6️⃣)
     ↓
Merge Data (7️⃣)
     ↓
Find Conversation (8️⃣)
     ↓
Check Conversation (9️⃣)
     ↓
Create Conversation (🔟)
     ↓
Get Final Conv ID (1️⃣1️⃣)
     ↓
AI Response (1️⃣2️⃣)
     ↓
Format Email (1️⃣3️⃣)
     ↓
     ├→ Send Email (1️⃣4️⃣)
     ├→ Prepare Incoming (1️⃣5️⃣)
     │      ↓
     │  Save Incoming (1️⃣6️⃣)
     └→ Prepare Outgoing (1️⃣7️⃣)
            ↓
        Save Outgoing (1️⃣8️⃣)
```

---

**NU FUNKAR DET! 🚀**

