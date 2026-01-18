# 🔗 NGROK + SUPABASE WEBHOOK SETUP

## 📌 OVERSIKT

För att Supabase webhook ska kunna nå N8N under development:

```
Supabase Table (booking_confirmations)
    ↓ INSERT event
Webhook trigger
    ↓ POST till
ngrok tunnel (exponerar N8N lokalt)
    ↓
N8N webhook endpoint
    ↓
N8N workflow startar
```

---

## 🔧 STEP 1: INSTALLERA NGROK

### **Download ngrok:**
1. Gå till: https://ngrok.com/download
2. Välj ditt OS (macOS/Linux/Windows)
3. Ladda ner och installera

### **Authenticate ngrok (en gång):**
```bash
# Hämta din auth-token från https://dashboard.ngrok.com/auth
ngrok authtoken YOUR_AUTH_TOKEN_HERE
```

---

## 🚀 STEP 2: STARTA NGROK FÖR N8N

### **Öppna terminal och kör:**

```bash
# ngrok exponerar localhost:5678 (N8N standard port)
ngrok http 5678
```

**Du får något som detta:**
```
ngrok                                       (Ctrl+C to quit)

Session Status                online
Session Expires             1 hour 59 minutes
Version                     3.3.0
Region                      eu
Forwarding                  https://abc123def456.ngrok.io -> http://localhost:5678
Forwarding                  http://abc123def456.ngrok.io -> http://localhost:5678

Web Interface               http://127.0.0.1:4040

Connections                ttl     opn     rt1     rt5     p50     p99
                            0       0       0.00    0.00    0.00    0.00
```

**KOPIERA denna URL:**
```
https://abc123def456.ngrok.io
```

---

## 🎯 STEP 3: SKAPA WEBHOOK I SUPABASE

### **I Supabase Console:**

1. Gå till: **Settings → Webhooks** (eller **Database → Webhooks**)
2. Klicka: **"Create a new webhook"**
3. Fyll i:

```
Webhook Name: "Booking Confirmation Email"

Table: booking_confirmations
Events: INSERT ✓ (UPDATE ☐, DELETE ☐)

HTTP method: POST

URL: https://abc123def456.ngrok.io/webhook/booking-confirmation
     (Är din ngrok URL från steg 2)

Headers (optional):
  Key: Authorization
  Value: Bearer your-secret-token (optional, för säkerhet)
```

4. Klicka: **"Create webhook"**

---

## 📊 WEBHOOK PAYLOAD

När en ny rad insertas i `booking_confirmations`, skickar Supabase denna JSON:

```json
{
  "type": "INSERT",
  "schema": "public",
  "table": "booking_confirmations",
  "record": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "booking_id": "abc-123-def",
    "token": "secure-token-12345",
    "email_sent": false,
    "status": "pending",
    "created_at": "2024-12-10T12:00:00Z"
  },
  "old_record": null
}
```

**N8N mottar detta som `$json.record`**

---

## ✅ VERIFIERING

### **Test webhooket:**

**Option A: Via Supabase UI**
1. Supabase Console → Webhooks
2. Klicka på din webhook
3. Klicka: **"Send Test"**
4. Check N8N execution logs

**Option B: Via N8N**
1. Öppna N8N workflow: "Booking Confirmation Email"
2. Check Executions tab
3. Ska se en execution från webhook

**Option C: Via ngrok Web Interface**
1. Öppna: http://127.0.0.1:4040
2. Se alla requests som kommer in
3. Klicka på request för att se payload

---

## 🔄 TEST FLOW

1. **Terminal 1:** Starta ngrok
   ```bash
   ngrok http 5678
   ```

2. **Terminal 2:** Starta N8N (om inte redan running)
   ```bash
   docker compose up n8n
   ```

3. **Supabase Console:** Skapa webhook med ngrok URL

4. **Testa webhook:**
   - Supabase: Send test
   - N8N logs: Check om den mottogs
   - ngrok interface: Se request details

---

## 🚨 TROUBLESHOOTING

### **Problem: Webhook tar timeout**
```
Lösning:
1. Kontrollera ngrok körs (terminal visar "Forwarding")
2. Kontrollera N8N körs (localhost:5678)
3. Testa URL i browser: https://abc123def456.ngrok.io
```

### **Problem: ngrok URL ändras**
```
Varje gång du startar ngrok får du ny URL!
Lösning:
1. Uppdatera webhook URL i Supabase
2. Eller köp ngrok PRO för statisk URL
```

### **Problem: 502 Bad Gateway**
```
Lösning:
1. N8N körs inte på port 5678
2. Firewall blockerar ngrok
3. Webhookens path är fel
```

---

## 💡 TIPS

- **Ngrok körs i förgrunden** - Håll terminalen öppen
- **Ngrok URL byter vid varje omstart** - Uppdatera Supabase webhook
- **Check ngrok logs** - http://127.0.0.1:4040 visar alla requests
- **ngrok PRO** - Statisk URL för ~$10/månad

---

## 📋 WEBHOOK PATH I N8N

Din N8N webhook node är konfigurerad för:
```
Path: /webhook/booking-confirmation
```

**Tillsammans med ngrok blir full URL:**
```
https://abc123def456.ngrok.io/webhook/booking-confirmation
```

---

## 🎯 PRODUKTIONSETUP

**Later (inte nu), när du deployas:**
- ❌ Ngrok behövs inte längre
- ✅ Supabase kan peka direkt till: `https://your-production-n8n.com/webhook/booking-confirmation`
- ✅ Ingen tunneling behövs

---

## 🚀 NÄSTA STEG

1. **Installera ngrok**
2. **Starta ngrok** för N8N
3. **Kopiera ngrok URL**
4. **Skapa webhook** i Supabase
5. **Test webhook** från Supabase UI
6. **Verifiera** N8N triggade

---

**Du är redo att få webhooks att fungera!** 🎉

