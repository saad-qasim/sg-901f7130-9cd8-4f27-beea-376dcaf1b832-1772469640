import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, FileText, Users, BarChart3, Building2, Search, UserCircle } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

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
    router.push("/login");
    return null;
  }

  // Helper function: Check if user has access (admin, manager, or specific permission)
  const hasAccess = (permission?: keyof typeof user) => {
    if (user.role === 'admin' || user.role === 'manager') return true;
    if (!permission) return true;
    return user[permission] === true;
  };

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
      show: hasAccess('can_add_product'),
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
      show: hasAccess('can_add_brand'),
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
      show: hasAccess('can_view_stats'),
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
    <>
      <Head>
        <title>الصفحة الرئيسية - Invoice PRO</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              مرحباً بك في Invoice PRO
            </h1>
            <p className="text-lg text-gray-600">
              نظام إدارة الفواتير المتكامل
            </p>
            {user.name && (
              <p className="text-sm text-gray-500 mt-2">
                مرحباً، {user.name} ({user.role === 'admin' ? 'مدير النظام' : user.role === 'manager' ? 'مدير' : 'موظف'})
              </p>
            )}
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards
              .filter((card) => card.show)
              .map((card, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow cursor-pointer bg-white"
                  onClick={() => router.push(card.href)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <card.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl mt-4">{card.title}</CardTitle>
                    <CardDescription className="text-base">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      الدخول
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Admin Section - Only for admin role */}
          {user.role === "admin" && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                إعدادات النظام (للمدير فقط)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer bg-white"
                  onClick={() => router.push("/admin/users")}
                >
                  <CardHeader>
                    <CardTitle className="text-xl">إدارة المستخدمين</CardTitle>
                    <CardDescription>
                      إضافة وتعديل حسابات المستخدمين
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      الدخول
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer bg-white"
                  onClick={() => router.push("/admin/companies")}
                >
                  <CardHeader>
                    <CardTitle className="text-xl">إعدادات الشركة</CardTitle>
                    <CardDescription>
                      تعديل بيانات الشركة والإعدادات العامة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      الدخول
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
