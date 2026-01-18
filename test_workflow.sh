#!/bin/bash

echo "🔍 Checking workflow execution..."
echo ""
echo "1️⃣  First, let's verify the JSON is still valid:"
python3 -c "import json; json.load(open('workflows/01-email-classification.json')); print('✅ JSON valid')" 2>&1

echo ""
echo "2️⃣  Checking if Gmail trigger is configured:"
grep -A 5 "gmailTrigger1" workflows/01-email-classification.json | head -10

echo ""
echo "3️⃣  Checking AI Support Response node:"
grep -A 2 "\"modelId\"" workflows/01-email-classification.json | head -15

echo ""
echo "4️⃣  Checking connections to see if flow is complete:"
grep "\"main\"" workflows/01-email-classification.json | wc -l
echo "   (Should have many connections)"

