import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService, InvoiceWithRelations } from "@/services/invoiceService";
import { supabase } from "@/lib/supabaseClient";
import { productService, ProductWithBrand } from "@/services/productService";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Brand = Database["public"]["Tables"]["brands"]["Row"];

interface InvoiceItem {
  product_id: string | null;
  product_name_snapshot: string;
  serial_number: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Invoice data
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceTitle, setInvoiceTitle] = useState("فاتورة بيع");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [currency, setCurrency] = useState<"IQD" | "USD">("IQD");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [warrantyText, setWarrantyText] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [companyInfoSnapshot, setCompanyInfoSnapshot] = useState<string>("");

  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // UI states
  const [customerSearch, setCustomerSearch] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (id && typeof id === "string" && customers.length > 0 && brands.length > 0) {
      loadInvoice(id);
    }
  }, [id, customers, brands]);

  useEffect(() => {
    if (selectedBrand) {
      loadProducts(selectedBrand.id);
      setWarrantyText(selectedBrand.warranty_default_text || "");
    }
  }, [selectedBrand]);

  const loadReferenceData = async () => {
    try {
      // تحميل العملاء
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (customersError) {
        console.error("Error loading customers:", customersError);
        throw customersError;
      }

      // تحميل العلامات التجارية
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("*")
        .order("name", { ascending: true });

      if (brandsError) {
        console.error("Error loading brands:", brandsError);
        throw brandsError;
      }

      // تحميل الشركات
      const { data: companiesData, error: companiesError } = await supabase
        .from("company_settings")
        .select("*")
        .order("company_name", { ascending: true });

      if (companiesError) {
        console.error("Error loading companies:", companiesError);
        throw companiesError;
      }

      setCustomers(customersData || []);
      setBrands(brandsData || []);
      setCompanies(companiesData || []);
    } catch (error) {
      console.error("Error loading reference data:", error);
      alert("Failed to load reference data");
    }
  };

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(invoiceId);

      // Set invoice number
      setInvoiceNumber(data.invoice_number || "");

      // Set invoice title
      setInvoiceTitle(data.invoice_title || "فاتورة بيع");

      // Set customer
      const customer = customers.find((c) => c.id === data.customer_id);
      setSelectedCustomer(customer || null);

      // Set brand
      const brand = brands.find((b) => b.id === data.brand_id);
      setSelectedBrand(brand || null);

      // Set company
      if (data.company_id) {
        setSelectedCompanyId(data.company_id);
        const company = companies.find((c) => c.id === data.company_id);
        if (company) {
          const snapshot = `${company.company_name}\n${company.company_info_text || ""}`;
          setCompanyInfoSnapshot(snapshot);
        }
      }

      // Set other invoice fields
      setCurrency(data.currency as "IQD" | "USD");
      setInvoiceDate(data.invoice_date ? data.invoice_date.split("T")[0] : "");
      setWarrantyEndDate(data.warranty_end_date ? data.warranty_end_date.split("T")[0] : "");
      setShippingCost(data.shipping_cost ?? 0);
      setNotes(data.notes || "");
      setWarrantyText(data.warranty_text_snapshot || "");

      // Set items
      const invoiceItems: InvoiceItem[] = data.invoice_items.map((item) => ({
        product_id: item.product_id,
        product_name_snapshot: item.product_name_snapshot,
        serial_number: item.serial_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));
      setItems(invoiceItems);
    } catch (error) {
      console.error("Error loading invoice:", error);
      alert("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (brandId: string) => {
    try {
      const data = await productService.getProductsByBrand(brandId);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Failed to load products");
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert("يرجى إدخال اسم العميل");
      return;
    }

    try {
      const { data: newCustomer, error } = await supabase
        .from("customers")
        .insert([{
          name: newCustomerName,
          phone: newCustomerPhone || null,
          address: newCustomerAddress || null,
          email: newCustomerEmail || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(newCustomer);
      setCustomerSearch(newCustomer.name);
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");
      setNewCustomerEmail("");
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer");
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product_id: null,
        product_name_snapshot: "",
        serial_number: "",
        quantity: 1,
        unit_price: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const unitPrice =
      currency === "USD" ? product.unit_price_usd : product.unit_price_iqd;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      product_name_snapshot: product.name,
      unit_price: unitPrice,
      total: unitPrice * newItems[index].quantity,
    };

    if (product.warranty_text && !warrantyText) {
      setWarrantyText(product.warranty_text);
    }

    setItems(newItems);
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unit_price") {
      const quantity =
        field === "quantity" ? Number(value) : newItems[index].quantity;
      const unitPrice =
        field === "unit_price" ? Number(value) : newItems[index].unit_price;
      newItems[index].total = quantity * unitPrice;
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost;
  };

  const handleSave = async () => {
    // Validation
    if (!invoiceNumber.trim()) {
      alert("يرجى إدخال رقم الفاتورة");
      return;
    }

    if (!invoiceTitle.trim()) {
      alert("يرجى إدخال اسم الفاتورة");
      return;
    }

    if (!selectedCustomer) {
      alert("يرجى اختيار عميل");
      return;
    }

    if (!selectedBrand) {
      alert("يرجى اختيار علامة تجارية");
      return;
    }

    if (items.length === 0) {
      alert("يرجى إضافة عنصر واحد على الأقل");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_name_snapshot.trim()) {
        alert(`العنصر ${i + 1}: يرجى اختيار منتج`);
        return;
      }
      if (!item.serial_number.trim()) {
        alert(`العنصر ${i + 1}: يرجى إدخال الرقم التسلسلي`);
        return;
      }
      if (item.quantity <= 0) {
        alert(`العنصر ${i + 1}: الكمية يجب أن تكون أكبر من صفر`);
        return;
      }
      if (item.unit_price <= 0) {
        alert(`العنصر ${i + 1}: السعر يجب أن يكون أكبر من صفر`);
        return;
      }
    }

    if (!invoiceDate) {
      alert("يرجى إدخال تاريخ الفاتورة");
      return;
    }

    if (!warrantyEndDate) {
      alert("يرجى إدخال تاريخ انتهاء الضمان");
      return;
    }

    try {
      setSaving(true);

      const invoiceData = {
        invoice_number: invoiceNumber.trim(),
        invoice_title: invoiceTitle,
        customer_id: selectedCustomer.id,
        brand_id: selectedBrand.id,
        company_id: selectedCompanyId || null,
        invoice_date: invoiceDate,
        warranty_end_date: warrantyEndDate,
        currency,
        subtotal: calculateSubtotal(),
        shipping_cost: shippingCost,
        total: calculateTotal(),
        notes: notes || null,
        company_info_snapshot: companyInfoSnapshot,
        warranty_text_snapshot: warrantyText || null,
      };

      const itemsData = items.map((item) => ({
        product_id: item.product_id,
        product_name_snapshot: item.product_name_snapshot,
        serial_number: item.serial_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      await invoiceService.updateInvoiceWithItems(
        id as string,
        invoiceData,
        itemsData
      );

      alert("تم تحديث الفاتورة بنجاح!");
      router.push(`/invoices/${id}`);
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("فشل في تحديث الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (customer.phone && customer.phone.includes(customerSearch))
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6 mt-4">تعديل الفاتورة</h1>

        <div className="space-y-6">
          {/* Invoice Title and Number */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoice-title">اسم الفاتورة</Label>
                <Input
                  id="invoice-title"
                  value={invoiceTitle}
                  onChange={(e) => setInvoiceTitle(e.target.value)}
                  placeholder="فاتورة بيع"
                />
              </div>

              <div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice-date">تاريخ الفاتورة</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="warranty-end-date">تاريخ انتهاء الضمان</Label>
                  <Input
                    id="warranty-end-date"
                    type="date"
                    value={warrantyEndDate}
                    onChange={(e) => setWarrantyEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCustomer ? (
                <>
                  <div>
                    <Label htmlFor="customer-search">البحث عن عميل</Label>
                    <Input
                      id="customer-search"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو رقم الهاتف"
                    />
                  </div>

                  {customerSearch && filteredCustomers.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch("");
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted"
                        >
                          <div className="font-semibold">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-sm text-muted-foreground">
                              {customer.phone}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {!showNewCustomerForm && (
                    <Button
                      variant="outline"
                      onClick={() => setShowNewCustomerForm(true)}
                      className="w-full"
                    >
                      <Plus size={16} className="mr-2" />
                      إضافة عميل جديد
                    </Button>
                  )}

                  {showNewCustomerForm && (
                    <div className="space-y-3 p-4 border rounded-md">
                      <h3 className="font-semibold">عميل جديد</h3>
                      <div>
                        <Label htmlFor="new-customer-name">الاسم *</Label>
                        <Input
                          id="new-customer-name"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-customer-phone">الهاتف</Label>
                        <Input
                          id="new-customer-phone"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-customer-address">العنوان</Label>
                        <Input
                          id="new-customer-address"
                          value={newCustomerAddress}
                          onChange={(e) => setNewCustomerAddress(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-customer-email">البريد الإلكتروني</Label>
                        <Input
                          id="new-customer-email"
                          type="email"
                          value={newCustomerEmail}
                          onChange={(e) => setNewCustomerEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddCustomer}>حفظ العميل</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowNewCustomerForm(false);
                            setNewCustomerName("");
                            setNewCustomerPhone("");
                            setNewCustomerAddress("");
                            setNewCustomerEmail("");
                          }}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 border rounded-md bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone}
                        </p>
                      )}
                      {selectedCustomer.address && (
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.address}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      تغيير
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brand Selection */}
          <Card>
            <CardHeader>
              <CardTitle>العلامة التجارية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="brand-select">اختر العلامة التجارية</Label>
                  <Select
                    value={selectedBrand?.id || ""}
                    onValueChange={(value) => {
                      const brand = brands.find((b) => b.id === value);
                      setSelectedBrand(brand || null);
                    }}
                  >
                    <SelectTrigger id="brand-select">
                      <SelectValue placeholder="اختر العلامة التجارية" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBrand && selectedBrand.logo_url && (
                  <div className="flex justify-center p-4 border rounded-md bg-muted/20">
                    <img
                      src={selectedBrand.logo_url}
                      alt={selectedBrand.name}
                      className="max-h-24 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Currency Selection */}
          {selectedBrand && (
            <Card>
              <CardHeader>
                <CardTitle>العملة</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={currency}
                  onValueChange={(value: "IQD" | "USD") => setCurrency(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IQD">دينار عراقي (IQD)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Invoice Items */}
          {selectedBrand && (
            <Card>
              <CardHeader>
                <CardTitle>عناصر الفاتورة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المنتج</TableHead>
                        <TableHead>الرقم التسلسلي</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>المجموع</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.product_id || ""}
                              onValueChange={(value) =>
                                handleProductChange(index, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المنتج">
                                  {item.product_name_snapshot || "اختر المنتج"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              className="border rounded-md px-2 py-1 w-full text-sm"
                              value={item.serial_number}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  "serial_number",
                                  e.target.value
                                )
                              }
                              placeholder="SN / الرقم التسلسلي"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  "unit_price",
                                  e.target.value
                                )
                              }
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              {item.total.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Button variant="outline" onClick={handleAddItem} className="w-full">
                    <Plus size={16} className="mr-2" />
                    إضافة عنصر
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>المجاميع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>المجموع الفرعي:</span>
                    <span className="font-semibold">
                      {calculateSubtotal().toFixed(2)} {currency}
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="shipping-cost">تكلفة الشحن</Label>
                    <Input
                      id="shipping-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                    />
                  </div>

                  <div className="flex justify-between text-2xl font-bold border-t pt-4">
                    <span>المجموع الكلي:</span>
                    <span>
                      {calculateTotal().toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warranty Text */}
          {selectedBrand && (
            <Card>
              <CardHeader>
                <CardTitle>نص الضمان</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={warrantyText}
                  onChange={(e) => setWarrantyText(e.target.value)}
                  rows={5}
                  placeholder="أدخل شروط الضمان..."
                />
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="أدخل أي ملاحظات إضافية..."
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push(`/invoices/${id}`)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التحديثات"}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
