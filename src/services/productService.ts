
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export interface ProductWithBrand extends Product {
  brands: {
    name: string;
  };
}

export const productService = {
  async getAllProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        brands (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ProductWithBrand[];
  },

  async getProductsByBrand(brandId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("brand_id", brandId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Product[];
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Product;
  },

  async createProduct(product: ProductInsert) {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async updateProduct(id: string, updates: ProductUpdate) {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
