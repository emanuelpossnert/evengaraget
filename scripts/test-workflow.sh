#!/bin/bash

# EventGaraget Workflow Testing Script
# Usage: ./scripts/test-workflow.sh [email-type]
# Types: booking, support, quote, complex

set -e

EMAIL_TYPE=${1:-booking}
TEST_EMAIL=${2:-test@eventgaraget.se}

echo "🧪 Testing EventGaraget Workflow"
echo "================================="
echo "Test Type: $EMAIL_TYPE"
echo "Test Email: $TEST_EMAIL"
echo ""

# Generate test email content based on type
case $EMAIL_TYPE in
    booking)
        SUBJECT="Behöver hyra partytält för fest"
        BODY="Hej!\n\nJag behöver hyra ett partytält 6x12m för den 15 juni.\nVi är ca 50 gäster och behöver även bord och stolar.\n\nKan ni även montera tältet?\n\nMed vänlig hälsning,\nAnders Andersson\n070-123 45 67\nandeers@example.com"
        ;;
    support)
        SUBJECT="Fråga om leveranstid"
        BODY="Hej!\n\nHur lång är leveranstiden för uthyrning till Stockholm?\nKan man få leverans på helger?\n\nTack!\nMaria Svensson"
        ;;
    quote)
        SUBJECT="Offertförfrågan för företagsevent"
        BODY="Hej!\n\nVi planerar ett företagsevent 20 augusti med 80 personer.\nBehöver:\n- Partytält\n- Bord och stolar för alla\n- Belysning\n- Värmefläktar (om det blir kallt)\n\nKan ni skicka en offert?\n\nFöretaget AB\nKontakt: Johan Berg\njohan@foretaget.se"
        ;;
    complex)
        SUBJECT="BRÅDSKANDE - Problem med bokning"
        BODY="Hej!\n\nVi har ett stort problem! Vårt tält som skulle levereras imorgon verkar inte vara bekräftat.\nVi har 150 gäster som kommer och detta är KRITISKT.\n\nRING MIG OMEDELBART!\n070-999 88 77\n\nMVH\nStressad Kund"
        ;;
    *)
        echo "❌ Unknown test type: $EMAIL_TYPE"
        echo "Available types: booking, support, quote, complex"
        exit 1
        ;;
esac

echo "📧 Test Email Content:"
echo "Subject: $SUBJECT"
echo "Body:"
echo -e "$BODY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Instructions for manual testing
echo "📋 Manual Testing Steps:"
echo ""
echo "1. Send email to: $TEST_EMAIL"
echo "   Subject: $SUBJECT"
echo "   Body: (see above)"
echo ""
echo "2. Monitor n8n execution:"
echo "   - Open http://localhost:5678"
echo "   - Go to 'Executions'"
echo "   - Watch for new execution"
echo ""
echo "3. Check results:"
echo "   ✅ Email classified correctly"
echo "   ✅ Customer created in Supabase"
echo "   ✅ Conversation logged"
echo "   ✅ Response email sent"
echo ""
echo "4. Verify in Supabase:"
echo "   - Check 'customers' table"
echo "   - Check 'conversations' table"
echo "   - Check 'messages' table"

if [ "$EMAIL_TYPE" = "booking" ] || [ "$EMAIL_TYPE" = "quote" ]; then
    echo "   - Check 'bookings' table"
    echo "   - Check 'booking_products' table"
fi

if [ "$EMAIL_TYPE" = "complex" ]; then
    echo ""
    echo "5. Check Slack for alert (if configured)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Pro Tips:"
echo "   - Use Gmail filters to organize test emails"
echo "   - Check spam folder if response not received"
echo "   - Review AI prompts if classification is wrong"
echo "   - Monitor OpenAI token usage in dashboard"
echo ""
echo "🔍 Troubleshooting:"
echo "   - Logs: docker-compose logs -f n8n"
echo "   - Executions: http://localhost:5678/executions"
echo "   - Supabase: Check table editor for data"
echo ""

