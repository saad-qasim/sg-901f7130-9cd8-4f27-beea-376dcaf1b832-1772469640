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
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, Edit, ArrowLeft } from "lucide-react";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { profile } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract permissions
  const canEdit = profile?.can_edit_invoices ?? false;
  const canDelete = profile?.can_delete_invoices ?? false;

  useEffect(() => {
    if (id && typeof id === "string") {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error("Error loading invoice:", error);
      alert("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // Using html2pdf.js library for client-side PDF generation
    const element = document.getElementById("invoice-content");
    if (!element) return;

    try {
      // Dynamically import html2pdf
      const html2pdf = (await import("html2pdf.js")).default;
      
      const opt = {
        margin: 10,
        filename: `${invoice?.invoice_number || "invoice"}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as "portrait" | "landscape" },
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try printing instead.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toLocaleString()} IQD`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Invoice not found</p>
        <Button onClick={() => router.push("/invoices")} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <>
        {/* Action Buttons - Hidden when printing */}
        <div className="container mx-auto py-4 px-4 print:hidden">
          <BackButton />
          <div className="flex justify-end gap-2 mt-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => router.push(`/invoices/${id}/edit`)}
                className="gap-2"
              >
                <Edit size={16} />
                Edit Invoice
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="gap-2"
            >
              <Download size={16} />
              Download PDF
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer size={16} />
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Content - Optimized for printing */}
        <div
          id="invoice-content"
          className="container mx-auto py-8 px-4 max-w-4xl bg-white"
        >
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-8">
              {/* Header with Brand Logo */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
                  <p className="text-2xl font-semibold text-primary">
                    {invoice.invoice_number}
                  </p>
                </div>
                {invoice.brands?.logo_url && (
                  <img
                    src={invoice.brands.logo_url}
                    alt={invoice.brands.name}
                    className="max-h-20 object-contain"
                  />
                )}
              </div>

              {/* Company and Customer Info */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-2">From:</h3>
                  <div className="whitespace-pre-line text-sm text-muted-foreground">
                    {invoice.company_info_snapshot}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
                  <div className="text-sm">
                    <p className="font-semibold">{invoice.customers?.name}</p>
                    {invoice.customers?.phone && (
                      <p className="text-muted-foreground">
                        Phone: {invoice.customers.phone}
                      </p>
                    )}
                    {invoice.customers?.email && (
                      <p className="text-muted-foreground">
                        Email: {invoice.customers.email}
                      </p>
                    )}
                    {invoice.customers?.address && (
                      <p className="text-muted-foreground mt-1">
                        {invoice.customers.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="font-semibold">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warranty Until</p>
                  <p className="font-semibold">
                    {formatDate(invoice.warranty_end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="font-semibold">{invoice.brands?.name}</p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.invoice_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product_name_snapshot}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.serial_number}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.total, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Shipping:</span>
                    <span className="font-semibold">
                      {formatCurrency(invoice.shipping_cost, invoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Warranty Information */}
              {invoice.warranty_text_snapshot && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-2">Warranty Terms</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line bg-muted/30 p-4 rounded-lg">
                    {invoice.warranty_text_snapshot}
                  </div>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-2">Notes</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    {invoice.notes}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-6 text-center text-sm text-muted-foreground">
                <p>Thank you for your business!</p>
                <p className="mt-1">
                  Invoice generated on {formatDate(invoice.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body {
              background: white;
            }
            @page {
              margin: 0.5cm;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
