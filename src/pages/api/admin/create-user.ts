import type { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "@/lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, name, phone, role } = req.body;

  // Validate input
  if (!email || !password || !name) {
    return res.status(400).json({ 
      error: "البريد الإلكتروني وكلمة المرور والاسم مطلوبة" 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      error: "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل" 
    });
  }

  try {
    // Log environment variables (without exposing the full keys)
    console.log("Environment check:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20),
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)
    });

    // Create admin Supabase client with service role key
    const adminClient = createAdminClient();
    
    console.log("Admin client created successfully");

    // Create user in Supabase Auth using the admin client
    console.log("Attempting to create user with email:", email);
    
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        phone: phone || null,
        role: role || "admin",
      },
    });

    if (authError) {
      console.error("Auth error details:", {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      return res.status(400).json({ 
        error: authError.message || "فشل إنشاء المستخدم في نظام المصادقة",
        details: authError
      });
    }

    if (!authData.user) {
      return res.status(400).json({ 
        error: "لم يتم إنشاء المستخدم" 
      });
    }

    console.log("User created in auth, ID:", authData.user.id);

    // Create profile in profiles table using admin client
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        name,
        role: role || "admin",
        phone: phone || null,
      });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Try to clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ 
        error: "فشل إنشاء ملف المستخدم: " + profileError.message 
      });
    }

    console.log("Profile created successfully");

    return res.status(200).json({
      success: true,
      message: "تم إنشاء المستخدم بنجاح",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: role || "admin",
      },
    });
  } catch (error: any) {
    console.error("Server error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      error: error.message || "حدث خطأ في الخادم",
      details: error.toString()
    });
  }
}