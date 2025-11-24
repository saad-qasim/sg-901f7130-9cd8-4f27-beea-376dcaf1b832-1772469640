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
  User,
  Package,
  UserCircle
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  const dashboardCards = [
    {
      title: "الفواتير",
      description: "إدارة الفواتير وإنشاء فواتير جديدة",
      icon: FileText,
      href: "/invoices",
      show: hasAccess('can_create_invoices') || hasAccess('can_edit_invoices'),
    },
    {
      title: "المنتجات",
      description: "إدارة المنتجات وأسعارها",
      icon: Package,
      href: "/products",
      show: user.role === 'admin' || user.role === 'manager' || user.can_add_product,
    },
    {
      title: "العملاء",
      description: "إدارة بيانات العملاء",
      icon: Users,
      href: "/customers",
      show: true, // All users can access customers
    },
    {
      title: "العلامات التجارية",
      description: "إدارة العلامات التجارية والضمانات",
      icon: Building2,
      href: "/brands",
      show: user.role === 'admin' || user.role === 'manager' || user.can_add_brand,
    },
    {
      title: "البحث عن رقم تسلسلي",
      description: "البحث عن فاتورة برقم تسلسلي الجهاز",
      icon: Search,
      href: "/search-serial",
      show: true, // All users can search serials
    },
    {
      title: "إحصائيات المبيعات",
      description: "عرض تقارير وإحصائيات المبيعات",
      icon: BarChart3,
      href: "/reports",
      show: user.role === 'admin' || user.role === 'manager' || user.can_view_stats,
    },
    {
      title: "الملف الشخصي",
      description: "إعدادات الحساب وتغيير كلمة المرور",
      icon: UserCircle,
      href: "/admin/profile",
      show: true, // All users can access their profile
    },
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
