import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService, InvoiceWithRelations } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";

type Invoice = Omit<InvoiceWithRelations, "invoice_items">;

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

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

      {loading ? (
        <p>Loading invoices...</p>
      ) : invoices.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          No invoices yet. Create your first invoice to get started!
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
