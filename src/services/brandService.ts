
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type BrandInsert = Database["public"]["Tables"]["brands"]["Insert"];
type BrandUpdate = Database["public"]["Tables"]["brands"]["Update"];

export const brandService = {
  async getAllBrands() {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Brand[];
  },

  async getBrandById(id: string) {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Brand;
  },

  async createBrand(brand: BrandInsert) {
    const { data, error } = await supabase
      .from("brands")
      .insert([brand])
      .select()
      .single();

    if (error) throw error;
    return data as Brand;
  },

  async updateBrand(id: string, updates: BrandUpdate) {
    const { data, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Brand;
  },

  async deleteBrand(id: string) {
    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
