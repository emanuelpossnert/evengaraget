/**
 * ============================================
 * N8N WEBHOOK INTEGRATION - CRM SETUP
 * ============================================
 * 
 * Denna fil visar exakt hur du integrerar
 * N8N webhooks i CRM kundkortet & bokningarna
 */

// ============================================
// 1. BOOKING CONFIRMATION (Auto-triggered via Supabase)
// ============================================

// Lägg till i: crm-dashboard/app/dashboard/bookings/[id]/page.tsx

export const handleApproveBooking = async (
  bookingId: string,
  setActionLoading: (loading: boolean) => void,
  setMessage: (message: { type: "success" | "error"; text: string }) => void
) => {
  try {
    setActionLoading(true);

    // 1. Update booking status
    const { error: statusError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (statusError) throw statusError;

    // 2. Generate token
    const token = `${Math.random().toString(36).substring(2)}-${Date.now()}`;

    // 3. Create booking token
    const { error: tokenError } = await supabase
      .from("booking_tokens")
      .insert([{
        booking_id: bookingId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }]);

    if (tokenError) console.error("Token error:", tokenError);

    // 4. Insert booking_confirmations
    // ⚠️ THIS TRIGGERS SUPABASE WEBHOOK AUTOMATICALLY!
    // ⚠️ SUPABASE WEBHOOK CALLS N8N WEBHOOK URL!
    const { error: confirmError } = await supabase
      .from("booking_confirmations")
      .insert([{
        booking_id: bookingId,
        token,
        email_sent: false,
        status: "pending"
      }]);

    if (confirmError) console.error("Confirmation error:", confirmError);
    // Note: If webhook fails, confirmation record still created
    // - You'll see error in webhook_logs table
    // - Admin can manually resend from UI

    setMessage({
      type: "success",
      text: "Bokning bekräftad! 📧 Email är på väg..."
    });

  } catch (error) {
    console.error("Error:", error);
    setMessage({
      type: "error",
      text: `Kunde inte bekräfta bokning: ${error.message}`
    });
  } finally {
    setActionLoading(false);
  }
};

// ============================================
// 2. CUSTOMER EMAIL (Manual from customer card)
// ============================================

// Lägg till i: crm-dashboard/app/dashboard/customers/[id]/page.tsx
// Eller där du har mail-funktionen

export const handleSendCustomerEmail = async (
  customerId: string,
  customerEmail: string,
  subject: string,
  message: string,
  setLoading: (loading: boolean) => void,
  setMessage: (message: { type: "success" | "error"; text: string }) => void
) => {
  try {
    setLoading(true);

    // Get N8N webhook URL from environment
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_EMAIL_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error("N8N webhook URL not configured");
    }

    // Call N8N webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: customerId,
        customer_email: customerEmail,
        subject,
        message,
        sent_by: "CRM",
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "N8N webhook failed");
    }

    setMessage({
      type: "success",
      text: `Email skickad till ${customerEmail}! ✅`
    });

    // Clear form
    // setSubject("");
    // setMessage("");

  } catch (error) {
    console.error("Error sending email:", error);
    setMessage({
      type: "error",
      text: `Kunde inte skicka email: ${error.message}`
    });
  } finally {
    setLoading(false);
  }
};

// ============================================
// 3. ENVIRONMENT VARIABLES
// ============================================

// Lägg till i: .env.local

/*
# N8N Webhook URLs
NEXT_PUBLIC_N8N_EMAIL_WEBHOOK_URL=https://your-n8n-instance.com/webhook/send-customer-email
NEXT_PUBLIC_N8N_BOOKING_WEBHOOK_URL=https://your-n8n-instance.com/webhook/booking-confirmation
*/

// ============================================
// 4. SUPABASE WEBHOOK CONFIGURATION
// ============================================

/*
SETUP I SUPABASE CONSOLE:

1. Settings → Webhooks
2. Click "Create webhook"
3. Table: booking_confirmations
4. Event: INSERT
5. HTTP method: POST
6. URL: https://your-n8n-instance.com/webhook/booking-confirmation

Supabase kommer automatiskt att POST till N8N URL när en ny 
booking_confirmations rad skapas!

PAYLOAD som Supabase skickar:
{
  "type": "INSERT",
  "table": "booking_confirmations",
  "record": {
    "id": "...",
    "booking_id": "...",
    "token": "...",
    "email_sent": false,
    "status": "pending",
    "created_at": "..."
  }
}
*/

// ============================================
// 5. N8N WORKFLOW CONFIGURATION
// ============================================

