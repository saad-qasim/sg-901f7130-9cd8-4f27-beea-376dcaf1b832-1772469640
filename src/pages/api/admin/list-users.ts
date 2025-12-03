
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const getServiceRoleClient = () => {
    const supabaseUrl =
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase environment variables");
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res
            .status(405)
            .json({ success: false, error: "Method not allowed" });
    }

    try {
        const supabaseAdmin = getServiceRoleClient();

        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
        });

        if (error) {
            console.error("List users error:", error);
            return res
                .status(400)
                .json({ success: false, error: error.message });
        }

        return res.status(200).json({
            success: true,
            users: data?.users ?? [],
        });
    } catch (error: any) {
        console.error("Unexpected error:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
        });
    }
}