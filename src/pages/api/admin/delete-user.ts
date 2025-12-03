import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// نقرأ متغيرات البيئة من السيرفر
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// لو ناقص أي واحد منهم نطلع نفس الرسالة اللي تظهر لك الآن
if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
}

// Supabase admin client باستخدام service_role
const supabaseAdmin = createClient < Database > (supabaseUrl, serviceRoleKey);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { userId } = req.body as { userId?: string };

    if (!userId) {
        return res
            .status(400)
            .json({ success: false, error: "Missing userId in request body" });
    }

    try {
        // نحذف من جدول profiles
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            console.error("Error deleting profile:", profileError);
            return res
                .status(500)
                .json({ success: false, error: "Failed to delete profile" });
        }

        // نحذف المستخدم من Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
            userId
        );

        if (authError) {
            console.error("Error deleting auth user:", authError);
            return res
                .status(500)
                .json({ success: false, error: "Failed to delete auth user" });
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("Unexpected error deleting user:", error);
        return res
            .status(500)
            .json({ success: false, error: "Unexpected error deleting user" });
    }
}