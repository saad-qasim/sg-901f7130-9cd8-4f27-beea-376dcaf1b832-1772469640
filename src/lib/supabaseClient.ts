import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/frontend usage (uses anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client for server-side usage (uses anon key)
export const createServerClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Admin client for server-side admin operations (uses service role key)
// ⚠️ WARNING: Only use this in API routes, NEVER in client-side code!
export const createAdminClient = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables");
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};