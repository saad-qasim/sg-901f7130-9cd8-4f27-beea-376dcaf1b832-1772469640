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
    if (req.method !== "DELETE") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { userId } = req.body as { userId?: string };

    if (!userId) {
        return res.status(400).json({ success: false, error: "Missing userId" });
    }

    try {
        // Delete profile row
        await supabaseAdmin.from("profiles").delete().eq("id", userId);

        // Delete Auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error(deleteError);
            return res.status(500).json({ success: false, error: deleteError.message });
        }

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
    }
}