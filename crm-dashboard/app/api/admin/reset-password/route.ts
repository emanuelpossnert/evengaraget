import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "userId och nytt lösenord är obligatoriska" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Lösenordet måste vara minst 6 tecken" },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Update user password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error("Password reset error:", error);
      return NextResponse.json(
        { error: `Kunde inte reseta lösenord: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Lösenord har resetats",
        password: newPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    const errorMsg = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: `Server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
