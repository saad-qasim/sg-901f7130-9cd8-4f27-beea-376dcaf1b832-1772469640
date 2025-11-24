import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Head from "next/head";
import { brandService, Brand } from "@/services/brandService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Building2, Upload } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function BrandsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    warranty_default_text: "",
  });

  // Check permissions
  useEffect(() => {
    if (!loading && user) {
      const hasAccess = user.role === 'admin' || user.role === 'manager' || user.can_add_brand;
      if (!hasAccess) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadBrands();
    }
  }, [user]);

  const loadBrands = async () => {
    try {
      const data = await brandService.getAllBrands();
      setBrands(data);
    } catch (error) {
      console.error("Error loading brands:", error);
      alert("فشل تحميل العلامات التجارية!");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      warranty_default_text: "",
    });
    setEditingBrand(null);
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let logoUrl = formData.logo_url;

      if (logoFile) {
        logoUrl = await brandService.uploadLogo(logoFile);
      }

      const brandData = {
        name: formData.name,
        logo_url: logoUrl || null,
        warranty_default_text: formData.warranty_default_text || null,
      };

      if (editingBrand) {
        await brandService.updateBrand(editingBrand.id, brandData);
        alert("تم تحديث العلامة التجارية بنجاح!");
      } else {
        await brandService.createBrand(brandData);
        alert("تم إضافة العلامة التجارية بنجاح!");
      }

      await loadBrands();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving brand:", error);
      alert("فشل حفظ العلامة التجارية!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      logo_url: brand.logo_url || "",
      warranty_default_text: brand.warranty_default_text || "",
    });
    setLogoPreview(brand.logo_url || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه العلامة التجارية؟")) return;

    try {
      await brandService.deleteBrand(id);
      alert("تم حذف العلامة التجارية بنجاح!");
      await loadBrands();
    } catch (error) {
      console.error("Error deleting brand:", error);
      alert("فشل حذف العلامة التجارية!");
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
        <title>العلامات التجارية - Invoice PRO</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Building2 className="h-8 w-8" />
                    إدارة العلامات التجارية
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    إضافة وتعديل العلامات التجارية والضمانات الافتراضية
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      إضافة علامة تجارية
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingBrand ? "تعديل العلامة التجارية" : "إضافة علامة تجارية جديدة"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingBrand ? "قم بتعديل بيانات العلامة التجارية" : "أدخل بيانات العلامة التجارية الجديدة"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">اسم العلامة التجارية *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="مثال: Apple"
                        />
                      </div>

                      <div>
                        <Label htmlFor="logo">الشعار</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="flex-1"
                          />
                          <Upload className="h-5 w-5 text-gray-500" />
                        </div>
                        {logoPreview && (
                          <div className="mt-4">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="max-h-32 object-contain border rounded p-2"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="warranty_default_text">نص الضمان الافتراضي</Label>
                        <Textarea
                          id="warranty_default_text"
                          value={formData.warranty_default_text}
                          onChange={(e) => setFormData({ ...formData, warranty_default_text: e.target.value })}
                          placeholder="نص الضمان الذي سيظهر في الفواتير بشكل افتراضي"
                          rows={5}
                        />
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "جاري الحفظ..." : editingBrand ? "تحديث" : "إضافة"}
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
                      <TableHead>الشعار</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>نص الضمان الافتراضي</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          لا توجد علامات تجارية حتى الآن
                        </TableCell>
                      </TableRow>
                    ) : (
                      brands.map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell>
                            {brand.logo_url ? (
                              <img
                                src={brand.logo_url}
                                alt={brand.name}
                                className="h-12 w-12 object-contain"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {brand.warranty_default_text || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(brand)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(brand.id)}
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
