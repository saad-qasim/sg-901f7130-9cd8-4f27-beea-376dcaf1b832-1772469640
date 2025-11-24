import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { invoiceService } from "@/services/invoiceService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, DollarSign, FileText, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import BackButton from "@/components/BackButton";

interface SalesStats {
  totalInvoices: number;
  totalSalesIQD: number;
  totalSalesUSD: number;
  avgInvoiceValueIQD: number;
  avgInvoiceValueUSD: number;
}

interface InvoicesByBrand {
  brand_name: string;
  invoice_count: number;
  total_sales_iqd: number;
  total_sales_usd: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [brandStats, setBrandStats] = useState<InvoicesByBrand[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Check permissions
  useEffect(() => {
    if (!loading && user) {
      const hasAccess = user.role === 'admin' || user.role === 'manager' || user.can_view_stats;
      if (!hasAccess) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const fromDate = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
      const toDate = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;

      const [salesStats, brandData] = await Promise.all([
        invoiceService.getSalesStatistics(fromDate, toDate),
        invoiceService.getInvoicesByBrand(fromDate, toDate),
      ]);

      setStats(salesStats);
      setBrandStats(brandData);
    } catch (error) {
      console.error("Error loading reports:", error);
      alert("فشل تحميل التقارير!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = () => {
    loadReports();
  };

  const handleClearFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setTimeout(() => loadReports(), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>إحصائيات المبيعات - Invoice PRO</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />

          <div className="mt-6 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <BarChart3 className="h-8 w-8" />
                  إحصائيات المبيعات
                </CardTitle>
                <CardDescription className="text-lg">
                  عرض تقارير وإحصائيات المبيعات حسب الفترة الزمنية
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Date Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">تصفية حسب التاريخ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label>من تاريخ</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP", { locale: ar }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <Label>إلى تاريخ</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP", { locale: ar }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button onClick={handleFilterApply} disabled={isLoading}>
                    تطبيق الفلتر
                  </Button>
                  <Button variant="outline" onClick={handleClearFilter} disabled={isLoading}>
                    إلغاء الفلتر
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المبيعات (IQD)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" dir="ltr">
                      {stats.totalSalesIQD.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المبيعات (USD)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" dir="ltr">
                      ${stats.totalSalesUSD.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">متوسط قيمة الفاتورة</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-bold" dir="ltr">
                      IQD: {stats.avgInvoiceValueIQD.toLocaleString()}
                    </div>
                    <div className="text-sm font-bold mt-1" dir="ltr">
                      USD: ${stats.avgInvoiceValueUSD.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sales by Brand */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">المبيعات حسب العلامة التجارية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>العلامة التجارية</TableHead>
                        <TableHead className="text-center">عدد الفواتير</TableHead>
                        <TableHead className="text-left" dir="ltr">إجمالي المبيعات (IQD)</TableHead>
                        <TableHead className="text-left" dir="ltr">إجمالي المبيعات (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandStats.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            {isLoading ? "جاري التحميل..." : "لا توجد بيانات"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        brandStats.map((brand, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{brand.brand_name}</TableCell>
                            <TableCell className="text-center">{brand.invoice_count}</TableCell>
                            <TableCell className="text-left" dir="ltr">
                              {brand.total_sales_iqd.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-left" dir="ltr">
                              ${brand.total_sales_usd.toLocaleString()}
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
      </div>
    </>
  );
}
