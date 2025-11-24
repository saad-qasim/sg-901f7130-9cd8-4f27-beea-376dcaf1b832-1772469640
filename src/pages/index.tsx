import React, { useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/ProtectedRoute";
import LogoutButton from "@/components/LogoutButton";
import { useAuth, User } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Building2,
  Users, 
  Search,
  BarChart3,
  Package,
  UserCircle,
  LucideProps,
  Home as HomeIcon
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

// Define a type for the card icon
type CardIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Helper function to check permissions, ensuring it returns false if user is not loaded
  const hasAccess = (permission: keyof User) => {
    if (!user) return false;
    // Admins and managers have access to everything
    if (user.role === 'admin' || user.role === 'manager') return true;
    // Check for specific permission for other roles
    return !!user[permission];
  };

  // Memoize the dashboard cards to prevent re-creation on every render, depends on user object
  const dashboardCards = useMemo(() => {
    if (!user) return []; // Return empty array if user is not loaded
    
    return [
      {
        title: "الفواتير",
        description: "إدارة الفواتير وإنشاء فواتير جديدة",
        icon: FileText,
        href: "/invoices",
        show: hasAccess('can_create_invoices') || hasAccess('can_edit_invoices'),
        color: "bg-gradient-to-br from-blue-500 to-blue-600",
      },
      {
        title: "المنتجات",
        description: "إدارة المنتجات وأسعارها",
        icon: Package,
        href: "/products",
        show: hasAccess('can_add_product'),
        color: "bg-gradient-to-br from-orange-500 to-orange-600",
      },
      {
        title: "العملاء",
        description: "إدارة بيانات العملاء",
        icon: Users,
        href: "/customers",
        show: true, // All users can access customers
        color: "bg-gradient-to-br from-green-500 to-green-600",
      },
      {
        title: "العلامات التجارية",
        description: "إدارة العلامات التجارية والضمانات",
        icon: Building2,
        href: "/brands",
        show: hasAccess('can_add_brand'),
        color: "bg-gradient-to-br from-purple-500 to-purple-600",
      },
      {
        title: "البحث عن رقم تسلسلي",
        description: "البحث عن فاتورة برقم تسلسلي الجهاز",
        icon: Search,
        href: "/search-serial",
        show: true, // All users can search serials
        color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      },
      {
        title: "إحصائيات المبيعات",
        description: "عرض تقارير وإحصائيات المبيعات",
        icon: BarChart3,
        href: "/reports",
        show: hasAccess('can_view_stats'),
        color: "bg-gradient-to-br from-red-500 to-red-600",
      },
      {
        title: "الملف الشخصي",
        description: "إعدادات الحساب وتغيير كلمة المرور",
        icon: UserCircle,
        href: "/admin/profile",
        show: true, // All users can access their profile
        color: "bg-gradient-to-br from-gray-500 to-gray-600",
      },
      {
        title: "إدارة المستخدمين",
        description: "إدارة الموظفين وصلاحياتهم",
        icon: Users,
        href: "/admin/users",
        show: user.role === 'admin' || user.role === 'manager',
        color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      },
      {
        title: "إعدادات الشركة",
        description: "إدارة معلومات الشركة وإعدادات الفواتير",
        icon: HomeIcon,
        href: "/admin/companies",
        show: user.role === 'admin',
        color: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      },
    ];
  }, [user]);

  // While loading, show a placeholder
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier', 'viewer']}>
      <Head>
        <title>لوحة التحكم الرئيسية - Invoice PRO</title>
        <meta name="description" content="نظام إدارة الفواتير والمبيعات" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header Section with Logout Button */}
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                مرحباً, {user.name || user.email}
              </h2>
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
            {dashboardCards.filter(card => card.show).map((card) => {
              const Icon = card.icon as CardIcon;
              return (
                <Card 
                  key={card.href}
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 hover:-translate-y-1 overflow-hidden"
                  onClick={() => router.push(card.href)}
                >
                  <div className={`h-2 ${card.color}`} />
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
                  {hasAccess('can_add_brand') && (
                    <button
                      onClick={() => router.push("/brands")}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="text-3xl">🏷️</div>
                      <div className="text-sm font-medium text-center">العلامات التجارية</div>
                    </button>
                  )}
                  {hasAccess('can_add_product') && (
                    <button
                      onClick={() => router.push("/products")}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="text-3xl">📦</div>
                      <div className="text-sm font-medium text-center">المنتجات</div>
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/customers")}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="text-3xl">👥</div>
                    <div className="text-sm font-medium text-center">العملاء</div>
                  </button>
                  {hasAccess('can_create_invoices') && (
                    <button
                      onClick={() => router.push("/invoices/new")}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="text-3xl">✨</div>
                      <div className="text-sm font-medium text-center">فاتورة جديدة</div>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
