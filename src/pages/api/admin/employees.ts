
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // GET
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return res.status(400).json({ success: false, error: error.message });

      return res.status(200).json({ success: true, employees: data });
    }

    // POST
    if (req.method === "POST") {
      const { email, password, profile } = req.body;

      const { data: authRes, error: authErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (authErr || !authRes.user) {
        return res.status(400).json({
          success: false,
          error: authErr?.message || "Failed to create auth user",
        });
      }

      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authRes.user.id,
          ...profile,
        });

      if (profileErr)
        return res.status(400).json({ success: false, error: profileErr.message });

      return res.status(200).json({
        success: true,
        userId: authRes.user.id,
      });
    }

    // PATCH
    if (req.method === "PATCH") {
      const { userId, updates } = req.body;

      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) return res.status(400).json({ success: false, error: error.message });

      return res.status(200).json({ success: true });
    }

    // DELETE
    if (req.method === "DELETE") {
      const { userId } = req.body;

      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileErr)
        return res.status(400).json({ success: false, error: profileErr.message });

      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

      if (authErr)
        return res.status(400).json({ success: false, error: authErr.message });

      return res.status(200).json({ success: true });
    }

    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Unexpected error",
    });
  }
}
