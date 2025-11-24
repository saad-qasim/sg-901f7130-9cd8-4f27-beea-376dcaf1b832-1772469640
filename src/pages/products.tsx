import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Head from "next/head";
import { productService, ProductWithBrand } from "@/services/productService";
import { brandService, Brand } from "@/services/brandService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Package } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function ProductsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithBrand | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    brand_id: "",
    description: "",
    model_number: "",
    warranty_text: "",
    unit_price_iqd: "",
    unit_price_usd: "",
  });

  // Check permissions
  useEffect(() => {
    if (!loading && user) {
      const hasAccess = user.role === 'admin' || user.role === 'manager' || user.can_add_product;
      if (!hasAccess) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadBrands();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      alert("فشل تحميل المنتجات!");
    }
  };

  const loadBrands = async () => {
    try {
      const data = await brandService.getBrands();
      setBrands(data);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brand_id: "",
      description: "",
      model_number: "",
      warranty_text: "",
      unit_price_iqd: "",
      unit_price_usd: "",
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData = {
        name: formData.name,
        brand_id: formData.brand_id,
        description: formData.description || null,
        model_number: formData.model_number || null,
        warranty_text: formData.warranty_text || null,
        unit_price_iqd: parseFloat(formData.unit_price_iqd) || 0,
        unit_price_usd: parseFloat(formData.unit_price_usd) || 0,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
        alert("تم تحديث المنتج بنجاح!");
      } else {
        await productService.createProduct(productData);
        alert("تم إضافة المنتج بنجاح!");
      }

      await loadProducts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("فشل حفظ المنتج!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: ProductWithBrand) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand_id: product.brand_id,
      description: product.description || "",
      model_number: product.model_number || "",
      warranty_text: product.warranty_text || "",
      unit_price_iqd: product.unit_price_iqd.toString(),
      unit_price_usd: product.unit_price_usd.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    try {
      await productService.deleteProduct(id);
      alert("تم حذف المنتج بنجاح!");
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("فشل حذف المنتج!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>المنتجات - Invoice PRO</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Package className="h-8 w-8" />
                    إدارة المنتجات
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    إضافة وتعديل المنتجات وأسعارها
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      إضافة منتج جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingProduct ? "قم بتعديل بيانات المنتج" : "أدخل بيانات المنتج الجديد"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="brand_id">العلامة التجارية *</Label>
                        <Select
                          value={formData.brand_id}
                          onValueChange={(value) => setFormData({ ...formData, brand_id: value })}
                          required
                        >
                          <SelectTrigger>
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

                      <div>
                        <Label htmlFor="name">اسم المنتج *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="مثال: هاتف iPhone 14 Pro"
                        />
                      </div>

                      <div>
                        <Label htmlFor="model_number">رقم الموديل</Label>
                        <Input
                          id="model_number"
                          value={formData.model_number}
                          onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                          placeholder="مثال: A2890"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">الوصف</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="وصف المنتج"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="unit_price_iqd">السعر (دينار عراقي)</Label>
                          <Input
                            id="unit_price_iqd"
                            type="number"
                            step="0.01"
                            value={formData.unit_price_iqd}
                            onChange={(e) => setFormData({ ...formData, unit_price_iqd: e.target.value })}
                            placeholder="0.00"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit_price_usd">السعر (دولار أمريكي)</Label>
                          <Input
                            id="unit_price_usd"
                            type="number"
                            step="0.01"
                            value={formData.unit_price_usd}
                            onChange={(e) => setFormData({ ...formData, unit_price_usd: e.target.value })}
                            placeholder="0.00"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="warranty_text">نص الضمان (اختياري)</Label>
                        <Textarea
                          id="warranty_text"
                          value={formData.warranty_text}
                          onChange={(e) => setFormData({ ...formData, warranty_text: e.target.value })}
                          placeholder="إذا كان فارغاً، سيتم استخدام نص الضمان الافتراضي للعلامة التجارية"
                          rows={3}
                        />
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "جاري الحفظ..." : editingProduct ? "تحديث" : "إضافة"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>العلامة التجارية</TableHead>
                      <TableHead>رقم الموديل</TableHead>
                      <TableHead className="text-left" dir="ltr">السعر (IQD)</TableHead>
                      <TableHead className="text-left" dir="ltr">السعر (USD)</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          لا توجد منتجات حتى الآن
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.brands?.name || "غير محدد"}</TableCell>
                          <TableCell>{product.model_number || "-"}</TableCell>
                          <TableCell className="text-left" dir="ltr">
                            {product.unit_price_iqd.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-left" dir="ltr">
                            {product.unit_price_usd.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
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
      </div>
    </>
  );
}
