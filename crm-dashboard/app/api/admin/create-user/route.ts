import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, role, password } = await request.json();

    // Validate input
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: "Email, namn och roll är obligatoriska" },
        { status: 400 }
      );
    }

    // Validate role - only allow certain roles
    const validRoles = ["admin", "manager", "warehouse", "printer", "support"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Ogiltig roll: ${role}. Giltiga roller: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Create auth user with the provided password (or generate one)
    const finalPassword = password || Math.random().toString(36).slice(-12);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true, // Auto-confirm the email
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: `Kunde inte skapa användare: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Användaren skapades inte korrekt" },
        { status: 400 }
      );
    }

    // Insert user profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
      });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Try to delete the auth user since profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Kunde inte skapa användarprofil: ${profileError.message}` },
        { status: 400 }
      );
    }

    // Return success with the password (so admin can see it)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name,
          role,
          password: finalPassword, // Return password to admin
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    const errorMsg = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: `Server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
