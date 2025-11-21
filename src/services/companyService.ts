import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type CompanySettings = Database["public"]["Tables"]["company_settings"]["Row"];

export const companyService = {
  async getCompanySettings() {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data as CompanySettings | null;
  }
};
