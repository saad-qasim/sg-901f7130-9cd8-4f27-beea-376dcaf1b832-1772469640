import React from "react";
import Head from "next/head";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, FileText } from "lucide-react";
import BackButton from "@/components/BackButton";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Reports() {
  return (
    <ProtectedRoute>
      <>
        <Head>
          <title>إحصائيات المبيعات - Invoice PRO</title>
          <meta name="description" content="عرض تقارير وإحصائيات المبيعات" />
        </Head>

        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto px-4 py-8">
            <BackButton />
            
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12 space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  إحصائيات المبيعات
                </h1>
                <p className="text-lg text-muted-foreground">
                  تقارير وإحصائيات شاملة عن المبيعات والإيرادات
                </p>
              </div>

              {/* Placeholder Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">---</div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">قريباً</p>
                  </CardContent>
                </Card>

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
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">---</div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">قريباً</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        النمو الشهري
                      </CardTitle>
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">---</div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">قريباً</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                        أفضل المنتجات
                      </CardTitle>
                      <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">---</div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">قريباً</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Card */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl text-right">صفحة قيد الإنشاء</CardTitle>
                  <CardDescription className="text-right">
                    ستتوفر التقارير والإحصائيات التفصيلية قريباً
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 size={80} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">
                      جاري العمل على إضافة التقارير والإحصائيات
                    </p>
                    <p className="text-sm text-muted-foreground">
                      سيتم إضافة تقارير المبيعات، الإيرادات، وأداء المنتجات قريباً
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </>
    </ProtectedRoute>
  );
}
