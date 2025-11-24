import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  List,
  Building2,
  Users, 
  Search,
  BarChart3,
  Plus,
  User
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  const dashboardCards = [
    {
      title: "إنشاء فاتورة جديدة",
      description: "إنشاء فاتورة جديدة للعملاء مع إضافة المنتجات والأسعار",
      icon: Plus,
      href: "/invoices/new",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "قائمة الفواتير",
      description: "عرض وإدارة جميع الفواتير المسجلة في النظام",
      icon: List,
      href: "/invoices",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "إدارة الشركات",
      description: "إضافة وتعديل بيانات الشركات المصدرة للفواتير",
      icon: Building2,
      href: "/admin/companies",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      title: "إدارة الموظفين",
      description: "إدارة حسابات الموظفين وصلاحيات الوصول",
      icon: Users,
      href: "/admin/users",
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      title: "الملف الشخصي",
      description: "عرض وتعديل معلومات حسابك وإدارة كلمة المرور",
      icon: User,
      href: "/admin/profile",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    },
    {
      title: "البحث برقم السيريال",
      description: "البحث عن معلومات الضمان والفواتير باستخدام رقم الجهاز",
      icon: Search,
      href: "/search-serial",
      color: "bg-gradient-to-br from-pink-500 to-pink-600"
    },
    {
      title: "إحصائيات المبيعات",
      description: "عرض تقارير وإحصائيات المبيعات والإيرادات",
      icon: BarChart3,
      href: "/reports",
      color: "bg-gradient-to-br from-cyan-500 to-cyan-600"
    }
  ];

  return (
    <ProtectedRoute>
      <Head>
        <title>لوحة التحكم الرئيسية - Invoice PRO</title>
        <meta name="description" content="نظام إدارة الفواتير والمبيعات" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header Section with Logout Button */}
          <div className="flex justify-end mb-4">
            <LogoutButton />
          </div>

          {/* Header Section */}
          <div className="text-center mb-12 space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              لوحة التحكم الرئيسية
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              نظام إدارة الفواتير والمبيعات
            </p>
          </div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {dashboardCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card 
                  key={card.href}
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 hover:-translate-y-1 overflow-hidden"
                  onClick={() => router.push(card.href)}
                >
                  <div className={`h-2 ${card.color.replace('from-', 'bg-').replace('to-', '').split(' ')[0]}`} />
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${card.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon size={28} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 text-right">
                        <CardTitle className="text-xl md:text-2xl mb-2 font-bold">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="text-sm md:text-base leading-relaxed">
                          {card.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-end gap-2 text-primary group-hover:text-primary/80 font-medium">
                      <span className="text-sm">انتقال</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="transform rotate-180 group-hover:-translate-x-1 transition-transform"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Access Section */}
          <div className="mt-16 max-w-5xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl text-center">الوصول السريع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  <button
                    onClick={() => router.push("/brands")}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="text-3xl">🏷️</div>
                    <div className="text-sm font-medium text-center">العلامات التجارية</div>
                  </button>
                  <button
                    onClick={() => router.push("/products")}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="text-3xl">📦</div>
                    <div className="text-sm font-medium text-center">المنتجات</div>
                  </button>
                  <button
                    onClick={() => router.push("/customers")}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="text-3xl">👥</div>
                    <div className="text-sm font-medium text-center">العملاء</div>
                  </button>
                  <button
                    onClick={() => router.push("/invoices/new")}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="text-3xl">✨</div>
                    <div className="text-sm font-medium text-center">فاتورة جديدة</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
