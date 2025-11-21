import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";

type CompanySettings = Database["public"]["Tables"]["company_settings"]["Row"];

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanySettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanySettings | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    company_info_text: "",
    default_currency: "IQD" as "IQD" | "USD",
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllCompanies();
      setCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
      alert("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (company?: CompanySettings) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        company_name: company.company_name || "",
        company_info_text: company.company_info_text || "",
        default_currency: (company.default_currency as "IQD" | "USD") || "IQD",
      });
    } else {
      setEditingCompany(null);
      setFormData({
        company_name: "",
        company_info_text: "",
        default_currency: "IQD",
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCompany(null);
    setFormData({
      company_name: "",
      company_info_text: "",
      default_currency: "IQD",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      alert("Company name is required");
      return;
    }

    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, formData);
      } else {
        await companyService.createCompany(formData);
      }
      await loadCompanies();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving company:", error);
      alert("Failed to save company");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) {
      return;
    }

    try {
      await companyService.deleteCompany(id);
      await loadCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <BackButton />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Company Profiles</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus size={16} className="mr-2" />
          إضافة شركة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : companies.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No companies found. Click "إضافة شركة جديدة" to add one.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Default Currency</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {company.company_name}
                      </TableCell>
                      <TableCell>{company.default_currency}</TableCell>
                      <TableCell>{formatDate(company.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(company)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(company.id)}
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
        </CardContent>
      </Card>

      {/* Add/Edit Company Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Edit Company" : "Add New Company"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <Label htmlFor="company-info">
                Company Information
                <span className="text-sm text-muted-foreground ml-2">
                  (Used as invoice header)
                </span>
              </Label>
              <Textarea
                id="company-info"
                value={formData.company_info_text}
                onChange={(e) =>
                  setFormData({ ...formData, company_info_text: e.target.value })
                }
                rows={6}
                placeholder="معلومات الشركة - الاسم، العنوان، رقم الهاتف، البريد الإلكتروني..."
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="default-currency">Default Currency</Label>
              <Select
                value={formData.default_currency}
                onValueChange={(value: "IQD" | "USD") =>
                  setFormData({ ...formData, default_currency: value })
                }
              >
                <SelectTrigger id="default-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IQD">Iraqi Dinar (IQD)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCompany ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
