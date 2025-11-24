import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, DollarSign, FileText, Printer, Package, CheckCircle, XCircle, Banknote, AlertCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total: number;
  payment_status: string;
  customers: {
    name: string;
  } | null;
  brands: {
    name: string;
  } | null;
}

interface ReportStats {
  totalInvoices: number;
  totalSales: number;
  totalProductsSold: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  paidAmount: number;
  unpaidAmount: number;
  topProduct: {
    name: string;
    quantity: number;
  } | null;
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalInvoices: 0,
    totalSales: 0,
    totalProductsSold: 0,
    paidInvoicesCount: 0,
    unpaidInvoicesCount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    topProduct: null,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // القيم الافتراضية للفلاتر: اليوم - 30 يوم إلى اليوم
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // 1. جلب جميع الفواتير ضمن الفترة بدون فلتر الحالة (للحسابات الشاملة)
      const { data: allInvoicesData, error: allInvoicesError } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          invoice_date,
          total,
          payment_status,
          customers (
            name
          ),
          brands (
            name
          )
        `)
        .gte("invoice_date", startDate)
        .lte("invoice_date", endDate)
        .order("invoice_date", { ascending: false });

      if (allInvoicesError) {
        console.error("Error loading all invoices:", allInvoicesError);
        throw allInvoicesError;
      }

      // 2. حساب إجمالي المبالغ المدفوعة وغير المدفوعة من جميع الفواتير
      const paidAmount = (allInvoicesData || [])
        .filter(inv => inv.payment_status === "paid")
        .reduce((sum, inv) => sum + (inv.total ?? 0), 0);

      const unpaidAmount = (allInvoicesData || [])
        .filter(inv => inv.payment_status === "unpaid")
        .reduce((sum, inv) => sum + (inv.total ?? 0), 0);

      const paidInvoicesCount = (allInvoicesData || []).filter(inv => inv.payment_status === "paid").length;
      const unpaidInvoicesCount = (allInvoicesData || []).filter(inv => inv.payment_status === "unpaid").length;

      // 3. تطبيق فلتر الحالة للعرض في الجدول وإحصائيات محددة
      let filteredInvoices = allInvoicesData || [];
      if (statusFilter === "paid") {
        filteredInvoices = filteredInvoices.filter(inv => inv.payment_status === "paid");
      } else if (statusFilter === "unpaid") {
        filteredInvoices = filteredInvoices.filter(inv => inv.payment_status === "unpaid");
      }

      setInvoices(filteredInvoices);

      // 4. جلب عناصر الفواتير مع المنتجات (باستخدام نفس الفلاتر)
      let itemsQuery = supabase
        .from("invoice_items")
        .select(`
          id,
          invoice_id,
          product_id,
          quantity,
          total,
          invoices!inner (
            invoice_date,
            payment_status
          ),
          products (
            name
          )
        `)
        .gte("invoices.invoice_date", startDate)
        .lte("invoices.invoice_date", endDate);

      // إضافة فلتر حالة الدفع للعناصر
      if (statusFilter === "paid") {
        itemsQuery = itemsQuery.eq("invoices.payment_status", "paid");
      } else if (statusFilter === "unpaid") {
        itemsQuery = itemsQuery.eq("invoices.payment_status", "unpaid");
      }

      const { data: itemsData, error: itemsError } = await itemsQuery;

      if (itemsError) {
        console.error("Error loading items:", itemsError);
        throw itemsError;
      }

      // 5. حساب الإحصائيات بناءً على البيانات المفلترة
      const totalInvoices = filteredInvoices.length;
      const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalProductsSold = itemsData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      // 6. حساب أفضل منتج (الأعلى مبيعًا)
      const productSales: { [key: string]: { name: string; quantity: number } } = {};

      itemsData?.forEach((item) => {
        if (item.product_id && item.products?.name) {
          const productId = item.product_id;
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.products.name,
              quantity: 0,
            };
          }
          productSales[productId].quantity += item.quantity || 0;
        }
      });

      // ترتيب المنتجات حسب الكمية واختيار الأعلى
      const sortedProducts = Object.values(productSales).sort(
        (a, b) => b.quantity - a.quantity
      );
      const topProduct = sortedProducts.length > 0 ? sortedProducts[0] : null;

      setStats({
        totalInvoices,
        totalSales,
        totalProductsSold,
        paidInvoicesCount,
        unpaidInvoicesCount,
        paidAmount,
        unpaidAmount,
        topProduct,
      });
    } catch (error) {
      console.error("Error loading report data:", error);
      alert("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadReportData();
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} IQD`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <>
        <Head>
          <title>إحصائيات المبيعات - Invoice PRO</title>
          <meta name="description" content="عرض تقارير وإحصائيات المبيعات" />
        </Head>

        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto px-4 py-8">
            <div className="no-print mb-6 flex items-center gap-3">
              <HomeButton />
              <BackButton />
            </div>
            
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8 space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  إحصائيات المبيعات
                </h1>
                <p className="text-lg text-muted-foreground">
                  تقارير وإحصائيات شاملة عن المبيعات والإيرادات
                </p>
              </div>

