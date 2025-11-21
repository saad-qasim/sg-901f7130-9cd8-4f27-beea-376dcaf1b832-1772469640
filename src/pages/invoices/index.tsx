import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService, InvoiceWithRelations } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Search } from "lucide-react";
import { BackButton } from "@/components/BackButton";

type Invoice = Omit<InvoiceWithRelations, "invoice_items">;

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
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

  return (
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
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                    >
                      <Eye size={16} />
                    </Button>
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
