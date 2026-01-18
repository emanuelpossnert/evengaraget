# 🚀 START HÄR - CRM Login Setup

> **Du behöver bara 3 steg för att kunna logga in på CRM-portalen!**

---

## 📍 DU ÄR HÄR

```
CRM Fas 1: Setup ✅ KLAR
CRM Login Setup: 🔄 START HÄR 👈
CRM Fas 2: Kundhantering: ⏳ KOMMER NÄSTA
```

---

## ⚡ SNABBVERSION (3 minuter)

### Steg 1: Skapa User i Supabase
```
1. Gå till https://app.supabase.com
2. Klicka Authentication → Users
3. Klicka "Add user" → "Invite user"
4. Email: admin@eventgaraget.se
5. Password: Demo123456
6. Klicka "Send invite" eller "Create user"
```

### Steg 2: Kör SQL
```
1. Supabase → SQL Editor
2. Öppna SQL_COMMANDS_QUICK_REFERENCE.md
3. Kopiera ALL SQL (från "SKAPA user_profiles...")
4. Klistra in i SQL Editor
5. Klicka "Run"
```

### Steg 3: Logga In
```
1. http://localhost:3001
2. Email: admin@eventgaraget.se
3. Lösenord: Demo123456
4. Klicka "Logga in"
```

✅ **FÄRDIG!**

---

## 📚 FULLSTÄNDIGA GUIDER

Om du behöver mer detaljer, läs dessa filer:

1. **LOGIN_SETUP_GUIDE.md** ← 👈 LÄS DENNA FÖRST!
   - Steg-för-steg instruktioner
   - Bilder & förklaringar
   - Felsökning

2. **SQL_COMMANDS_QUICK_REFERENCE.md**
   - All SQL kopiera & klistra in
   - SQL förklarad rad för rad
   - Cleanup commands

3. **SETUP_CHECKLIST.md**
   - Detaljerad checklista
   - Vanliga fel & lösningar
   - Verifieringar

4. **SUPABASE_INITIAL_SETUP.sql**
   - Komplett SQL-fil
   - Kan köras direkt

---

## 🎯 VAD SKA VI GÖRA?

### ✅ Setup (Just nu):
- Skapa `user_profiles` tabell i Supabase
- Skapa RLS (Row Level Security) policies
- Skapa demo-användare (admin@eventgaraget.se)
- Verifiera login fungerar

### 🔄 Nästa (Efter login):
- Fas 2: Kundhantering
  - Kundlista-sida
  - Kundkort med detaljer
  - E-posthistorik
  - Redigeringsfunktionalitet

---

## 🆘 NEED HELP?

### Fel: "Route not found" på port 3001
```bash
cd crm-dashboard
npm run dev
```

### Fel: "User not found" eller "Invalid credentials"
```
1. Verifiera user finns i Supabase Auth
2. Verifiera password: Demo123456
3. Kolla user_profiles-raden finns
```

### Databaskopplingen misslyckas
```
1. Verifiera .env.local innehåller Supabase values
2. Verifiera du är online
3. Testa Supabase connection
```

Se **SETUP_CHECKLIST.md** för fler fel & lösningar

---

## 📁 ALLA SETUP FILER

```
crm-dashboard/
├── START_HERE.md ← Du är här!
├── LOGIN_SETUP_GUIDE.md ← Fullständig guide
├── SETUP_CHECKLIST.md ← Checklista + felsökning
├── SQL_COMMANDS_QUICK_REFERENCE.md ← Kopiera SQL härifrån
├── SUPABASE_INITIAL_SETUP.sql ← Komplett SQL-fil
├── SETUP_GUIDE.md (från tidigare)
├── CRM_BUILD_PLAN.md (från tidigare)
└── README.md (från tidigare)
```

---

## ✅ DIN CHECKLISTA

```
□ Läst LOGIN_SETUP_GUIDE.md
□ Skapat admin@eventgaraget.se i Supabase Auth
□ Kört SQL från SQL_COMMANDS_QUICK_REFERENCE.md
□ Verifiera: SELECT * FROM user_profiles; (en rad visas)
□ npm run dev på port 3001
□ Loggat in: admin@eventgaraget.se / Demo123456
□ Ser Dashboard
□ Kan logga ut
```

---

## 🚀 NÄSTA STEG

**Efter lyckad login:**

1. Du får access till CRM-dashboarden
2. Jag börjar bygga **Fas 2: Kundhantering**
3. Vi implementerar:
   - Kundlista (lista alla kunder)
   - Kundkort (visa detaljer)
   - E-posthistorik (från messages-tabellen)
   - Redigeringsfunktionalitet

---

## 💡 TIPS

✨ **Allt är redan förberederat!** Du behöver bara:
1. Skapa en user i Supabase (tar 30 sekunder)
2. Kör SQL (tar 1 minut)
3. Logga in (fungerar direkt)

🔒 **Säkerhet är inbyggd:**
- JWT authentication från Supabase
- RLS policies skyddar data
- Passwords är encrypted
- Protected routes i Next.js

📚 **Alla guider är på svenska** och enkla att följa

---

## 🎉 Då kör vi igång!

**Läs LOGIN_SETUP_GUIDE.md och följ stegen.**

Du kommer att klara det! 💪

---

**Senaste uppdatering:** 2025-11-12
**Status:** 🟡 Login Setup - READY TO GO

