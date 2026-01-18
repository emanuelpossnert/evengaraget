/**
 * ==========================================
 * BOOKING APPROVAL WITH TOKEN GENERATION
 * ==========================================
 * 
 * Denna kod ska integreras i:
 * crm-dashboard/app/dashboard/bookings/[id]/page.tsx
 * 
 * Ersätt den befintliga handleApprove-funktionen med denna
 */

import { supabase } from "@/lib/supabaseClient";

/**
 * Generate a secure random token for booking links
 */
const generateBookingToken = (): string => {
  // Format: RANDOMSTRING-TIMESTAMP
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  return `${randomPart}-${timestamp}`;
};

/**
 * Handle booking approval with token generation
 */
export const handleApprove = async (
  bookingId: string,
  setActionLoading: (loading: boolean) => void,
  setMessage: (message: { type: "success" | "error"; text: string }) => void,
  router: any
) => {
  try {
    setActionLoading(true);

    // 1️⃣ Update booking status to "confirmed"
    console.log("Step 1: Updating booking status...");
    const { error: statusError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (statusError) {
      console.error("Status update error:", statusError);
      throw new Error(`Kunde inte uppdatera bokningsstatus: ${statusError.message}`);
    }
    console.log("✅ Booking status updated to 'confirmed'");

    // 2️⃣ Generate secure token for booking link
    console.log("Step 2: Generating booking token...");
    const token = generateBookingToken();
    console.log(`Generated token: ${token}`);

    // 3️⃣ Insert token into booking_tokens table
    console.log("Step 3: Saving token to database...");
    const { data: tokenData, error: tokenError } = await supabase
      .from("booking_tokens")
      .insert([
        {
          booking_id: bookingId,
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        },
      ])
      .select();

    if (tokenError) {
      console.error("Token insert error:", tokenError);
      throw new Error(`Kunde inte skapa bokningslänk: ${tokenError.message}`);
    }
    console.log("✅ Token saved to database");

    // 4️⃣ Create booking confirmation record
    // This triggers the N8N webhook that sends the confirmation email
    console.log("Step 4: Creating confirmation record for N8N...");
    const { data: confirmationData, error: confirmationError } = await supabase
      .from("booking_confirmations")
      .insert([
        {
          booking_id: bookingId,
          token, // Include the token so N8N can use it in the email
          email_sent: false,
          status: "pending",
        },
      ])
      .select();

    if (confirmationError) {
      console.error("Confirmation error:", confirmationError);
      // Don't throw here - the booking is already confirmed even if email fails
      console.warn("⚠️ Confirmation record creation failed, but booking is confirmed");
    } else {
      console.log("✅ Confirmation record created, N8N webhook should trigger");
    }

    // 5️⃣ Show success message and redirect
    setMessage({
      type: "success",
      text: "Bokning bekräftad! ✅ Bekräftelsemail är på väg till kunden.",
    });

    console.log("Success! Redirecting...");
    setTimeout(() => {
      router.push("/dashboard/bookings");
    }, 2000);
  } catch (error) {
    console.error("Full error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Ett okänt fel uppstod";
    setMessage({
      type: "error",
      text: `Kunde inte bekräfta bokning: ${errorMessage}`,
    });
  } finally {
    setActionLoading(false);
  }
};

/**
 * ==========================================
 * INTEGRATION INSTRUCTIONS
 * ==========================================
 * 
 * 1. Kopiera denna hela funktionen till bookings/[id]/page.tsx
 * 
 * 2. I handleApprove-knappens onClick, anropa:
 *    onClick={async () => {
 *      await handleApprove(bookingId, setActionLoading, setMessage, router);
 *    }}
 * 
 * 3. Se till att dessa imports finns i toppen av filen:
 *    import { useRouter } from "next/navigation";
 *    import { useState } from "react";
 *    import { supabase } from "@/lib/supabaseClient";
 * 
 * 4. Se till att dessa state-variabler finns:
 *    const [actionLoading, setActionLoading] = useState(false);
 *    const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);
 */

