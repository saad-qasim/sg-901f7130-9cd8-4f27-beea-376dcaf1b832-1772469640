import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/integrations/supabase/types";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];

export const brandService = {
  async getAllBrands(): Promise<Database["public"]["Tables"]["brands"]["Row"][]> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getBrandById(id: string): Promise<Database["public"]["Tables"]["brands"]["Row"]> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createBrand(brand: Database["public"]["Tables"]["brands"]["Insert"]): Promise<Database["public"]["Tables"]["brands"]["Row"]> {
    const { data, error } = await supabase
      .from("brands")
      .insert([brand])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBrand(id: string, updates: Database["public"]["Tables"]["brands"]["Update"]): Promise<Database["public"]["Tables"]["brands"]["Row"]> {
    const { data, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBrand(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
