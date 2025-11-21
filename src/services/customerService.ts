
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

export const customerService = {
  async getAllCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Customer[];
  },

  async searchCustomers(query: string) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Customer[];
  },

  async getCustomerById(id: string) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async createCustomer(customer: CustomerInsert) {
    const { data, error } = await supabase
      .from("customers")
      .insert([customer])
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async updateCustomer(id: string, updates: CustomerUpdate) {
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
