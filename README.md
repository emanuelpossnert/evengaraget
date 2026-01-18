# EventGaraget - AI Booking Agent

An intelligent n8n-powered booking automation system for EventGaraget using AI agents to handle customer inquiries, bookings, and CRM.

## 🎯 Features

- **AI-Powered Email Classification**: Automatically categorizes incoming emails (bookings, quotes, support)
- **Automated Quote Generation**: Creates detailed quotes based on price lists
- **Customer Relationship Management**: Tracks customer interactions and sentiment
- **Churn Risk Detection**: Identifies at-risk customers and triggers retention campaigns
- **Human Takeover**: Escalates complex cases to human agents via Slack
- **Weekly Analytics**: Automated reporting on business metrics
- **Follow-up Automation**: Scheduled customer touchpoints

## 🏗️ Architecture

```
Gmail Trigger
    ↓
🤖 AI Agent (Classifier)
    ↓
Router (by classification)
    ├─→ Booking Request → Quote Generator → Email
    ├─→ Support Question → FAQ Lookup → Email
    ├─→ Complex Case → Slack Alert
    └─→ Other → Log & Archive
```

## 📋 Prerequisites

- n8n instance (cloud or self-hosted)
- Supabase account
- OpenAI API key
- Google Workspace account (Gmail + Sheets)
- Slack workspace (optional)

## 🚀 Quick Start

### 1. Clone and Setup Environment

```bash
cd /Users/emanuelpossnert/Documents/Dev\ projects/Eventgaraget
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start n8n (Docker)

```bash
docker-compose up -d
```

Access n8n at `http://localhost:5678`

### 3. Setup Supabase Database

```bash
# Run the schema in Supabase SQL Editor
cat supabase/schema.sql
# Copy and paste into Supabase SQL Editor and execute
```

### 4. Setup Google Sheets

Create two Google Sheets:

**FAQ Sheet** (columns: Kategori, Fråga, Svar, Nyckelord)
**PriceList Sheet** (columns: productName, pricePerDay, unit, category, minOrder)

Get the Sheet IDs from URLs and add to `.env`:
```
GOOGLE_SHEETS_FAQ_ID=your-faq-sheet-id
GOOGLE_SHEETS_PRICE_LIST_ID=your-price-list-sheet-id
```

### 5. Configure n8n Credentials

In n8n UI, add credentials:

1. **Gmail OAuth2** - Follow Google Cloud Console setup
2. **OpenAI API** - Add your API key
3. **Supabase** - Add URL and keys
4. **Google Sheets OAuth2** - Use same Google credentials
5. **Slack** (optional) - Add bot token

### 6. Import Workflows

1. Go to n8n UI → Workflows
2. Click "Import from File"
3. Import `workflows/main-booking-agent.json`
4. Import `workflows/crm-analytics-workflow.json`
5. Activate both workflows

## 📊 Workflows

### Main Booking Agent

**Trigger**: Gmail (every minute)
**Purpose**: Handle all incoming customer emails

**Flow**:
1. Email received → Extract data
2. AI classifies email type and sentiment
3. Route based on classification:
   - **Booking/Quote** → Generate quote → Create booking → Send email
   - **Support** → Lookup FAQ → Generate response → Send email
   - **Complex** → Alert team via Slack
4. Log all interactions to Supabase

### CRM Analytics

**Triggers**: 
- Weekly (Monday 08:00) - Analytics report
- Daily (09:00) - Follow-up processing

**Flow**:
1. Calculate weekly metrics
2. Generate AI report → Email to team
3. Calculate churn risk for all customers
4. Schedule retention emails for at-risk customers
5. Process pending follow-ups

## 🗄️ Database Schema

### Main Tables

- `customers` - Customer information
- `customer_profiles` - CRM metrics (churn risk, LTV, sentiment)
- `bookings` - All bookings with status tracking
- `booking_products` - Line items for bookings
- `conversations` - Email thread tracking
- `messages` - Individual messages with AI classification
- `interactions` - All customer touchpoints
- `follow_ups` - Scheduled customer communications

### RPC Functions

- `get_weekly_analytics()` - Returns weekly business metrics
- `calculate_churn_factors(customer_id)` - Computes churn risk factors

## 🤖 AI Agents

### 1. Email Classifier Agent
- **Model**: GPT-4 Turbo
- **Purpose**: Analyze and categorize incoming emails
- **Output**: Classification, sentiment, extracted data, missing info

### 2. Quote Generator Agent
- **Model**: GPT-4 Turbo
- **Purpose**: Create detailed quotes from customer requests
- **Input**: Customer info, price list, request details
- **Output**: Itemized quote with totals

### 3. Support Response Agent
- **Model**: GPT-4 Turbo
- **Purpose**: Answer customer questions using FAQ database
- **Input**: Customer question, FAQ data
- **Output**: Helpful, contextual response

### 4. Report Generator Agent
- **Model**: GPT-4 Turbo
- **Purpose**: Create weekly business reports
- **Input**: Analytics data
- **Output**: HTML formatted report with insights

### 5. Follow-up Generator Agent
- **Model**: GPT-4 Turbo
- **Purpose**: Create personalized follow-up emails
- **Input**: Customer data, follow-up type
- **Output**: Personalized email content

## 🔐 Security

- All credentials stored in n8n encrypted credential store
- Supabase RLS (Row Level Security) enabled
- API keys in environment variables
- HTTPS for all external communications

## 📈 Monitoring

### Key Metrics Tracked

- Total conversations
- Resolution rate
- Average response time
- Sentiment scores
- Bookings created
- Revenue generated
- Automation rate
- Human takeover rate
- Customer churn risk

### Access Dashboards

- **n8n Executions**: Check workflow runs and errors
- **Supabase Dashboard**: View database records
- **Weekly Email Reports**: Business metrics summary

## 🛠️ Troubleshooting

### Gmail not triggering
- Verify OAuth2 credentials are active
- Check Gmail API is enabled in Google Cloud
- Ensure correct label is monitored

### AI responses are poor
- Adjust temperature in OpenAI node
- Update system prompts for better context
- Increase max tokens if responses cut off

### Supabase connection fails
- Verify URL and keys in .env
- Check RLS policies allow access
- Ensure functions are created

### Workflows not running
- Check workflow is "Active"
- Verify triggers are configured correctly
- Review execution logs for errors

## 📝 Maintenance

### Daily
- Monitor execution logs
- Check Slack alerts for human takeovers

### Weekly
- Review AI response quality
- Update FAQ sheet with new questions
- Check analytics report

### Monthly
- Update n8n version
- Review and optimize slow workflows
- Backup workflows (export JSON)
- Update price lists

## 🎓 Best Practices

1. **Test in staging first** - Use test Gmail account
2. **Monitor AI costs** - Track OpenAI token usage
3. **Keep FAQs updated** - Add new common questions
4. **Review human takeovers** - Improve AI from escalations
5. **Backup regularly** - Export workflows weekly

## 📞 Support

For issues or questions:
- Check workflow execution logs in n8n
- Review Supabase logs
- Contact team via Slack

## 📄 License

Internal use - EventGaraget

## 🔄 Version History

- **v1.0** (2024-01-15) - Initial implementation
  - Main booking agent workflow
  - CRM analytics workflow
  - Supabase integration
  - AI classification and response generation

