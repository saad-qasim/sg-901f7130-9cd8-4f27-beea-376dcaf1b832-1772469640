import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import HomeButton from "@/components/HomeButton";

export default function SetupAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
          role: "admin",
        }),
      });

      const data = await response.json();
      
      // Log detailed error for debugging
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "فشل إنشاء المستخدم");
      }

      setSuccess(true);
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
    } catch (err: any) {
      console.error("Full error:", err);
      setError(err.message || "حدث خطأ أثناء إنشاء المستخدم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>إعداد مستخدم Admin - Invoice PRO</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <HomeButton />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">⚙️ إعداد أول مستخدم</CardTitle>
            <CardDescription className="text-lg">
              إنشاء حساب Admin للدخول إلى النظام
            </CardDescription>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>ملاحظة:</strong> هذه الصفحة مخصصة لإنشاء أول مستخدم Admin فقط. يمكنك حذفها بعد الانتهاء.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>تم إنشاء المستخدم بنجاح! 🎉</strong>
                    <br />
                    يمكنك الآن <Link href="/login" className="underline font-semibold">تسجيل الدخول</Link> باستخدام البريد الإلكتروني وكلمة المرور.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="أحمد محمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  dir="ltr"
                  minLength={6}
                />
                <p className="text-xs text-gray-500">يجب أن تحتوي على 6 أحرف على الأقل</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "جاري الإنشاء..." : "إنشاء مستخدم Admin"}
              </Button>

              {success && (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = "/login"}
                  >
                    الذهاب إلى صفحة تسجيل الدخول
                  </Button>
                </div>
              )}
            </form>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ تنبيه أمني:</strong>
                <br />
                بعد إنشاء أول مستخدم، يُنصح بشدة بحذف هذه الصفحة (<code className="bg-yellow-100 px-1 rounded">src/pages/setup-admin.tsx</code>) لأسباب أمنية.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