/*
WORKFLOW 1: Booking Confirmation (Auto-triggered)
─────────────────────────────────────────────────

Nodes:
1. Webhook
   - Method: POST
   - Listen to path: booking-confirmation

2. Extract Booking ID
   - Get: $json.record.booking_id
   - Get: $json.record.token

3. Get Booking Details
   - SQL Query:
     SELECT b.*, c.email, c.phone
     FROM bookings b
     LEFT JOIN customers c ON b.customer_id = c.id
     WHERE b.id = $1

4. Format Email
   - Build HTML email with:
     • Booking details
     • Booking link (with token)
     • EventGaraget branding

5. Send Email
   - To: customer.email
   - Use your email service (Gmail/SendGrid)

6. Log Webhook
   - INSERT INTO webhook_logs (...)
     event_type: 'booking_confirmation_sent'
     booking_id: booking.id
     payload: email
     status: 'success' / 'error'


WORKFLOW 2: Customer Email (Manual-triggered)
──────────────────────────────────────────────

Nodes:
1. Webhook
   - Method: POST
   - Listen to path: send-customer-email

2. Get Customer Info
   - SQL Query:
     SELECT email, name FROM customers WHERE id = $1

3. Format Email
   - Subject: $json.subject
   - Body: $json.message

4. Send Email
   - To: customer.email
   - Subject, body from webhook data

5. Log Email
   - INSERT INTO email_logs (...)
     customer_id: $json.customer_id
     subject: $json.subject
     status: 'sent' / 'failed'

6. Return Response
   - Return: { success: true, message: "Email sent" }
*/

// ============================================
// 6. ERROR HANDLING & LOGGING
// ============================================

// I N8N, lägg till error handling:

const handleN8NError = async (error, bookingId, webhookType) => {
  // Log error to webhook_logs table
  await supabase
    .from("webhook_logs")
    .insert([{
      event_type: webhookType,
      booking_id: bookingId,
      status: "error",
      error_message: error.message,
      payload: error.details
    }]);

  // Optionally notify admin
  // await sendAdminNotification({
  //   type: "webhook_error",
  //   message: error.message,
  //   booking_id: bookingId
  // });
};

// ============================================
// 7. TESTING WITH POSTMAN
// ============================================

/*
TEST BOOKING CONFIRMATION WEBHOOK:

POST https://your-n8n-instance.com/webhook/booking-confirmation

Headers:
{
  "Content-Type": "application/json"
}

Body:
{
  "type": "INSERT",
  "table": "booking_confirmations",
  "record": {
    "booking_id": "test-booking-123",
    "token": "test-token-456",
    "email_sent": false,
    "status": "pending"
  }
}

Expected Response: 200 OK

---

TEST CUSTOMER EMAIL WEBHOOK:

POST https://your-n8n-instance.com/webhook/send-customer-email

Headers:
{
  "Content-Type": "application/json"
}

Body:
{
  "customer_id": "test-customer-789",
  "customer_email": "test@example.com",
  "subject": "Test Email",
  "message": "This is a test message"
}

Expected Response: 
{
  "success": true,
  "message": "Email sent"
}
*/

// ============================================
// 8. USAGE EXAMPLE IN CRM COMPONENT
// ============================================

/*
// In BookingCard.tsx

import { handleApproveBooking } from "@/lib/n8n-webhooks";

export default function BookingCard({ booking }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onApprove = async () => {
    await handleApproveBooking(
      booking.id,
      setActionLoading,
      setMessage
    );
  };

  return (
    <div>
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <button 
        onClick={onApprove}
        disabled={actionLoading}
      >
        {actionLoading ? "Bekräftar..." : "Bekräfta bokning"}
      </button>
    </div>
  );
}
*/

/*
// In CustomerCard.tsx

import { handleSendCustomerEmail } from "@/lib/n8n-webhooks";

export default function CustomerCard({ customer }) {
  const [emailLoading, setEmailLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const onSendEmail = async () => {
    await handleSendCustomerEmail(
      customer.id,
      customer.email,
      subject,
      emailBody,
      setEmailLoading,
      setMessage
    );
  };

  return (
    <div>
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <input
        placeholder="Ämne"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      
      <textarea
        placeholder="Meddelande"
        value={emailBody}
        onChange={(e) => setEmailBody(e.target.value)}
      />
      
      <button 
        onClick={onSendEmail}
        disabled={emailLoading}
      >
        {emailLoading ? "Skickar..." : "Skicka mail"}
      </button>
    </div>
  );
}
*/

// ============================================
// SUMMARY
// ============================================

/*
✅ BOOKING CONFIRMATION FLOW:
  1. Admin clicks "Bekräfta" in CRM
  2. CRM inserts booking_confirmations row
  3. Supabase detects INSERT
  4. Supabase calls N8N webhook
  5. N8N builds & sends email
  6. N8N logs event
  7. Customer gets email ✅

✅ CUSTOMER EMAIL FLOW:
  1. User types message in kundkort
  2. User clicks "Skicka mail"
  3. CRM makes HTTP POST to N8N
  4. N8N receives webhook
  5. N8N sends email
  6. N8N returns response
  7. Customer gets email ✅

✅ TWO DIFFERENT WEBHOOKS:
  - Booking confirmation: Supabase → N8N (auto)
  - Customer email: CRM → N8N (manual)
  - Independent & easy to debug
  - No conflicts or confusion

Happy webhooking! 🚀
*/

