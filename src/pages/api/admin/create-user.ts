import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

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
    // Create user in Supabase Auth using the admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
      console.error("Auth error:", authError);
      return res.status(400).json({ 
        error: authError.message || "فشل إنشاء المستخدم في نظام المصادقة" 
      });
    }

    if (!authData.user) {
      return res.status(400).json({ 
        error: "لم يتم إنشاء المستخدم" 
      });
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase
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
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ 
        error: "فشل إنشاء ملف المستخدم: " + profileError.message 
      });
    }

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
    console.error("Server error:", error);
    return res.status(500).json({ 
      error: error.message || "حدث خطأ في الخادم" 
    });
  }
}