# Create N8N Workflows via API (Bypass Import Issues)

## Problem
N8N import keeps failing with "Could not find property option" error. This is due to version incompatibility between your N8N version and the JSON structure.

## Solution
**Create workflows directly via N8N API** instead of importing JSON files.

---

## Step 1: Get Your N8N API Key

1. Go to N8N Settings
2. Find "API Keys" or "Tokens"
3. Create new API key
4. Copy the key
5. Note your N8N URL: `https://your-n8n-instance.com`

---

## Step 2: Create Polling Workflow via API

Run this command in your terminal:

```bash
# Set variables
N8N_URL="https://your-n8n-instance.com"
N8N_API_KEY="your-api-key-here"

# Create the workflow
curl -X POST "$N8N_URL/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Poller",
    "active": false,
    "nodes": [
      {
        "id": "1",
        "name": "Schedule",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.1,
        "position": [0, 0],
        "parameters": {
          "rule": {
            "interval": [{"intervalValue": 30, "triggerUnit": "seconds"}]
          }
        }
      }
    ],
    "connections": {}
  }'
```

---

## Step 3: Alternative - Use N8N UI Directly

**Instead of importing, build manually in N8N UI:**

1. **New Workflow** → Name: "Webhook Poller"
2. **Add Node: Schedule Trigger**
   - Interval: 30 seconds
3. **Add Node: Supabase**
   - Operation: getAll
   - Table: webhook_logs
4. **Add Node: Code**
   - Filter success = false
5. **Add Node: Loop**
6. **Add Node: IF (Is booking?)**
7. **Add Node: HTTP Request** (to webhook URL)
8. **Connect nodes**
9. **Deploy**

This way, you avoid all JSON import issues!

---

## Step 4: Quick Setup (Recommended)

Since imports are failing, I recommend:

1. **Don't use JSON imports at all**
2. **Create 3 simple workflows manually** (takes 15 min):
   - Polling: Schedule → Supabase → Loop → IF → HTTP
   - Booking: Webhook → Supabase → Gmail
   - Email: Webhook → Supabase → Gmail

3. **You already have working examples** in your workflows folder - just copy the structure!

---

## Step 5: Copy from Working Workflow

You have `02-quotation-generation.json` which works!

Instead of trying to import my JSON:

1. **Open N8N UI**
2. **Go to: Workflows → 02-quotation-generation**
3. **Click: Duplicate**
4. **Name it: "Webhook Poller"**
5. **Edit nodes:**
   - Replace Webhook with Schedule Trigger
   - Replace Supabase nodes with new ones
   - Keep the IF and HTTP nodes structure
6. **Test and Deploy**

This avoids the JSON import completely!

---

## My Recommendation

**STOP trying to import JSON files.** Instead:

### **Option A: Manual Creation (Best)**
- Create workflows directly in N8N UI
- Takes ~20 minutes
- No import errors
- You understand the structure

### **Option B: Duplicate Existing**
- Duplicate your working `02-quotation-generation.json`
- Modify the nodes
- Much safer than importing

### **Option C: Get N8N Version Info**
Send me:
```bash
# In N8N terminal or settings, find:
- N8N Version (e.g., 1.0.0, 1.48.0, etc)
- Node Package Version
```

Then I can create JSON that matches YOUR exact version!

---

## What NOT To Do

❌ Keep trying the same JSON import - it won't work  
❌ Download workflows from internet - versions might differ  
❌ Try to "fix" the JSON - N8N format is very strict  

---

## What TO Do

✅ **Build manually in N8N UI** (most reliable)  
✅ **Duplicate working workflows** (safest)  
✅ **Use N8N documentation** (official source)  

---

## Next Steps

**Pick one:**

1. **Build Manually** - I'll give you step-by-step instructions
2. **Duplicate Workflow** - I'll tell you which nodes to change
3. **Send N8N Version** - I'll create compatible JSON

**Which would you prefer?** 🚀

