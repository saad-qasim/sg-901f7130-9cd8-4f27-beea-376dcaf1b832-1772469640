
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the service role key for admin operations
const getServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, userData } = req.body;

    if (!email || !password || !userData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supabaseAdmin = getServiceRoleClient();

    // Create user in auth.users using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    // Create corresponding profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        can_create_invoices: userData.can_create_invoices,
        can_delete_invoices: userData.can_delete_invoices,
        can_edit_invoices: userData.can_edit_invoices,
        can_add_brand: userData.can_add_brand,
        can_add_product: userData.can_add_product,
        can_view_stats: userData.can_view_stats,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // If profile creation fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    // Try to send password reset email
    try {
      await supabaseAdmin.auth.resetPasswordForEmail(email);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      // Don't fail the request if email sending fails
    }

    return res.status(200).json({
      success: true,
      userId: authData.user.id,
      temporaryPassword: password,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
