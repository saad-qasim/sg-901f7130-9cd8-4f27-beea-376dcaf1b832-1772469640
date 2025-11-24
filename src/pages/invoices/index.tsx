import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Head from "next/head";
import { invoiceService, InvoiceWithRelations } from "@/services/invoiceService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import BackButton from "@/components/BackButton";

export default function InvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithRelations[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = invoices.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.brands?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoices);
    }
  }, [searchTerm, invoices]);

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error("Error loading invoices:", error);
      alert("فشل تحميل الفواتير!");
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map((inv) => inv.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.length === 0) {
      alert("الرجاء تحديد فاتورة واحدة على الأقل للحذف");
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف ${selectedInvoices.length} فاتورة؟`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedInvoices.map((id) => invoiceService.deleteInvoice(id))
      );
      alert("تم حذف الفواتير المحددة بنجاح!");
      setSelectedInvoices([]);
      await loadInvoices();
    } catch (error) {
      console.error("Error deleting invoices:", error);
      alert("فشل حذف بعض الفواتير!");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;

    setIsDeleting(true);
    try {
      await invoiceService.deleteInvoice(id);
      alert("تم حذف الفاتورة بنجاح!");
      await loadInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("فشل حذف الفاتورة!");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  // Check if user can delete invoices
  const canDeleteInvoices = user.role === 'admin' || user.role === 'manager' || user.can_delete_invoices;

  return (
    <>
      <Head>
        <title>الفواتير - Invoice PRO</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <Card className="mt-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <FileText className="h-8 w-8" />
                    إدارة الفواتير
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    عرض وإدارة جميع الفواتير
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {canDeleteInvoices && selectedInvoices.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      حذف المحدد ({selectedInvoices.length})
                    </Button>
                  )}
                  <Button onClick={() => router.push("/invoices/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    فاتورة جديدة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث برقم الفاتورة، اسم العميل، أو العلامة التجارية..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Invoices Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canDeleteInvoices && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredInvoices.length > 0 &&
                              selectedInvoices.length === filteredInvoices.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>العلامة التجارية</TableHead>
                      <TableHead>العملة</TableHead>
                      <TableHead className="text-left" dir="ltr">المبلغ الإجمالي</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canDeleteInvoices ? 8 : 7}
                          className="text-center text-gray-500 py-8"
                        >
                          {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد فواتير حتى الآن"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          {canDeleteInvoices && (
                            <TableCell>
                              <Checkbox
                                checked={selectedInvoices.includes(invoice.id)}
                                onCheckedChange={() => handleSelectInvoice(invoice.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.invoice_date), "dd/MM/yyyy", {
                              locale: ar,
                            })}
                          </TableCell>
                          <TableCell>{invoice.customers?.name || "غير محدد"}</TableCell>
                          <TableCell>{invoice.brands?.name || "غير محدد"}</TableCell>
                          <TableCell>{invoice.currency}</TableCell>
                          <TableCell className="text-left font-medium" dir="ltr">
                            {invoice.currency === "IQD"
                              ? invoice.total.toLocaleString()
                              : `$${invoice.total.toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/invoices/${invoice.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {canDeleteInvoices && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSingle(invoice.id)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
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
