// src/pages/api/admin/delete-user.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const supabaseUrl =
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({
            success: false,
            error: "Missing Supabase environment variables",
        });
    }

    const supabaseAdmin = createClient < Database > (supabaseUrl, serviceRoleKey);

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
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            return res
                .status(500)
                .json({ success: false, error: profileError.message });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
            userId
        );

        if (authError) {
            return res
                .status(500)
                .json({ success: false, error: authError.message });
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message ?? "Unexpected error",
        });
    }
}