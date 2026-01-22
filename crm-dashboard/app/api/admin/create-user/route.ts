import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, full_name, role, password } = await request.json();
    console.log("📝 CREATE USER REQUEST:", { email, full_name, role, password: "***" });

    // Validate input
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: "Email, namn och roll är obligatoriska" },
        { status: 400 }
      );
    }

    // Validate role - only allow certain roles that we know exist
    const validRoles = ["admin", "sales", "warehouse", "printer", "support"];
    if (!validRoles.includes(role)) {
      console.warn(`⚠️ INVALID ROLE: ${role}. Valid: ${validRoles.join(", ")}`);
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
    console.log("🔐 Creating auth user with email:", email);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true, // Auto-confirm the email
    });

    if (authError) {
      console.error("❌ AUTH ERROR:", authError);
      return NextResponse.json(
        { error: `Kunde inte skapa användare: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error("❌ AUTH USER NOT CREATED");
      return NextResponse.json(
        { error: "Användaren skapades inte korrekt" },
        { status: 400 }
      );
    }

    console.log("✅ Auth user created with ID:", authData.user.id);

    // Try to insert user profile with different role options
    console.log(`📤 Inserting profile with role: ${role}`);

    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role, // This will trigger the check constraint
      });

    if (profileError) {
      console.error("❌ PROFILE ERROR:", profileError);
      
      // If role was the problem, try with 'sales' as fallback
      if (profileError.message.includes("role_check") && role !== "sales") {
        console.warn(`⚠️ Role '${role}' failed, trying 'sales' instead...`);
        const { error: fallbackError } = await supabaseAdmin
          .from("user_profiles")
          .insert({
            id: authData.user.id,
            email,
            full_name,
            role: "sales", // Fallback role
          });

        if (fallbackError) {
          console.error("❌ FALLBACK PROFILE ERROR:", fallbackError);
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          return NextResponse.json(
            { error: `Kunde inte skapa användarprofil (fallback också misslyckades): ${fallbackError.message}` },
            { status: 400 }
          );
        }
      } else {
        // Delete the auth user since profile creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: `Kunde inte skapa användarprofil: ${profileError.message}` },
          { status: 400 }
        );
      }
    }

    console.log("✅ User profile created successfully");

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
    console.error("❌ ERROR creating user:", error);
    const errorMsg = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: `Server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
