import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/integrations/supabase/types";

export type Brand = Database["public"]["Tables"]["brands"]["Row"];

export const brandService = {
  async getAllBrands(): Promise<Brand[]> {
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
  },

  async uploadLogo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
