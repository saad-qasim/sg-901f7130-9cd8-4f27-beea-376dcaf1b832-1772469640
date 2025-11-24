import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/integrations/supabase/types";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];
type InvoiceInsertType = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceItemInsertType =
  Database["public"]["Tables"]["invoice_items"]["Insert"];

export type InvoiceWithRelations = InvoiceRow & {
  invoice_title: string | null;
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
  async getAllInvoices(): Promise<Omit<InvoiceWithRelations, "invoice_items">[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_title,
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
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getInvoiceById(id: string): Promise<InvoiceWithRelations> {
    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_title,
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
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async addInvoice(
    invoiceData: InvoiceInsertType,
    itemsData: InvoiceItemInsertType[]
  ): Promise<InvoiceRow> {
    // 1. التحقق من توفر المخزون لكل منتج
    for (const item of itemsData) {
      if (!item.product_id) {
        throw new Error("كل عنصر يجب أن يحتوي على product_id");
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("name, stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (productError) {
        throw new Error(`فشل في جلب بيانات المنتج: ${productError.message}`);
      }

      const availableStock = product.stock_quantity || 0;
      const requestedQuantity = item.quantity || 0;

      if (availableStock < requestedQuantity) {
        throw new Error(
          `الكمية المطلوبة من المنتج "${product.name}" أكبر من المتوفر في المخزون (${availableStock} متوفر).`
        );
      }
    }

    // 2. إنشاء الفاتورة
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) throw new Error("Failed to create invoice record.");

    // 3. إضافة invoice_id لكل عنصر وإدراجها
    const itemsWithInvoiceId = itemsData.map((item) => ({
      ...item,
      invoice_id: invoice.id,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsWithInvoiceId);

    if (itemsError) {
      // محاولة حذف الفاتورة اليتيمة إذا فشل إدراج العناصر
      await supabase.from("invoices").delete().eq("id", invoice.id);
      throw itemsError;
    }

    // 4. تحديث المخزون لكل منتج
    for (const item of itemsData) {
      if (!item.product_id) continue;

      // جلب الكمية الحالية
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (fetchError) {
        console.error(
          `فشل في جلب مخزون المنتج ${item.product_id}:`,
          fetchError
        );
        continue; // الاستمرار مع المنتجات الأخرى
      }

      const currentStock = product.stock_quantity || 0;
      const newStock = currentStock - (item.quantity || 0);

      // تحديث المخزون
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: Math.max(0, newStock) })
        .eq("id", item.product_id);

      if (updateError) {
        console.error(
          `فشل في تحديث مخزون المنتج ${item.product_id}:`,
          updateError
        );
        // لا نرمي خطأ هنا لأن الفاتورة تم إنشاؤها بالفعل
      }
    }

    return invoice;
  },

  async updateInvoice(
    id: string,
    updates: Database["public"]["Tables"]["invoices"]["Update"]
  ): Promise<Database["public"]["Tables"]["invoices"]["Row"]> {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async generateInvoiceNumber(companyId: string): Promise<string> {
    // 1. جلب إعدادات الشركة
    const { data: company, error: companyError } = await supabase
      .from("company_settings")
      .select("invoice_start_number, invoice_prefix")
      .eq("id", companyId)
      .single();

    if (companyError) {
      throw new Error(
        `Failed to fetch company settings: ${companyError.message}`
      );
    }

    // 2. جلب آخر فاتورة لهذه الشركة
    const { data: lastInvoice, error: lastError } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastError) {
      throw new Error(`Failed to fetch last invoice: ${lastError.message}`);
    }

    // 3. استخراج الجزء الرقمي من رقم الفاتورة الأخير إن وجد
    let currentNumber = (company.invoice_start_number || 1) - 1;

    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/(\d+)$/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed)) {
          currentNumber = Math.max(currentNumber, parsed);
        }
      }
    }

    // 4. حساب الرقم التالي وإنشاء رقم الفاتورة
    const nextNumber = currentNumber + 1;
    const padded = nextNumber.toString().padStart(6, "0");
    const invoiceNumber = `${company.invoice_prefix}${padded}`;

    return invoiceNumber;
  },

  async searchBySerialNumber(serialNumber: string) {
    const { data, error } = await supabase.from("invoice_items").select(
      `
        *,
        invoices (
          *,
          invoice_title,
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
      `
    ).eq("serial_number", serialNumber);

    if (error) throw error;
    return data;
  },

  async searchInvoices(
    searchTerm: string
  ): Promise<Omit<InvoiceWithRelations, "invoice_items">[]> {
    const { data: invoicesByCustomer, error: customerError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        invoice_title,
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
      `
      )
      .or(
        `customers.name.ilike.${searchTerm}%,customers.phone.ilike.%${searchTerm}%`
      )
      .order("created_at", { ascending: false });

    if (customerError) throw customerError;

    const { data: itemsWithSerial, error: serialError } = await supabase
      .from("invoice_items")
      .select(`
        invoice_id
      `)
      .ilike("serial_number", `%${searchTerm}%`);

    if (serialError) throw serialError;

    const invoiceIdsFromSerial = Array.from(
      new Set(itemsWithSerial?.map((item) => item.invoice_id) || [])
    );

    let invoicesBySerial: any[] = [];
    if (invoiceIdsFromSerial.length > 0) {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          invoice_title,
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
        `
        )
        .in("id", invoiceIdsFromSerial)
        .order("created_at", { ascending: false });

      if (error) throw error;
      invoicesBySerial = data || [];
    }

    const allInvoices = [...(invoicesByCustomer || []), ...invoicesBySerial];
    const uniqueInvoices = Array.from(
      new Map(allInvoices.map((invoice) => [invoice.id, invoice])).values()
    );

    return uniqueInvoices;
  },

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) throw error;
  },

  async deleteInvoices(ids: string[]): Promise<void> {
    const { error } = await supabase.from("invoices").delete().in("id", ids);
    if (error) throw error;
  },

  async updateInvoiceWithItems(
    id: string,
    invoiceData: Database["public"]["Tables"]["invoices"]["Update"],
    itemsData: InvoiceItemInsertType[]
  ): Promise<InvoiceRow> {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .update(invoiceData)
      .eq("id", id)
      .select()
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) throw new Error("Failed to update invoice record.");

    const { error: deleteError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id);

    if (deleteError) throw deleteError;

    const itemsWithInvoiceId = itemsData.map((item) => ({
      ...item,
      invoice_id: id,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsWithInvoiceId);

    if (itemsError) throw itemsError;

    return invoice;
  },

  async markInvoiceAsPaid(id: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("invoices")
      .update({
        payment_status: "paid",
        payment_date: now,
      })
      .eq("id", id);

    if (error) throw error;
  },
};
