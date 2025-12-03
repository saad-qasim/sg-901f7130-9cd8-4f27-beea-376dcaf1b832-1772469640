import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// نستخدم نفس المتغيرات الموجودة عندك في Environment
const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient < Database > (supabaseUrl, serviceRoleKey);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "DELETE") {
        return res
            .status(405)
            .json({ success: false, error: "Method not allowed" });
    }

    const { userId } = req.body as { userId?: string };

    if (!userId) {
        return res
            .status(400)
            .json({ success: false, error: "Missing userId in request body" });
    }

    try {
        // حذف صف الـ profile
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            return res
                .status(500)
                .json({ success: false, error: profileError.message });
        }

        // حذف المستخدم من Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
            userId
        );

        if (authError) {
            return res
                .status(500)
                .json({ success: false, error: authError.message });
        }

        // نجاح ✅
        return res.status(200).json({ success: true });
    } catch (error: any) {
        return res
            .status(500)
            .json({ success: false, error: error.message ?? "Unexpected error" });
    }
}