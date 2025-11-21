import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];
type InvoiceInsertType = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceItemInsertType = Database["public"]["Tables"]["invoice_items"]["Insert"];

export type InvoiceWithRelations = InvoiceRow & {
  customers: {
    name: string;
    phone: string | null;
    address: string | null;
    email: string | null;
  } | null;
  brands: {
    name: string;
    logo_url: string | null;
  } | null;
  invoice_items: InvoiceItemRow[];
};

export interface InvoiceCreateData {
  invoice: InvoiceInsertType;
  items: InvoiceItemInsertType[];
}

export const invoiceService = {
  async getAllInvoices(): Promise<Omit<InvoiceWithRelations, 'invoice_items'>[]> {
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
    return data;
  },

  async getInvoiceById(id: string): Promise<InvoiceWithRelations> {
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
    return data;
  },

  async createInvoiceWithItems(data: {
    invoice: InvoiceInsertType;
    items: Omit<InvoiceItemInsertType, "invoice_id">[];
  }): Promise<InvoiceRow> {
    // 1. Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(data.invoice)
      .select()
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) throw new Error("Failed to create invoice record.");

    // 2. Add invoice_id to each item and insert them
    const itemsWithInvoiceId = data.items.map((item) => ({
      ...item,
      invoice_id: invoice.id,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsWithInvoiceId);

    if (itemsError) {
      // Optional: attempt to delete the orphaned invoice if items fail
      await supabase.from("invoices").delete().eq("id", invoice.id);
      throw itemsError;
    }

    return invoice;
  },

  async updateInvoice(id: string, updates: Database["public"]["Tables"]["invoices"]["Update"]): Promise<Database["public"]["Tables"]["invoices"]["Row"]> {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async generateInvoiceNumber(): Promise<string> {
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
    if (data && data.length > 0 && data[0].invoice_number) {
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
  },

  async searchInvoices(searchTerm: string): Promise<Omit<InvoiceWithRelations, 'invoice_items'>[]> {
    // Search by customer name (starts with) OR phone (contains) OR serial number (contains)
    const { data: invoicesByCustomer, error: customerError } = await supabase
      .from("invoices")
      .select(`
        *,
        customers!inner (
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
      .or(`customers.name.ilike.${searchTerm}%,customers.phone.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false });

    if (customerError) throw customerError;

    // Search by serial number in invoice_items
    const { data: itemsWithSerial, error: serialError } = await supabase
      .from("invoice_items")
      .select(`
        invoice_id
      `)
      .ilike("serial_number", `%${searchTerm}%`);

    if (serialError) throw serialError;

    // Get unique invoice IDs from serial number search
    const invoiceIdsFromSerial = Array.from(
      new Set(itemsWithSerial?.map(item => item.invoice_id) || [])
    );

    // Fetch invoices by IDs from serial search
    let invoicesBySerial: any[] = [];
    if (invoiceIdsFromSerial.length > 0) {
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
        .in("id", invoiceIdsFromSerial)
        .order("created_at", { ascending: false });

      if (error) throw error;
      invoicesBySerial = data || [];
    }

    // Combine results and remove duplicates
    const allInvoices = [...(invoicesByCustomer || []), ...invoicesBySerial];
    const uniqueInvoices = Array.from(
      new Map(allInvoices.map(invoice => [invoice.id, invoice])).values()
    );

    return uniqueInvoices;
  },

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async deleteInvoices(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .in("id", ids);

    if (error) throw error;
  }
};
