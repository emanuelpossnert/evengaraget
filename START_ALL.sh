#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 EventGaraget - Full System Startup${NC}"
echo -e "${BLUE}========================================${NC}"

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "\n${YELLOW}📍 Project Root: $PROJECT_ROOT${NC}"

# Function to start a service in a new terminal tab
start_service_in_tab() {
    local name=$1
    local command=$2
    
    echo -e "${YELLOW}📌 Starting: $name${NC}"
    
    # Use open command to create new terminal tab on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT' && $command\""
    else
        # For Linux, use gnome-terminal or similar
        gnome-terminal --tab -- bash -c "cd '$PROJECT_ROOT' && $command; exec bash"
    fi
    
    sleep 2
}

echo -e "\n${BLUE}Step 1: Starting n8n (port 5678)...${NC}"
start_service_in_tab "n8n" "docker-compose up n8n"

echo -e "\n${YELLOW}⏳ Waiting 15 seconds for n8n to start...${NC}"
sleep 15

echo -e "\n${BLUE}Step 2: Starting ngrok (tunnel for webhooks)...${NC}"
start_service_in_tab "ngrok" "ngrok http 5678"

echo -e "\n${YELLOW}⏳ Waiting 5 seconds for ngrok...${NC}"
sleep 5

echo -e "\n${BLUE}Step 3: Starting Signature App (port 3000)...${NC}"
start_service_in_tab "Signature App" "cd signature-app && npm run dev"

echo -e "\n${GREEN}✅ All services started!${NC}"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}📋 WHAT TO DO NOW:${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}1️⃣  n8n (First tab)${NC}"
echo -e "   URL: ${GREEN}http://localhost:5678${NC}"
echo -e "   → Import workflows from ${BLUE}workflows/{{NC}} folder"

echo -e "\n${YELLOW}2️⃣  ngrok (Second tab)${NC}"
echo -e "   Watch for: ${GREEN}Forwarding https://abc123.ngrok.io -> http://localhost:5678${NC}"
echo -e "   → Copy the URL and update Supabase webhook"

echo -e "\n${YELLOW}3️⃣  Signature App (Third tab)${NC}"
echo -e "   URL: ${GREEN}http://localhost:3000${NC}"
echo -e "   → Will automatically load quotation pages"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}🔗 SETUP CHECKLIST:${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}[ ] Import 01-email-classification-FINAL.json in n8n${NC}"
echo -e "${YELLOW}[ ] Import 02-quotation-generation.json in n8n${NC}"
echo -e "${YELLOW}[ ] Copy ngrok URL${NC}"
echo -e "${YELLOW}[ ] Update Supabase webhook with ngrok URL${NC}"
echo -e "${YELLOW}[ ] Test by creating a booking${NC}"

echo -e "\n${BLUE}📖 Read these guides:${NC}"
echo -e "   • ${GREEN}QUICK_N8N_SETUP.md${NC} - 5 minute setup"
echo -e "   • ${GREEN}N8N_SETUP_GUIDE.md${NC} - Detailed guide"
echo -e "   • ${GREEN}PHASE_3_SUMMARY.md${NC} - Full overview"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 System is starting!${NC}"
echo -e "${BLUE}========================================\n${NC}"
