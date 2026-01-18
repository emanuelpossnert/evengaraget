# 📧 N8N GMAIL NODE CONFIGURATION GUIDE

## 🎯 GMAIL NODE I WORKFLOWS

Båda workflows har en **Gmail Send Email node** som skickar mailet.

```
├─ N8N_BOOKING_CONFIRMATION_WORKFLOW.json
│  └─ Node: "Send Email" (Gmail)
│
└─ N8N_CUSTOMER_EMAIL_WORKFLOW.json
   └─ Node: "Send Email" (Gmail)
```

---

## ⚙️ GMAIL NODE CONFIGURATION

### **I JSON-filen:**
```json
{
  "name": "Send Email",
  "type": "n8n-nodes-base.emailSend",
  "typeVersion": 1,
  "parameters": {
    "fromEmail": "noreply@eventgaraget.se",
    "toEmail": "={{$json.to}}",
    "subject": "={{$json.subject}}",
    "htmlBody": "={{$json.html}}"
  },
  "credentials": {
    "gmail": "gmail_account"  ← Credential reference
  }
}
```

---

## 🔑 SETUP GMAIL I N8N

### **STEG 1: Create Gmail Credential**

1. Öppna **N8N Dashboard**
2. Gå till: **Settings → Credentials**
3. Klicka: **"New" → "Gmail"**
4. Välj: **"OAuth2"** (recommended)
5. Klicka: **"Connect my account"**
6. Login med din Gmail-account
7. Authorize N8N
8. Save

### **STEG 2: Name the Credential**

Give it a name that matches the JSON:
```
Name: gmail_account
```

This matches: `"credentials": { "gmail": "gmail_account" }`

### **STEG 3: Use in Workflows**

When you import the JSON:
- N8N will show red X on Gmail node
- Click node → Select credential
- Choose: **gmail_account**
- ✅ Done!

---

## 📝 GMAIL NODE PARAMETERS EXPLAINED

### **From Email:**
```
fromEmail: "noreply@eventgaraget.se"
```
- Who the email comes from
- Should be your Gmail address or alias
- Appears in "From:" field

### **To Email:**
```
toEmail: "={{$json.to}}"
```
- Where email goes
- Gets from previous node's `$json.to`
- In both workflows, this is set by Code node

### **Subject:**
```
subject: "={{$json.subject}}"
```
- Email subject line
- From `$json.subject` (provided by webhook)

### **HTML Body:**
```
htmlBody: "={{$json.html}}"
```
- Email content (HTML formatted)
- Created by Code node
- Beautiful template with EventGaraget branding

---

## 🔐 ALTERNATIVE: SMTP INSTEAD OF GMAIL

If you prefer SMTP (SendGrid, custom SMTP):

### **Update JSON to use SMTP:**
```json
{
  "name": "Send Email",
  "type": "n8n-nodes-base.emailSend",
  "typeVersion": 1,
  "parameters": {
    "fromEmail": "noreply@eventgaraget.se",
    "toEmail": "={{$json.to}}",
    "subject": "={{$json.subject}}",
    "htmlBody": "={{$json.html}}"
  },
  "credentials": {
    "smtp": "sendgrid_account"  ← Change this
  }
}
```

Then setup SendGrid/SMTP credential:
1. Settings → Credentials
2. New → SMTP (or SendGrid)
3. Fill in credentials
4. Name it: `sendgrid_account`

---

## 🧪 TEST GMAIL NODE

### **Method 1: Test in Workflow**

1. Open workflow
2. Click "Execute Workflow"
3. Provide test data
4. Watch for errors in Gmail node
5. Check email inbox

### **Method 2: Manual Email Send**

Click directly on Gmail node:
1. Click node menu (three dots)
2. "Test node"
3. Provide test email data
4. Check inbox

### **What to check:**
- ✅ Email arrives
- ✅ From address correct
- ✅ Subject correct
- ✅ HTML formatting correct
- ✅ No errors in logs

---

## ✅ GMAIL CONFIGURATION CHECKLIST

- [ ] Gmail account created (if needed)
- [ ] Gmail credential created in N8N
- [ ] Credential named: `gmail_account`
- [ ] Gmail node connected to credential
- [ ] From email configured
- [ ] Test email sent successfully
- [ ] Emails arrive in inbox (not spam)

---

## 🚀 BOTH WORKFLOWS - GMAIL SETUP

### **Workflow 1: Booking Confirmation**
```
Send Email node:
├─ From: noreply@eventgaraget.se
├─ To: ={{$json.to}} (customer email)
├─ Subject: Booking confirmation email
└─ Body: Beautiful HTML with booking link
```

### **Workflow 2: Customer Email**
```
Send Email node:
├─ From: noreply@eventgaraget.se
├─ To: ={{$json.to}} (customer email)
├─ Subject: Custom subject from admin
└─ Body: Custom message from admin
```

---

## 💡 TIPS

- **Use Gmail OAuth** - More secure than password
- **Test first** - Always test before production
- **Check spam folder** - Sometimes emails end up there
- **Monitor logs** - N8N logs show any errors
- **Use same Gmail account** - For both workflows

---

## 🆘 TROUBLESHOOTING

### **Problem: "No credentials found"**
```
Solution:
1. Create Gmail credential first
2. Go to Settings → Credentials
3. Make sure name matches: gmail_account
```

### **Problem: Email not sent**
```
Solution:
1. Check N8N logs (Executions tab)
2. Verify Gmail credential is active
3. Check "From" email is valid
4. Test with manual test
```

### **Problem: Email in spam folder**
```
Solution:
1. Add EventGaraget to contacts
2. Mark as "Not spam"
3. Setup proper SPF/DKIM (if using custom domain)
```

### **Problem: HTML not rendering**
```
Solution:
1. Check Code node output
2. Verify htmlBody parameter is set
3. Test HTML in browser first
```

---

## 📋 GMAIL NODE IN BOTH WORKFLOWS

**Same configuration used in:**
1. ✅ N8N_BOOKING_CONFIRMATION_WORKFLOW.json
2. ✅ N8N_CUSTOMER_EMAIL_WORKFLOW.json

**Can share same credential:**
- Both use same `gmail_account`
- Same from address
- Different content/subject (handled by Code node)

---

## 🎯 NEXT STEPS

1. Create Gmail credential in N8N
2. Name it: `gmail_account`
3. Import both workflows
4. Connect Gmail nodes to credential
5. Test each workflow
6. Verify emails arrive
7. Go live! 🚀

---

**Ready to configure Gmail?** 🚀

