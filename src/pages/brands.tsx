import { useState, useEffect, ChangeEvent } from "react";
import { brandService } from "@/services/brandService";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import { BackButton } from "@/components/BackButton";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type BrandInsert = Database["public"]["Tables"]["brands"]["Insert"];

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState<BrandInsert>({
    name: "",
    logo_url: "",
    warranty_default_text: "",
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const data = await brandService.getAllBrands();
      setBrands(data);
    } catch (error) {
      console.error("Error loading brands:", error);
      alert("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("brand-logos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("brand-logos")
        .getPublicUrl(filePath);

      // Update form data with the public URL
      setFormData({ ...formData, logo_url: publicUrl });
      setLogoPreview(publicUrl);

      alert("Logo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: "" });
    setLogoPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await brandService.updateBrand(editingBrand.id, formData);
      } else {
        await brandService.createBrand(formData);
      }
      setDialogOpen(false);
      resetForm();
      loadBrands();
    } catch (error) {
      console.error("Error saving brand:", error);
      alert("Failed to save brand");
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
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    try {
      await brandService.deleteBrand(id);
      loadBrands();
    } catch (error) {
      console.error("Error deleting brand:", error);
      alert("Failed to delete brand");
    }
  };

  const resetForm = () => {
    setEditingBrand(null);
    setFormData({
      name: "",
      logo_url: "",
      warranty_default_text: "",
    });
    setLogoPreview("");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Brands</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? "Edit Brand" : "Add New Brand"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Brand Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Logo Upload Section */}
              <div>
                <Label>Brand Logo</Label>
                <div className="space-y-4">
                  {/* Preview Section */}
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-32 w-32 object-contain border rounded-lg p-2"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveLogo}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                      <Upload size={24} />
                    </div>
                  )}

                  {/* Upload Button */}
                  <div>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Label htmlFor="logo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={uploading}
                        onClick={() => document.getElementById("logo-upload")?.click()}
                      >
                        <Upload size={16} />
                        {uploading ? "Uploading..." : "Upload Logo"}
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: JPG, PNG, GIF, SVG (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="warranty">Default Warranty Text</Label>
                <Textarea
                  id="warranty"
                  value={formData.warranty_default_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warranty_default_text: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Enter default warranty terms..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {editingBrand ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Loading brands...</p>
      ) : brands.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          No brands yet. Add your first brand to get started!
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Warranty Text</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs">
                        No Logo
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {brand.warranty_default_text || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(brand)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(brand.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
