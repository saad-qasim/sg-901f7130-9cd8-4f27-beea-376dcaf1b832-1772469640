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

    const { email, password, userData } = req.body;

    if (!email || !password || !userData) {
        return res.status(400).json({ success: false, error: "Missing data" });
    }

    try {
        // Create Auth user
        const {
            data: { user },
            error: authError,
        } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError || !user) {
            return res.status(500).json({ success: false, error: authError?.message });
        }

        // Create profile record
        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: user.id,
            ...userData,
        });

        if (profileError) {
            return res.status(500).json({ success: false, error: profileError.message });
        }

        return res.status(200).json({
            success: true,
            userId: user.id,
            temporaryPassword: password,
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
}