
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type CompanySettings = Database["public"]["Tables"]["company_settings"]["Row"];

export const companyService = {
  async getCompanySettings() {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as CompanySettings;
  }
};
