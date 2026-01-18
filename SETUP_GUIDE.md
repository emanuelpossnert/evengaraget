# EventGaraget Setup Guide

Complete step-by-step guide to deploy the AI Booking Agent.

## 📋 Pre-Setup Checklist

- [ ] Google Workspace account with Gmail
- [ ] Supabase account (free tier works)
- [ ] OpenAI API key with credits
- [ ] Docker installed (for self-hosted) OR n8n Cloud account
- [ ] Slack workspace (optional)

## 🔧 Step 1: Google Cloud Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select Project" → "New Project"
3. Name: "EventGaraget n8n"
4. Click "Create"

### 1.2 Enable APIs

1. Navigate to "APIs & Services" → "Library"
2. Search and enable:
   - Gmail API
   - Google Sheets API

### 1.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen:
   - User Type: External
   - App name: EventGaraget Booking
   - Support email: your@email.com
4. Create OAuth Client:
   - Application type: Web application
   - Name: n8n EventGaraget
   - Authorized redirect URIs: `https://YOUR-N8N-URL/rest/oauth2-credential/callback`
5. Save Client ID and Client Secret

## 🗄️ Step 2: Supabase Setup

### 2.1 Create Project

1. Go to [Supabase](https://supabase.com)
2. Click "New Project"
3. Name: "eventgaraget"
4. Database Password: (save this!)
5. Region: Choose closest to you
6. Click "Create Project"

### 2.2 Run Database Schema

1. Wait for project to finish setting up
2. Go to "SQL Editor"
3. Open file `supabase/schema.sql` from this repo
4. Copy entire content
5. Paste in SQL Editor
6. Click "Run"
7. Verify all tables created (check "Table Editor")

### 2.3 Get API Keys

1. Go to "Settings" → "API"
2. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key (keep secure!)

## 🤖 Step 3: OpenAI Setup

### 3.1 Get API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to "API Keys"
3. Click "Create new secret key"
4. Name: "EventGaraget n8n"
5. Copy and save the key (won't be shown again!)

### 3.2 Add Credits

1. Go to "Billing"
2. Add payment method
3. Add initial credits ($20-50 recommended to start)

## 📊 Step 4: Google Sheets Setup

### 4.1 Create FAQ Sheet

1. Create new Google Sheet
2. Name: "EventGaraget Knowledge Base"
3. Create sheet named "FAQ" with columns:
   - Kategori
   - Fråga
   - Svar
   - Nyckelord

4. Add sample data:

```
Kategori       | Fråga                          | Svar                                              | Nyckelord
---------------|--------------------------------|---------------------------------------------------|------------------
Leverans       | Hur lång är leveranstiden?     | Vi levererar normalt inom 2-3 arbetsdagar         | leverans,tid
Priser         | Vad kostar partytält?          | Partytält 4x8m: 2500kr/dag, 6x12m: 4500kr/dag    | pris,tält,kostnad
Villkor        | Kan jag avboka?                | Kostnadsfri avbokning fram till 48h före leverans | avboka,ångra
```

5. Copy Sheet ID from URL: `https://docs.google.com/spreadsheets/d/SHEET-ID-HERE/edit`

### 4.2 Create Price List Sheet

1. Same spreadsheet, create new sheet "PriceList"
2. Add columns:
   - productName
   - pricePerDay
   - unit
   - category
   - minOrder

3. Add your products:

```
productName        | pricePerDay | unit | category | minOrder
-------------------|-------------|------|----------|----------
Partytält 4x8m     | 2500        | st   | Tält     | 1
Partytält 6x12m    | 4500        | st   | Tält     | 1
Ståbord            | 150         | st   | Möbler   | 5
Stol vit plast     | 35          | st   | Möbler   | 10
Värmefläkt         | 450         | st   | Värme    | 1
```

### 4.3 Share Sheet

1. Click "Share"
2. Add your Gmail account used for n8n
3. Give "Editor" access

## 🐳 Step 5: Deploy n8n

### Option A: Docker (Self-Hosted)

1. Clone this repository:
```bash
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your credentials:
```bash
nano .env
# Fill in all API keys, URLs, etc.
```

4. Start Docker containers:
```bash
docker-compose up -d
```

5. Check logs:
```bash
docker-compose logs -f n8n
```

6. Access n8n:
```
http://localhost:5678
```

### Option B: n8n Cloud

1. Go to [n8n.cloud](https://n8n.cloud)
2. Sign up / Log in
3. Create new instance
4. Note your instance URL

## 🔑 Step 6: Configure n8n Credentials

### 6.1 Gmail OAuth2

1. In n8n, go to "Credentials"
2. Click "Add Credential"
3. Search "Gmail OAuth2"
4. Enter:
   - Client ID: (from Google Cloud)
   - Client Secret: (from Google Cloud)
5. Click "Connect my account"
6. Authorize in popup
7. Save as "Gmail EventGaraget"

### 6.2 OpenAI

1. Add new credential
2. Search "OpenAI"
3. Enter API Key
4. Save as "OpenAI"

### 6.3 Supabase

1. Add new credential
2. Search "HTTP Header Auth"
3. Name: "Supabase EventGaraget"
4. Add headers:
   - Name: `apikey`, Value: (your Supabase anon key)
   - Name: `Authorization`, Value: `Bearer YOUR-SERVICE-KEY`

### 6.4 Google Sheets OAuth2

1. Add new credential
2. Search "Google Sheets OAuth2"
3. Use same Client ID/Secret as Gmail
4. Authorize
5. Save as "Google Sheets"

### 6.5 Slack (Optional)

1. Create Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Add Bot Token Scopes:
   - `chat:write`
   - `channels:read`
3. Install app to workspace
4. Copy Bot Token
5. In n8n, add Slack credential with token

## 📥 Step 7: Import Workflows

### 7.1 Import Main Workflow

1. In n8n, go to "Workflows"
2. Click "Add Workflow" → "Import from File"
3. Select `workflows/main-booking-agent.json`
4. Workflow opens in editor

### 7.2 Update Credential References

For each node with credentials:
1. Click on node
2. Select your credential from dropdown
3. Make sure it matches the names you created

### 7.3 Update Environment Variables

In nodes using `$env.VARIABLE`:
1. Either set in Docker `.env` file
2. Or replace with hardcoded values in nodes

### 7.4 Import CRM Workflow

1. Click "Add Workflow" → "Import from File"
2. Select `workflows/crm-analytics-workflow.json`
3. Update credentials
4. Save

### 7.5 Activate Workflows

1. Toggle "Active" switch in top right
2. Verify status turns green
3. Do this for both workflows

## ✅ Step 8: Test the System

### 8.1 Test Email Trigger

1. Send test email to your Gmail account
2. Subject: "Behöver partytält för fest"
3. Body: "Hej! Jag behöver hyra ett partytält 6x12m för 15 juni. Hur mycket kostar det? MVH Anders"

### 8.2 Monitor Execution

1. In n8n, go to "Executions"
2. Watch workflow run in real-time
3. Check each node's output
4. Verify email response received

### 8.3 Verify Database

1. Go to Supabase → Table Editor
2. Check `customers` table - should have new entry
3. Check `conversations` - should be logged
4. Check `bookings` - should be created

### 8.4 Test Other Scenarios

Send emails for:
- Support question: "Hur lång leveranstid?"
- Complex request: (should trigger Slack alert)
- Quote request: Multiple products

## 🔍 Step 9: Monitoring Setup

### 9.1 Enable Error Notifications

1. n8n Settings → Error workflow
2. Create simple workflow:
   - Trigger: Error
   - Action: Send email/Slack to you

### 9.2 Schedule Weekly Review

- Check analytics email every Monday
- Review Slack alerts
- Update FAQ based on questions

## 🎨 Step 10: Customization

### 10.1 Update AI Prompts

In AI nodes, customize system prompts:
- Add company personality
- Adjust tone (formal/casual)
- Include specific rules

### 10.2 Adjust Email Templates

In "Format Email" nodes:
- Update HTML styling
- Add company logo
- Change colors/fonts

### 10.3 Configure Schedules

In Schedule nodes:
- Change analytics day/time
- Adjust follow-up frequency

## 📊 Step 11: Go Live!

### 11.1 Final Checks

- [ ] All workflows active
- [ ] Test emails working
- [ ] Database logging correctly
- [ ] Credentials secure
- [ ] Error notifications setup

### 11.2 Announce to Team

- Share n8n URL with team
- Provide credentials (secure method)
- Train on Slack alerts
- Set up weekly report recipients

### 11.3 Monitor First Week

- Check executions daily
- Review AI responses
- Adjust prompts if needed
- Update FAQ

## 🆘 Common Issues

### "Gmail trigger not working"
- Check OAuth is authorized
- Verify Gmail API enabled
- Check label filter

### "OpenAI timeout"
- Increase timeout in node settings
- Check API key has credits
- Try lower temperature

### "Supabase error"
- Verify RLS policies
- Check service key (not anon key)
- Ensure functions exist

### "No email sent"
- Check Gmail send limits
- Verify FROM address
- Check spam folder

## 🎉 Success!

Your AI Booking Agent is now live! 

Monitor the first few days closely and adjust as needed.

## 📞 Need Help?

- Review execution logs in n8n
- Check Supabase logs
- Review this guide
- Contact development team

---

**Estimated Setup Time**: 2-3 hours

**Recommended**: Do this during low-traffic hours and test thoroughly before full launch.

