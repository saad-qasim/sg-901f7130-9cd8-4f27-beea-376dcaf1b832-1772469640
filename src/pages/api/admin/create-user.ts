import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient < Database > (supabaseUrl, serviceRoleKey);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
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
        // إنشاء مستخدم في Auth
        const {
            data: { user },
            error: authError,
        } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError || !user) {
            console.error("Error creating auth user:", authError);
            return res
                .status(500)
                .json({ success: false, error: "Failed to create auth user" });
        }

        // إنشاء صف في profiles بنفس الـ id
        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: user.id,
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
            console.error("Error creating profile:", profileError);
            return res
                .status(500)
                .json({ success: false, error: "Failed to create profile" });
        }

        return res.status(200).json({
            success: true,
            userId: user.id,
            temporaryPassword: password,
        });
    } catch (error: any) {
        console.error("Unexpected error creating user:", error);
        return res
            .status(500)
            .json({ success: false, error: "Unexpected error creating user" });
    }
}