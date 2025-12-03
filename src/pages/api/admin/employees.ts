
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type ResponseData = {
  success: boolean;
  employees?: any[];
  userId?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    // الحصول على متغيرات البيئة
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase configuration",
      });
    }

    // إنشاء عميل Supabase مع service_role
    const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey);

    // معالجة الطرق المختلفة
    switch (req.method) {
      case "GET":
        return await handleGet(supabaseAdmin, res);
      
      case "POST":
        return await handlePost(supabaseAdmin, req, res);
      
      case "PATCH":
        return await handlePatch(supabaseAdmin, req, res);
      
      case "DELETE":
        return await handleDelete(supabaseAdmin, req, res);
      
      default:
        return res.status(405).json({
          success: false,
          error: "Method not allowed",
        });
    }
  } catch (e: any) {
    console.error("Handler error:", e);
    return res.status(500).json({
      success: false,
      error: e.message || "Internal server error",
    });
  }
}

// GET: جلب جميع الموظفين
async function handleGet(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      employees: profiles || [],
    });
  } catch (e: any) {
    console.error("GET error:", e);
    return res.status(500).json({
      success: false,
      error: e.message || "Failed to fetch employees",
    });
  }
}

// POST: إنشاء موظف جديد
async function handlePost(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { email, password, profile } = req.body;

    // التحقق من البيانات المطلوبة
    if (!email || !password || !profile) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, password, or profile",
      });
    }

    // التحقق من حقول الملف الشخصي
    if (!profile.name || !profile.phone || !profile.role) {
      return res.status(400).json({
        success: false,
        error: "Missing required profile fields: name, phone, or role",
      });
    }

    // 1. إنشاء المستخدم في Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // تأكيد البريد الإلكتروني تلقائياً
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Failed to create user in Auth");
    }

    // 2. إنشاء صف في جدول profiles
    const profileData = {
      id: authData.user.id,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      can_create_invoices: profile.can_create_invoices ?? false,
      can_delete_invoices: profile.can_delete_invoices ?? false,
      can_edit_invoices: profile.can_edit_invoices ?? false,
      can_add_brand: profile.can_add_brand ?? false,
      can_add_product: profile.can_add_product ?? false,
      can_view_stats: profile.can_view_stats ?? false,
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([profileData]);

    if (profileError) {
      // إذا فشل إنشاء الملف الشخصي، احذف المستخدم من Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Profile error: ${profileError.message}`);
    }

    return res.status(201).json({
      success: true,
      userId: authData.user.id,
    });
  } catch (e: any) {
    console.error("POST error:", e);
    return res.status(500).json({
      success: false,
      error: e.message || "Failed to create employee",
    });
  }
}

// PATCH: تحديث بيانات موظف
async function handlePatch(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { userId, updates } = req.body;

    // التحقق من البيانات المطلوبة
    if (!userId || !updates) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId or updates",
      });
    }

    // تحديث الملف الشخصي
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
    });
  } catch (e: any) {
    console.error("PATCH error:", e);
    return res.status(500).json({
      success: false,
      error: e.message || "Failed to update employee",
    });
  }
}

// DELETE: حذف موظف
async function handleDelete(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { userId } = req.body;

    // التحقق من البيانات المطلوبة
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: userId",
      });
    }

    // 1. حذف الملف الشخصي من profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      throw new Error(`Profile deletion error: ${profileError.message}`);
    }

    // 2. حذف المستخدم من Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      // تحذير: الملف الشخصي تم حذفه لكن المستخدم في Auth لم يُحذف
      console.warn(`Auth deletion error for user ${userId}:`, authError);
      // لا نرمي خطأ هنا لأن الملف الشخصي تم حذفه بالفعل
    }

    return res.status(200).json({
      success: true,
    });
  } catch (e: any) {
    console.error("DELETE error:", e);
    return res.status(500).json({
      success: false,
      error: e.message || "Failed to delete employee",
    });
  }
}
