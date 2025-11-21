import { useState, useEffect } from "react";
import { productService, ProductWithBrand } from "@/services/productService";
import { brandService } from "@/services/brandService";
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
import { Pencil, Trash2, Plus, Edit } from "lucide-react";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithBrand | null>(null);
  const [formData, setFormData] = useState<ProductInsert>({
    brand_id: "",
    name: "",
    description: "",
    model_number: "",
    warranty_text: "",
    unit_price_iqd: 0,
    unit_price_usd: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, brandsData] = await Promise.all([
        productService.getAllProducts(),
        brandService.getAllBrands(),
      ]);
      setProducts(productsData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
      } else {
        await productService.createProduct(formData);
      }
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  const handleEdit = (product: ProductWithBrand) => {
    setEditingProduct(product);
    setFormData({
      brand_id: product.brand_id,
      name: product.name,
      description: product.description || "",
      model_number: product.model_number || "",
      warranty_text: product.warranty_text || "",
      unit_price_iqd: product.unit_price_iqd || 0,
      unit_price_usd: product.unit_price_usd || 0,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productService.deleteProduct(id);
      loadData();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      brand_id: "",
      name: "",
      description: "",
      model_number: "",
      warranty_text: "",
      unit_price_iqd: 0,
      unit_price_usd: 0,
    });
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Products</h1>
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="brand">Brand *</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, brand_id: value })
                    }
                    required
                  >
                    <SelectTrigger id="brand">
                      <SelectValue placeholder="Select brand" />
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
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model Number</Label>
                  <Input
                    id="model"
                    value={formData.model_number}
                    onChange={(e) =>
                      setFormData({ ...formData, model_number: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_iqd">Unit Price (IQD)</Label>
                    <Input
                      id="price_iqd"
                      type="number"
                      step="0.01"
                      value={formData.unit_price_iqd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unit_price_iqd: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_usd">Unit Price (USD)</Label>
                    <Input
                      id="price_usd"
                      type="number"
                      step="0.01"
                      value={formData.unit_price_usd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unit_price_usd: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="warranty">Warranty Text</Label>
                  <Textarea
                    id="warranty"
                    value={formData.warranty_text}
                    onChange={(e) =>
                      setFormData({ ...formData, warranty_text: e.target.value })
                    }
                    rows={3}
                    placeholder="Optional product-specific warranty text..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No products yet. Add your first product to get started!
          </p>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Price (IQD)</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.brands?.name || "—"}</TableCell>
                    <TableCell>{product.model_number || "—"}</TableCell>
                    <TableCell>
                      {product.unit_price_iqd
                        ? product.unit_price_iqd.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {product.unit_price_usd
                        ? `$${product.unit_price_usd.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(product.id)}
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
    </ProtectedRoute>
  );
}