              {/* Filters Section */}
              <Card className="mb-8 border-2 no-print">
                <CardHeader>
                  <CardTitle className="text-right">تصفية البيانات</CardTitle>
                  <CardDescription className="text-right">
                    اختر الفترة الزمنية وحالة الدفع لعرض الإحصائيات
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label htmlFor="start-date" className="text-right block mb-2">
                        من تاريخ
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-right block mb-2">
                        إلى تاريخ
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status-filter" className="text-right block mb-2">
                        حالة الفواتير
                      </Label>
                      <Select
                        value={statusFilter}
                        onValueChange={(value: "all" | "paid" | "unpaid") => setStatusFilter(value)}
                      >
                        <SelectTrigger id="status-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="paid">مدفوعة فقط</SelectItem>
                          <SelectItem value="unpaid">غير مدفوعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleRefresh} disabled={loading} className="flex-1">
                        {loading ? "جاري التحميل..." : "تحديث الإحصائيات"}
                      </Button>
                      <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="gap-2"
                        disabled={loading}
                      >
                        <Printer size={16} />
                        طباعة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Range Display (for print) */}
              <div className="print-only mb-4 text-center text-sm text-muted-foreground">
                <p>الفترة: من {formatDate(startDate)} إلى {formatDate(endDate)}</p>
                <p>
                  حالة الفواتير: {statusFilter === "all" ? "الكل" : statusFilter === "paid" ? "مدفوعة فقط" : "غير مدفوعة"}
                </p>
              </div>

              {/* Stats Cards */}
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">جاري تحميل البيانات...</p>
                </div>
              ) : (
                <>
                  {/* Primary Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Invoices */}
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            إجمالي الفواتير
                          </CardTitle>
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {stats.totalInvoices}
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          {statusFilter === "all" && "فاتورة في الفترة"}
                          {statusFilter === "paid" && "فاتورة مدفوعة"}
                          {statusFilter === "unpaid" && "فاتورة غير مدفوعة"}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Total Sales */}
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                            إجمالي المبيعات
                          </CardTitle>
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {formatCurrency(stats.totalSales)}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          {statusFilter === "all" && "مجموع جميع الفواتير"}
                          {statusFilter === "paid" && "مجموع الفواتير المدفوعة"}
                          {statusFilter === "unpaid" && "مجموع الفواتير غير المدفوعة"}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Paid Invoices Count */}
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            الفواتير المدفوعة
                          </CardTitle>
                          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                          {stats.paidInvoicesCount}
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                          فاتورة مدفوعة
                        </p>
                      </CardContent>
                    </Card>

                    {/* Unpaid Invoices Count */}
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                            الفواتير غير المدفوعة
                          </CardTitle>
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                          {stats.unpaidInvoicesCount}
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          فاتورة غير مدفوعة
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Amount Stats Row - NEW CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Total Paid Amount */}
                    <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30 border-2 border-teal-200 dark:border-teal-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">
                            إجمالي المدفوع
                          </CardTitle>
                          <Banknote className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                          {formatCurrency(stats.paidAmount)}
                        </div>
                        <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                          مجموع المبالغ المدفوعة في الفترة
                        </p>
                      </CardContent>
                    </Card>

                    {/* Total Unpaid Amount */}
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border-2 border-amber-200 dark:border-amber-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            إجمالي غير المدفوع
                          </CardTitle>
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                          {formatCurrency(stats.unpaidAmount)}
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          المبالغ المستحقة في الفترة
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Secondary Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Total Products Sold */}
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-2 border-purple-200 dark:border-purple-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            عدد المنتجات المباعة
                          </CardTitle>
                          <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                          {stats.totalProductsSold}
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                          قطعة مباعة
                        </p>
                      </CardContent>
                    </Card>

                    {/* Top Product */}
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-2 border-orange-200 dark:border-orange-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            أفضل منتج
                          </CardTitle>
                          <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        {stats.topProduct ? (
                          <>
                            <div className="text-lg font-bold text-orange-900 dark:text-orange-100 truncate">
                              {stats.topProduct.name}
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                              {stats.topProduct.quantity} قطعة مباعة
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                              ---
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                              لا توجد بيانات
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Invoices Table */}
                  <Card className="border-2 mb-8">
                    <CardHeader>
                      <CardTitle className="text-2xl text-right">قائمة الفواتير</CardTitle>
                      <CardDescription className="text-right">
                        جميع الفواتير في الفترة المحددة
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          لا توجد فواتير في الفترة المحددة
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">رقم الفاتورة</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">العميل</TableHead>
                                <TableHead className="text-right">العلامة التجارية</TableHead>
                                <TableHead className="text-right">المبلغ</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                  <TableCell className="font-medium">
                                    {invoice.invoice_number}
                                  </TableCell>
                                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                                  <TableCell>{invoice.customers?.name || "---"}</TableCell>
                                  <TableCell>{invoice.brands?.name || "---"}</TableCell>
                                  <TableCell className="font-semibold">
                                    {formatCurrency(invoice.total)}
                                  </TableCell>
                                  <TableCell>
                                    {invoice.payment_status === "paid" ? (
                                      <span className="text-green-600 font-medium">مدفوعة</span>
                                    ) : (
                                      <span className="text-red-600 font-medium">غير مدفوعة</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Summary Card */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-2xl text-right">ملخص التقرير</CardTitle>
                      <CardDescription className="text-right">
                        نظرة شاملة على أداء المبيعات في الفترة المحددة
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">الفترة الزمنية:</span>
                          <span className="font-semibold">
                            {formatDate(startDate)} - {formatDate(endDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">فلتر الحالة:</span>
                          <span className="font-semibold">
                            {statusFilter === "all" && "جميع الفواتير"}
                            {statusFilter === "paid" && "الفواتير المدفوعة فقط"}
                            {statusFilter === "unpaid" && "الفواتير غير المدفوعة فقط"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">عدد الفواتير (مفلترة):</span>
                          <span className="font-semibold text-blue-600">
                            {stats.totalInvoices} فاتورة
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">إجمالي المبيعات (مفلترة):</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(stats.totalSales)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">الفواتير المدفوعة (كامل الفترة):</span>
                          <span className="font-semibold text-emerald-600">
                            {stats.paidInvoicesCount} فاتورة
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">الفواتير غير المدفوعة (كامل الفترة):</span>
                          <span className="font-semibold text-red-600">
                            {stats.unpaidInvoicesCount} فاتورة
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">إجمالي المبالغ المدفوعة:</span>
                          <span className="font-semibold text-teal-600">
                            {formatCurrency(stats.paidAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">إجمالي المبالغ غير المدفوعة:</span>
                          <span className="font-semibold text-amber-600">
                            {formatCurrency(stats.unpaidAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">عدد المنتجات المباعة:</span>
                          <span className="font-semibold text-purple-600">
                            {stats.totalProductsSold} قطعة
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">أفضل منتج:</span>
                          <span className="font-semibold text-orange-600">
                            {stats.topProduct
                              ? `${stats.topProduct.name} (${stats.topProduct.quantity} قطعة)`
                              : "لا توجد بيانات"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </main>

        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
          }
          .print-only {
            display: none;
          }
        `}</style>
      </>
    </ProtectedRoute>
  );
}
