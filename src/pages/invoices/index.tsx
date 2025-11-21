import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService, InvoiceWithRelations } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Search, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";

type Invoice = Omit<InvoiceWithRelations, "invoice_items">;

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
      setSelectedInvoices(new Set()); // Clear selection when reloading
    } catch (error) {
      console.error("Error loading invoices:", error);
      alert("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If search term is empty or less than 2 characters, reload all invoices
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      loadInvoices();
      return;
    }

    try {
      setSearching(true);
      const results = await invoiceService.searchInvoices(searchTerm.trim());
      setInvoices(results);
      setSelectedInvoices(new Set()); // Clear selection when searching
    } catch (error) {
      console.error("Error searching invoices:", error);
      alert("Failed to search invoices. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    
    // If search is cleared, reload all invoices
    if (!value.trim()) {
      loadInvoices();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(invoices.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleDeleteClick = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    try {
      setDeleting(true);
      await invoiceService.deleteInvoice(invoiceToDelete);
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
      await loadInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("حدث خطأ أثناء حذف الفاتورة، حاول مرة أخرى.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedInvoices.size === 0) {
      alert("لم تقم بتحديد أي فاتورة.");
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await invoiceService.deleteInvoices(Array.from(selectedInvoices));
      setShowBulkDeleteDialog(false);
      await loadInvoices();
    } catch (error) {
      console.error("Error deleting invoices:", error);
      alert("حدث خطأ أثناء حذف الفاتورة، حاول مرة أخرى.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toLocaleString()} IQD`;
  };

  const allSelected = invoices.length > 0 && selectedInvoices.size === invoices.length;
  const someSelected = selectedInvoices.size > 0 && selectedInvoices.size < invoices.length;

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <BackButton />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Invoices</h1>
          <Button
            className="gap-2"
            onClick={() => router.push("/invoices/new")}
          >
            <Plus size={16} />
            New Invoice
          </Button>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <div className="flex-1">
              <Label htmlFor="invoice-search" className="sr-only">
                Search Invoices
              </Label>
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  size={18} 
                />
                <Input
                  id="invoice-search"
                  placeholder="ابحث بالاسم أو رقم الهاتف أو السيريال نمبر"
                  value={searchTerm}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="pl-10"
                  dir="rtl"
                />
              </div>
            </div>
            <Button type="submit" disabled={searching || searchTerm.trim().length < 2}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>
          {searchTerm.trim() && searchTerm.trim().length < 2 && (
            <p className="text-xs text-muted-foreground mt-1">
              Please enter at least 2 characters to search
            </p>
          )}
        </div>

        {/* Bulk Delete Button */}
        {selectedInvoices.size > 0 && (
          <div className="mb-4">
            <Button
              variant="destructive"
              onClick={handleBulkDeleteClick}
              className="gap-2"
            >
              <Trash2 size={16} />
              حذف الفواتير المحددة ({selectedInvoices.size})
            </Button>
          </div>
        )}

        {loading ? (
          <p>Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            {searchTerm.trim() 
              ? `No invoices found matching "${searchTerm}"`
              : "No invoices yet. Create your first invoice to get started!"}
          </p>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                    />
                  </TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.has(invoice.id)}
                        onCheckedChange={(checked) => 
                          handleSelectInvoice(invoice.id, checked as boolean)
                        }
                        aria-label={`Select invoice ${invoice.invoice_number}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>{invoice.customers?.name || "—"}</TableCell>
                    <TableCell>{invoice.brands?.name || "—"}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => router.push(`/invoices/${invoice.id}`)}
                          title="View invoice"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(invoice.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete invoice"
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

        {/* Single Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle dir="rtl">تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription dir="rtl">
                هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? "جاري الحذف..." : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle dir="rtl">تأكيد حذف متعدد</AlertDialogTitle>
              <AlertDialogDescription dir="rtl">
                هل تريد حذف جميع الفواتير المحددة؟ ({selectedInvoices.size} فاتورة)
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteConfirm}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? "جاري الحذف..." : "حذف الكل"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
