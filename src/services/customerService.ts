import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/integrations/supabase/types";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export const customerService = {
  async getAllCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCustomerById(id: string): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCustomer(customer: Database["public"]["Tables"]["customers"]["Insert"]): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .insert([customer])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCustomer(id: string, updates: Database["public"]["Tables"]["customers"]["Update"]): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
