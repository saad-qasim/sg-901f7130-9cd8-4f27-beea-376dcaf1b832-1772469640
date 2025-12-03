// src/pages/api/admin/create-user.ts
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

    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ success: false, error: "Method not allowed" });
    }

    const { email, password, userData } = req.body as {
        email?: string;
        password?: string;
        userData?: {
            name: string;
            phone: string;
            role: string;
            can_create_invoices: boolean;
            can_delete_invoices: boolean;
            can_edit_invoices: boolean;
            can_add_brand: boolean;
            can_add_product: boolean;
            can_view_stats: boolean;
        };
    };

    if (!email || !password || !userData) {
        return res
            .status(400)
            .json({ success: false, error: "Missing email, password or userData" });
    }

    try {
        const {
            data: { user },
            error: authError,
        } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError || !user) {
            return res.status(500).json({
                success: false,
                error: authError?.message || "Failed to create auth user",
            });
        }

        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: user.id,
            ...userData,
        });

        if (profileError) {
            return res.status(500).json({
                success: false,
                error: profileError.message,
            });
        }

        return res.status(200).json({
            success: true,
            userId: user.id,
            temporaryPassword: password,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message ?? "Unexpected error",
        });
    }
}