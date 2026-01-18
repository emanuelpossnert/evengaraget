import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, role, password } = await request.json();

    // Validate input
    if (!email || !full_name || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: authError.message || "Kunde inte skapa användare i Auth" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Unexpected error: No user returned" },
        { status: 500 }
      );
    }

    // 2. Create user_profile record
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert([
        {
          id: authData.user.id,
          email,
          full_name,
          role,
        },
      ]);

    if (profileError) {
      console.error("Profile error:", profileError);
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: profileError.message || "Kunde inte skapa användarprofil" },
        { status: 400 }
      );
    }

    // 3. Store password in user_credentials (for admin to view)
    const { error: credError } = await supabaseAdmin
      .from("user_credentials")
      .insert([
        {
          user_id: authData.user.id,
          password,
        },
      ]);

    if (credError) {
      console.error("Credential error:", credError);
      // Don't fail here, just log it
    }

    return NextResponse.json(
      {
        success: true,
        message: "Användare skapad! Kopiera lösenordet och dela med personen.",
        user: {
          id: authData.user.id,
          email,
          full_name,
          role,
          password, // Return password for admin to share
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Ett oväntat fel inträffade" },
      { status: 500 }
    );
  }
}
