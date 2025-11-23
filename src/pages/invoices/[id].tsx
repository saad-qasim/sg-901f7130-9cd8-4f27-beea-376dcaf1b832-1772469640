import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { invoiceService, InvoiceWithRelations } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, Edit, CheckCircle2, DollarSign } from "lucide-react";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAsPaid, setMarkingAsPaid] = useState(false);

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

  const handleMarkAsPaid = async () => {
    if (!invoice || !id) return;

    if (!confirm("هل أنت متأكد من أن هذه الفاتورة تم دفعها؟")) {
      return;
    }

    try {
      setMarkingAsPaid(true);
      await invoiceService.markInvoiceAsPaid(id as string);
      
      // إعادة تحميل الفاتورة لعرض الحالة المحدثة
      await loadInvoice(id as string);
      
      alert("✅ تم تحديث حالة الفاتورة إلى مدفوعة بنجاح!");
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      alert("فشل في تحديث حالة الفاتورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setMarkingAsPaid(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;

    try {
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
    return new Date(dateString).toLocaleDateString("ar-IQ", {
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
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>الفاتورة غير موجودة</p>
        <Button onClick={() => router.push("/invoices")} className="mt-4">
          العودة إلى الفواتير
        </Button>
      </div>
    );
  }

  const isPaid = invoice.payment_status === "paid";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        {/* Action Buttons - Hidden when printing */}
        <div className="container mx-auto px-4 mb-6 no-print">
          <BackButton />
          
          {/* Payment Status Display */}
          <div className="flex justify-between items-center mt-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">حالة الدفع:</span>
              {isPaid ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1.5 px-3 py-1">
                  <CheckCircle2 size={14} />
                  مدفوعة
                </Badge>
              ) : (
                <Badge variant="outline" className="border-orange-500 text-orange-600 gap-1.5 px-3 py-1">
                  <DollarSign size={14} />
                  غير مدفوعة
                </Badge>
              )}
              {isPaid && invoice.payment_date && (
                <span className="text-xs text-muted-foreground">
                  تاريخ الدفع: {formatDate(invoice.payment_date)}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {!isPaid && (
              <Button
                onClick={handleMarkAsPaid}
                disabled={markingAsPaid}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 size={16} />
                {markingAsPaid ? "جاري التحديث..." : "تم دفع المبلغ"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/invoices/${id}/edit`)}
              className="gap-2"
            >
              <Edit size={16} />
              تعديل الفاتورة
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="gap-2"
            >
              <Download size={16} />
              تحميل PDF
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer size={16} />
              طباعة
            </Button>
          </div>
        </div>

        {/* Invoice Content - A4 Format */}
        <div id="invoice-content" className="invoice-a4 relative">
          {/* PAID Stamp - Only visible when invoice is paid */}
          {isPaid && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="border-8 border-green-500 rounded-lg px-8 py-4 rotate-[-15deg] opacity-30">
                <span className="text-7xl font-black text-green-500">PAID</span>
              </div>
            </div>
          )}

          {/* Header with Brand Logo */}
          <div className="flex justify-between items-start border-b-2 border-gray-200 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1 text-gray-900">
                {invoice.invoice_title || "فاتورة بيع"}
              </h1>
              <p className="text-xl font-semibold text-primary">
                {invoice.invoice_number}
              </p>
              {/* Payment Status Badge for Print */}
              <div className="mt-2 print-only">
                {isPaid ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full border border-green-300">
                    ✓ مدفوعة
                  </span>
                ) : (
                  <span className="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full border border-orange-300">
                    غير مدفوعة
                  </span>
                )}
              </div>
            </div>
            {invoice.brands?.logo_url && (
              <img
                src={invoice.brands.logo_url}
                alt={invoice.brands.name}
                className="max-h-16 object-contain"
              />
            )}
          </div>

          {/* Company and Customer Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-sm mb-2 text-gray-700">From:</h3>
              <div className="whitespace-pre-line text-xs text-gray-600 leading-relaxed">
                {invoice.company_info_snapshot}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Bill To:</h3>
              <div className="text-xs">
                <p className="font-semibold text-gray-900">{invoice.customers?.name}</p>
                {invoice.customers?.phone && (
                  <p className="text-gray-600">
                    Phone: {invoice.customers.phone}
                  </p>
                )}
                {invoice.customers?.email && (
                  <p className="text-gray-600">
                    Email: {invoice.customers.email}
                  </p>
                )}
                {invoice.customers?.address && (
                  <p className="text-gray-600 mt-1">
                    {invoice.customers.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded mb-6">
            <div>
              <p className="text-xs text-gray-500">Invoice Date</p>
              <p className="font-semibold text-sm">{formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Warranty Until</p>
              <p className="font-semibold text-sm">
                {formatDate(invoice.warranty_end_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Brand</p>
              <p className="font-semibold text-sm">{invoice.brands?.name}</p>
            </div>
          </div>

          {/* Payment Status for Print */}
          {isPaid && invoice.payment_date && (
            <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded print-only">
              <p className="text-xs text-green-800">
                <span className="font-semibold">تاريخ الدفع:</span> {formatDate(invoice.payment_date)}
              </p>
            </div>
          )}

          {/* Invoice Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Items</h3>
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold">Product</TableHead>
                    <TableHead className="text-xs font-semibold">Serial Number</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Qty</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Unit Price</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoice_items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs">
                        {item.product_name_snapshot}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.serial_number}
                      </TableCell>
                      <TableCell className="text-right text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCurrency(item.unit_price, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs">
                        {formatCurrency(item.total, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-semibold">
                  {formatCurrency(invoice.shipping_cost, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-1.5">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Warranty Information */}
          {invoice.warranty_text_snapshot && (
            <div className="border-t-2 border-gray-200 pt-4 mb-4">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Warranty Terms</h3>
              <div className="text-xs text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded leading-relaxed">
                {invoice.warranty_text_snapshot}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t-2 border-gray-200 pt-4 mb-4">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Notes</h3>
              <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                {invoice.notes}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-4 text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              Invoice generated on {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print-only {
            display: block !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </ProtectedRoute>
  );
}
