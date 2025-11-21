import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type CompanySettings = Database["public"]["Tables"]["company_settings"]["Row"];
type CompanySettingsInsert = Database["public"]["Tables"]["company_settings"]["Insert"];
type CompanySettingsUpdate = Database["public"]["Tables"]["company_settings"]["Update"];

export const companyService = {
  async getCompanySettings() {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data as CompanySettings | null;
  },

  async getAllCompanies() {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as CompanySettings[];
  },

  async getCompanyById(id: string) {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as CompanySettings;
  },

  async createCompany(company: Omit<CompanySettingsInsert, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("company_settings")
      .insert([company])
      .select()
      .single();

    if (error) throw error;
    return data as CompanySettings;
  },

  async updateCompany(id: string, updates: CompanySettingsUpdate) {
    const { data, error } = await supabase
      .from("company_settings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as CompanySettings;
  },

  async deleteCompany(id: string) {
    const { error } = await supabase
      .from("company_settings")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
