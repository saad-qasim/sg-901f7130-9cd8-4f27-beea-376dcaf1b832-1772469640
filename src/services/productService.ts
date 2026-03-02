import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/integrations/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type ProductWithBrand = ProductRow & {
  brands: {
    name: string;
    warranty_text: string | null;
  } | null;
};

export const productService = {
  async getAllProducts(): Promise<ProductWithBrand[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        brands (
          name,
          warranty_text
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProductsByBrand(brandId: string): Promise<ProductWithBrand[]> {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        brands (
          name,
          warranty_text
        )
      `)
      .eq("brand_id", brandId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  },

  async getProductById(id: string): Promise<Database["public"]["Tables"]["products"]["Row"]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createProduct(product: Database["public"]["Tables"]["products"]["Insert"]): Promise<Database["public"]["Tables"]["products"]["Row"]> {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Database["public"]["Tables"]["products"]["Update"]): Promise<Database["public"]["Tables"]["products"]["Row"]> {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
};
