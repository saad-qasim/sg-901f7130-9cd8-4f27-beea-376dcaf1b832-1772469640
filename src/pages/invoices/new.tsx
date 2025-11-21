import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService } from "@/services/invoiceService";
import { customerService } from "@/services/customerService";
import { brandService } from "@/services/brandService";
import { productService, ProductWithBrand } from "@/services/productService";
import { companyService } from "@/services/companyService";
import { Database } from "@/types/database";
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

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Brand = Database["public"]["Tables"]["brands"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Step 1: Customer Selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  });

  // Step 2: Brand Selection
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Step 3: Invoice Items
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [items, setItems] = useState<Omit<InvoiceItemInsert, "invoice_id">[]>([]);
  const [currency, setCurrency] = useState<"IQD" | "USD">("IQD");
  
  // Invoice Details
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shippingCost, setShippingCost] = useState(0);
  const [warrantyText, setWarrantyText] = useState("");
  const [notes, setNotes] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");

  useEffect(() => {
    loadCustomers();
    loadBrands();
    loadCompanySettings();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadProductsByBrand(selectedBrand.id);
      setWarrantyText(selectedBrand.warranty_default_text || "");
    }
  }, [selectedBrand]);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadBrands = async () => {
    try {
      const data = await brandService.getAllBrands();
      setBrands(data);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  };

  const loadProductsByBrand = async (brandId: string) => {
    try {
      const data = await productService.getProductsByBrand(brandId);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const settings = await companyService.getCompanySettings();
      if (settings) {
        setCompanyInfo(settings.company_info_text || "");
        setCurrency(settings.default_currency as "IQD" | "USD");
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCustomer = await customerService.createCustomer(newCustomerForm);
      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(newCustomer);
      setShowCustomerDialog(false);
      setNewCustomerForm({ name: "", phone: "", address: "", email: "" });
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to create customer");
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        product_name_snapshot: "",
        serial_number: "",
        quantity: 1,
        unit_price: 0,
        total: 0,
      },
    ]);
  };

  const updateItem = (index: number, field: keyof Omit<InvoiceItemInsert, "invoice_id">, value: any) => {
    const updatedItems = [...items];
    const currentItem = { ...updatedItems[index] };
    
    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) {
        currentItem.product_id = value;
        currentItem.product_name_snapshot = product.name;
        currentItem.unit_price =
          currency === "IQD" ? product.unit_price_iqd ?? 0 : product.unit_price_usd ?? 0;
        
        // Update warranty text if product has specific warranty
        if (product.warranty_text) {
          setWarrantyText(product.warranty_text);
        }
      }
    } else {
      (currentItem as any)[field] = value;
    }

    // Recalculate total
    currentItem.total = (currentItem.quantity || 1) * (currentItem.unit_price || 0);
    updatedItems[index] = currentItem;
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost;
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    return `INV-${dateStr}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }
    if (!selectedBrand) {
      alert("Please select a brand");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.product_id || !item.serial_number) {
        alert("All items must have a product and serial number");
        return;
      }
    }

    try {
      setLoading(true);

      const invoiceNumber = generateInvoiceNumber();
      const warrantyEndDate = new Date(invoiceDate);
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 2);

      const invoiceData = {
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        warranty_end_date: warrantyEndDate.toISOString().split("T")[0],
        customer_id: selectedCustomer.id,
        brand_id: selectedBrand.id,
        company_info_snapshot: companyInfo,
        warranty_text_snapshot: warrantyText,
        currency,
        subtotal: calculateSubtotal(),
        shipping_cost: shippingCost,
        total: calculateTotal(),
        notes,
        created_by: "system", // TODO: Replace with actual user ID when auth is implemented
      };

      // The `items` state now directly matches the required insert type
      const { id } = await invoiceService.createInvoiceWithItems({
        invoice: invoiceData,
        items: items,
      });

      router.push(`/invoices/${id}`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Select Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="customer-search">Search Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="customer-search"
                    placeholder="Search by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomerDialog(true)}
                >
                  <Plus size={16} className="mr-2" />
                  New Customer
                </Button>
              </div>
            </div>

            {selectedCustomer ? (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {selectedCustomer.phone}
                      </p>
                    )}
                    {selectedCustomer.email && (
                      <p className="text-sm text-muted-foreground">
                        Email: {selectedCustomer.email}
                      </p>
                    )}
                    {selectedCustomer.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedCustomer.address}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    No customers found
                  </p>
                ) : (
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium">{customer.name}</p>
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground">
                            {customer.phone}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Brand Selection */}
        <Card>
          <CardHeader>
            <CardTitle>2. Select Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Select
                value={selectedBrand?.id || ""}
                onValueChange={(value) => {
                  const brand = brands.find((b) => b.id === value);
                  setSelectedBrand(brand || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
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
              <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                <img
                  src={selectedBrand.logo_url}
                  alt={selectedBrand.name}
                  className="max-h-24 object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Invoice Items */}
        {selectedBrand && (
          <Card>
            <CardHeader>
              <CardTitle>3. Add Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={currency}
                    onValueChange={(value: "IQD" | "USD") => {
                      setCurrency(value);
                      // Update all item prices when currency changes
                      const updatedItems = items.map((item) => {
                        const product = products.find((p) => p.id === item.product_id);
                        if (product) {
                          const newPrice =
                            value === "IQD"
                              ? product.unit_price_iqd ?? 0
                              : product.unit_price_usd ?? 0;
                          return {
                            ...item,
                            unit_price: newPrice,
                            total: (item.quantity || 1) * newPrice,
                          };
                        }
                        return item;
                      });
                      setItems(updatedItems);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">Iraqi Dinar (IQD)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Product</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[120px]">Unit Price</TableHead>
                      <TableHead className="w-[120px]">Total</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product_id || ""}
                            onValueChange={(value) =>
                              updateItem(index, "product_id", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
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
                            value={item.serial_number || ""}
                            onChange={(e) =>
                              updateItem(index, "serial_number", e.target.value)
                            }
                            placeholder="Serial #"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseInt(e.target.value) || 1)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price || 0}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currency === "USD"
                            ? `$${(item.total || 0).toFixed(2)}`
                            : `${(item.total || 0).toLocaleString()} IQD`}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button type="button" variant="outline" onClick={addItem}>
                <Plus size={16} className="mr-2" />
                Add Item
              </Button>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {currency === "USD"
                      ? `$${calculateSubtotal().toFixed(2)}`
                      : `${calculateSubtotal().toLocaleString()} IQD`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="shipping">Shipping Cost:</Label>
                  <Input
                    id="shipping"
                    type="number"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) =>
                      setShippingCost(parseFloat(e.target.value) || 0)
                    }
                    className="w-32 text-right"
                  />
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Total:</span>
                  <span>
                    {currency === "USD"
                      ? `$${calculateTotal().toFixed(2)}`
                      : `${calculateTotal().toLocaleString()} IQD`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Details */}
        {selectedBrand && items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>4. Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-info">Company Information</Label>
                <Textarea
                  id="company-info"
                  value={companyInfo}
                  onChange={(e) => setCompanyInfo(e.target.value)}
                  rows={3}
                  placeholder="Company name, address, contact info..."
                />
              </div>
              <div>
                <Label htmlFor="warranty">Warranty Terms</Label>
                <Textarea
                  id="warranty"
                  value={warrantyText}
                  onChange={(e) => setWarrantyText(e.target.value)}
                  rows={4}
                  placeholder="Warranty terms and conditions..."
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes for this invoice..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/invoices")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-32">
            {loading ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>

      {/* New Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <Label htmlFor="new-customer-name">Name *</Label>
              <Input
                id="new-customer-name"
                value={newCustomerForm.name}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="new-customer-phone">Phone</Label>
              <Input
                id="new-customer-phone"
                value={newCustomerForm.phone}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="new-customer-email">Email</Label>
              <Input
                id="new-customer-email"
                type="email"
                value={newCustomerForm.email}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="new-customer-address">Address</Label>
              <Textarea
                id="new-customer-address"
                value={newCustomerForm.address}
                onChange={(e) =>
                  setNewCustomerForm({
                    ...newCustomerForm,
                    address: e.target.value,
                  })
                }
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomerDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Customer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
