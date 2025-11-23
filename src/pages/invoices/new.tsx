import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService } from "@/services/invoiceService";
import { productService, ProductWithBrand } from "@/services/productService";
import { companyService, CompanySettings } from "@/services/companyService";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Search } from "lucide-react";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabaseClient";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Brand = Database["public"]["Tables"]["brands"]["Row"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];
type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CompanySettingsRow = Database["public"]["Tables"]["company_settings"]["Row"];

export default function NewInvoicePage() {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceTitle, setInvoiceTitle] = useState("فاتورة بيع");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [warrantyEndDate, setWarrantyEndDate] = useState<string>("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CustomerInsert>({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithBrand[]>(
    []
  );
  const [showProductSearchDialog, setShowProductSearchDialog] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemInsert[]>([]);
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<"IQD" | "USD">("IQD");
  const [notes, setNotes] = useState("");

  const [companies, setCompanies] = useState<CompanySettingsRow[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // تحميل العملاء
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .order("name", { ascending: true });

        if (customersError) {
          console.error("Error loading customers", customersError);
        } else {
          setCustomers(customersData || []);
        }

        // تحميل العلامات التجارية
        const { data: brandsData, error: brandsError } = await supabase
          .from("brands")
          .select("*")
          .order("name", { ascending: true });

        if (brandsError) {
          console.error("Error loading brands", brandsError);
        } else {
          setBrands(brandsData || []);
        }

        // تحميل إعدادات الشركات
        const { data: companiesData, error: companiesError } = await supabase
          .from("company_settings")
          .select("*")
          .order("company_name", { ascending: true });

        if (companiesError) {
          console.error("Error loading companies", companiesError);
        } else {
          setCompanies(companiesData || []);
          // استخدام أول شركة إن وجدت
          if (companiesData && companiesData.length > 0) {
            setSelectedCompanyId(companiesData[0].id);
            setCompanySettings(companiesData[0] as CompanySettings);
            // توليد رقم الفاتورة للشركة الأولى
            try {
              const nextInvoiceNum = await invoiceService.generateInvoiceNumber(companiesData[0].id);
              setInvoiceNumber(nextInvoiceNum);
            } catch (err) {
              console.error("Error generating invoice number:", err);
            }
          }
        }

        // تحميل المنتجات
        const productsData = await productService.getAllProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, []);

  // توليد رقم فاتورة جديد عند تغيير الشركة
  useEffect(() => {
    const generateInvoiceNum = async () => {
      if (selectedCompanyId) {
        try {
          const nextInvoiceNum = await invoiceService.generateInvoiceNumber(selectedCompanyId);
          setInvoiceNumber(nextInvoiceNum);
        } catch (err) {
          console.error("Error generating invoice number:", err);
        }
      }
    };

    generateInvoiceNum();
  }, [selectedCompanyId]);

  // حساب تاريخ انتهاء الضمان تلقائياً عند تغيير تاريخ الفاتورة
  useEffect(() => {
    if (invoiceDate && !warrantyEndDate) {
      const invoiceDateObj = new Date(invoiceDate);
      const defaultWarranty = new Date(
        invoiceDateObj.getFullYear() + 2,
        invoiceDateObj.getMonth(),
        invoiceDateObj.getDate()
      );
      setWarrantyEndDate(defaultWarranty.toISOString().split("T")[0]);
    }
  }, [invoiceDate]);

  useEffect(() => {
    const newTotal = invoiceItems.reduce(
      (acc, item) => acc + (item.quantity || 0) * (item.unit_price || 0),
      0
    );
    setTotal(newTotal);
  }, [invoiceItems]);

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    if (!brandId) {
      setFilteredProducts(products);
      return;
    }
    const brandProducts = products.filter((p) => p.brand_id === brandId);
    setFilteredProducts(brandProducts);
  };

  const handleAddProduct = (product: ProductWithBrand) => {
    const existingItem = invoiceItems.find(
      (item) => item.product_id === product.id
    );
    if (existingItem) {
      alert("This product is already in the invoice.");
      return;
    }

    const price = currency === "USD" ? product.unit_price_usd || 0 : product.unit_price_iqd || 0;

    const newItem: InvoiceItemInsert = {
      product_id: product.id,
      product_name_snapshot: product.description || product.name,
      serial_number: "",
      quantity: 1,
      unit_price: price,
      total: price,
    };
    setInvoiceItems([...invoiceItems, newItem]);
    setShowProductSearchDialog(false);
    setProductSearchTerm("");
  };

  const handleItemChange = (
    index: number,
    field: "quantity" | "unit_price" | "serial_number",
    value: string | number
  ) => {
    const updatedItems = [...invoiceItems];
    const item = updatedItems[index];

    if (field === "serial_number") {
      item.serial_number = value as string;
    } else {
      const numericValue = Number(value);
      if (field === "quantity") {
        item.quantity = numericValue;
      } else if (field === "unit_price") {
        item.unit_price = numericValue;
      }
      item.total = (item.quantity || 0) * (item.unit_price || 0);
    }

    setInvoiceItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) {
      alert("Please enter customer name");
      return;
    }
    try {
      const { data: createdCustomer, error: createError } = await supabase
        .from("customers")
        .insert([newCustomer])
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      
      // Refresh customers list
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
      setCustomers(customersData || []);
      
      // Auto-select the newly created customer
      setSelectedCustomerId(createdCustomer.id);
      
      // Close dialog and reset form
      setShowNewCustomerDialog(false);
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: ""
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to create customer");
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedCompanyId) {
      alert("يرجى اختيار شركة");
      return;
    }

    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }
    if (invoiceItems.length === 0) {
      alert("Please add at least one product to the invoice.");
      return;
    }
    if (!invoiceTitle.trim()) {
      alert("يرجى إدخال اسم الفاتورة");
      return;
    }

    // لو الرقم فارغ، أعد توليده
    let finalInvoiceNumber = invoiceNumber.trim();
    if (!finalInvoiceNumber) {
      try {
        finalInvoiceNumber = await invoiceService.generateInvoiceNumber(selectedCompanyId);
        setInvoiceNumber(finalInvoiceNumber);
      } catch (err) {
        alert("فشل في توليد رقم الفاتورة");
        return;
      }
    }

    setSaving(true);
    try {
      const invoiceData = {
        company_id: selectedCompanyId,
        customer_id: selectedCustomerId,
        brand_id: selectedBrandId || null,
        invoice_number: finalInvoiceNumber,
        invoice_title: invoiceTitle.trim(),
        invoice_date: invoiceDate,
        warranty_end_date: warrantyEndDate || null,
        total,
        currency,
        notes,
      };

      const finalInvoiceItems = invoiceItems.map(item => ({
        ...item,
        total: (item.quantity || 1) * (item.unit_price || 0)
      }))

      await invoiceService.addInvoice(
        invoiceData,
        finalInvoiceItems
      );

      router.push(`/invoices`);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      alert(error.message || "Failed to create invoice. Please check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const filterProducts = (term: string) => {
    setProductSearchTerm(term);
    if (!term) {
      setFilteredProducts(products);
      return;
    }
    const lowercasedTerm = term.toLowerCase();
    const results = products.filter(
      (p) =>
        p.description?.toLowerCase().includes(lowercasedTerm) ||
        p.model_number?.toLowerCase().includes(lowercasedTerm) ||
        p.name.toLowerCase().includes(lowercasedTerm)
    );
    setFilteredProducts(results);
  };

  const formatCurrencyDisplay = (amount: number) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toLocaleString()} IQD`;
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">إنشاء فاتورة جديدة</h1>
          <Button onClick={handleCreateInvoice} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Selection */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الشركة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="company">الشركة *</Label>
                  <select
                    id="company"
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={selectedCompanyId}
                    onChange={(e) => {
                      const companyId = e.target.value;
                      setSelectedCompanyId(companyId);
                      const company = companies.find(c => c.id === companyId);
                      if (company) {
                        setCompanySettings(company as CompanySettings);
                      }
                    }}
                    required
                  >
                    <option value="">اختر شركة</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Customer and Brand Selection */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات العميل والعلامة التجارية</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer">العميل</Label>
                  <div className="flex gap-2">
                    <select
                      id="customer"
                      className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">اختر عميل</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowNewCustomerDialog(true)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">العلامة التجارية</Label>
                  <select
                    id="brand"
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={selectedBrandId}
                    onChange={(e) => handleBrandChange(e.target.value)}
                  >
                    <option value="">اختر علامة تجارية</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الفاتورة</CardTitle>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowProductSearchDialog(true)}
                  disabled={!selectedBrandId}
                >
                  <Plus size={16} />
                  إضافة منتج
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المنتج</TableHead>
                        <TableHead>الرقم التسلسلي</TableHead>
                        <TableHead className="w-[100px]">الكمية</TableHead>
                        <TableHead className="w-[150px]">السعر</TableHead>
                        <TableHead className="w-[150px]">المجموع</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            لم يتم إضافة أي منتجات بعد
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoiceItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.product_name_snapshot}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                className="border rounded-md px-2 py-1 w-full text-sm"
                                value={item.serial_number || ""}
                                onChange={(e) =>
                                  handleItemChange(index, "serial_number", e.target.value)
                                }
                                placeholder="SN / الرقم التسلسلي"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                className="w-full"
                                min="1"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unit_price || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "unit_price",
                                    e.target.value
                                  )
                                }
                                className="w-full"
                                dir="ltr"
                              />
                            </TableCell>
                            <TableCell>
                              {formatCurrencyDisplay(
                                (item.quantity || 0) * (item.unit_price || 0)
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveItem(index)}
                                className="text-destructive"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الفاتورة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-title">اسم الفاتورة</Label>
                  <Input
                    id="invoice-title"
                    value={invoiceTitle}
                    onChange={(e) => setInvoiceTitle(e.target.value)}
                    placeholder="فاتورة بيع"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">
                    رقم الفاتورة *
                    <span className="text-xs text-muted-foreground ml-2">
                      (يمكن التعديل يدويًا)
                    </span>
                  </Label>
                  <Input
                    id="invoice-number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-000001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">تاريخ الفاتورة</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty-end-date">تاريخ انتهاء الضمان</Label>
                  <Input
                    id="warranty-end-date"
                    type="date"
                    value={warrantyEndDate}
                    onChange={(e) => setWarrantyEndDate(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Select
                    onValueChange={(val: "IQD" | "USD") => setCurrency(val)}
                    value={currency}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">دينار عراقي (IQD)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="أضف ملاحظات إضافية هنا..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>الإجمالي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">
                  {formatCurrencyDisplay(total)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* New Customer Dialog */}
        <Dialog
          open={showNewCustomerDialog}
          onOpenChange={setShowNewCustomerDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة عميل جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveNewCustomer} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-customer-name">اسم العميل *</Label>
                <Input
                  id="new-customer-name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-customer-phone">رقم الهاتف</Label>
                <Input
                  id="new-customer-phone"
                  value={newCustomer.phone || ""}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-customer-email">البريد الإلكتروني</Label>
                <Input
                  id="new-customer-email"
                  type="email"
                  value={newCustomer.email || ""}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-customer-address">العنوان</Label>
                <Textarea
                  id="new-customer-address"
                  value={newCustomer.address || ""}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCustomerDialog(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">حفظ العميل</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Product Search Dialog */}
        <Dialog
          open={showProductSearchDialog}
          onOpenChange={setShowProductSearchDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                البحث عن منتج ({brands.find((b) => b.id === selectedBrandId)?.name}
                )
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="ابحث بالاسم، الوصف، أو الرقم التسلسلي..."
                  value={productSearchTerm}
                  onChange={(e) => filterProducts(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>السعر (IQD)</TableHead>
                      <TableHead>السعر (USD)</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {p.description}
                          </div>
                        </TableCell>
                        <TableCell>{p.unit_price_iqd?.toLocaleString()}</TableCell>
                        <TableCell>${p.unit_price_usd?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddProduct(p)}
                          >
                            إضافة
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
