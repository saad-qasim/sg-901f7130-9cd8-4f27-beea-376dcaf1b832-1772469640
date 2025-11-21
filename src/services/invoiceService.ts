
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];
type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

export interface InvoiceWithRelations extends Invoice {
  customers: {
    name: string;
    phone: string | null;
    address: string | null;
    email: string | null;
  };
  brands: {
    name: string;
    logo_url: string | null;
  };
  invoice_items: InvoiceItem[];
}

export interface InvoiceCreateData {
  invoice: InvoiceInsert;
  items: InvoiceItemInsert[];
}

export const invoiceService = {
  async getAllInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        customers (
          name,
          phone,
          address,
          email
        ),
        brands (
          name,
          logo_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as InvoiceWithRelations[];
  },

  async getInvoiceById(id: string) {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        customers (
          name,
          phone,
          address,
          email
        ),
        brands (
          name,
          logo_url
        ),
        invoice_items (
          *
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as InvoiceWithRelations;
  },

  async createInvoiceWithItems(data: InvoiceCreateData) {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([data.invoice])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const itemsWithInvoiceId = data.items.map(item => ({
      ...item,
      invoice_id: invoice.id
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsWithInvoiceId);

    if (itemsError) throw itemsError;

    return invoice as Invoice;
  },

  async updateInvoice(id: string, updates: InvoiceUpdate) {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  async generateInvoiceNumber() {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    
    const { data, error } = await supabase
      .from("invoices")
      .select("invoice_number")
      .like("invoice_number", `INV-${dateStr}-%`)
      .order("invoice_number", { ascending: false })
      .limit(1);

    if (error) throw error;

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }

    return `INV-${dateStr}-${sequence.toString().padStart(4, "0")}`;
  },

  async searchBySerialNumber(serialNumber: string) {
    const { data, error } = await supabase
      .from("invoice_items")
      .select(`
        *,
        invoices (
          *,
          customers (
            name,
            phone,
            address,
            email
          ),
          brands (
            name,
            logo_url
          )
        )
      `)
      .eq("serial_number", serialNumber);

    if (error) throw error;
    return data;
  }
};
