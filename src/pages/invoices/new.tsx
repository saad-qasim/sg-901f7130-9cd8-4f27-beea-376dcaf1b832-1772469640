import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService } from "@/services/invoiceService";
import { customerService } from "@/services/customerService";
import { brandService } from "@/services/brandService";
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

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Brand = Database["public"]["Tables"]["brands"]["Row"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

export default function NewInvoicePage() {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceTitle, setInvoiceTitle] = useState("فاتورة بيع");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

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

  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          customersData,
          brandsData,
          productsData,
          nextInvoiceNum,
          settingsData,
        ] = await Promise.all([
          customerService.getAllCustomers(),
          brandService.getAllBrands(),
          productService.getAllProducts(),
          invoiceService.generateInvoiceNumber(),
          companyService.getCompanySettings(),
        ]);
        setCustomers(customersData);
        setBrands(brandsData);
        setProducts(productsData);
        setFilteredProducts(productsData);
        setInvoiceNumber(nextInvoiceNum.toString());
        setCompanySettings(settingsData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const newTotal = invoiceItems.reduce(
      (acc, item) => acc + (item.quantity || 0) * (item.unit_price || 0),
      0
    );
    setTotal(newTotal);
  }, [invoiceItems]);

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
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
      serial_number: product.model_number,
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
    field: "quantity" | "unit_price",
    value: string | number
  ) => {
    const updatedItems = [...invoiceItems];
    const item = updatedItems[index];

    const numericValue = Number(value);
    if (field === "quantity") {
      item.quantity = numericValue;
    } else if (field === "unit_price") {
      item.unit_price = numericValue;
    }

    item.total = (item.quantity || 0) * (item.unit_price || 0);
    setInvoiceItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustomer.name) {
      alert("Please enter customer name");
      return;
    }
    try {
      const createdCustomer = await customerService.createCustomer(newCustomer);
      setCustomers([...customers, createdCustomer]);
      setSelectedCustomerId(createdCustomer.id);
      setShowNewCustomerDialog(false);
      setNewCustomer({ name: "", phone: "" });
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to create customer");
    }
  };

  const handleCreateInvoice = async () => {
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

    setSaving(true);
    try {
      const invoiceData = {
        customer_id: selectedCustomerId,
        brand_id: selectedBrandId,
        invoice_number: invoiceNumber,
        invoice_title: invoiceTitle.trim(),
        invoice_date: invoiceDate,
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
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice");
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
            {/* Customer and Brand Selection */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات العميل والعلامة التجارية</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer">العميل</Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={setSelectedCustomerId}
                      value={selectedCustomerId || ""}
                    >
                      <SelectTrigger id="customer">
                        <SelectValue placeholder="اختر عميل" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Select
                    onValueChange={handleBrandChange}
                    value={selectedBrandId || ""}
                  >
                    <SelectTrigger id="brand">
                      <SelectValue placeholder="اختر علامة تجارية" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            <TableCell>{item.serial_number}</TableCell>
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
                  <Label htmlFor="invoice-number">رقم الفاتورة</Label>
                  <Input
                    id="invoice-number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    readOnly
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عميل جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-customer-name">اسم العميل</Label>
                <Input
                  id="new-customer-name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-customer-phone">رقم الهاتف</Label>
                <Input
                  id="new-customer-phone"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  dir="ltr"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewCustomerDialog(false)}
                >
                  إلغاء
                </Button>
                <Button onClick={handleSaveNewCustomer}>حفظ العميل</Button>
              </div>
            </div>
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
                            {p.model_number} - {p.description}
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
