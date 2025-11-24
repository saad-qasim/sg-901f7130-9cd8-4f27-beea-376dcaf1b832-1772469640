
import { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertCircle, Mail, Lock, User } from "lucide-react";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminProfilePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Reset Password via Email
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailError, setResetEmailError] = useState("");
  const [resetEmailSuccess, setResetEmailSuccess] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (user?.email) {
        setEmail(user.email);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (!currentPassword.trim()) {
      setPasswordError("يرجى إدخال كلمة المرور الحالية");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("يرجى إدخال كلمة المرور الجديدة وتأكيدها");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("يجب أن تحتوي كلمة المرور الجديدة على 6 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("كلمتا المرور الجديدتان غير متطابقتين");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة");
      return;
    }

    try {
      setChangingPassword(true);

      // First, verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("كلمة المرور الحالية غير صحيحة");
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess("✅ تم تغيير كلمة المرور بنجاح!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    setResetEmailError("");
    setResetEmailSuccess("");

    if (!email) {
      setResetEmailError("البريد الإلكتروني غير متوفر");
      return;
    }

    try {
      setSendingResetEmail(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetEmailSuccess("✅ تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      setResetEmailError(error.message || "حدث خطأ أثناء إرسال رابط إعادة التعيين");
    } finally {
      setSendingResetEmail(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <p>جاري التحميل...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier', 'viewer']}>
      <>
        <Head>
          <title>الملف الشخصي - Invoice PRO</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <HomeButton />
              <BackButton />
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">الملف الشخصي</h1>
              <p className="text-muted-foreground">
                إدارة معلومات حسابك وكلمة المرور
              </p>
            </div>

            {/* User Information Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  معلومات المستخدم
                </CardTitle>
                <CardDescription>
                  بيانات حسابك الأساسية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-email" className="flex items-center gap-2 mb-2">
                      <Mail size={16} />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      لا يمكن تعديل البريد الإلكتروني
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock size={20} />
                  تغيير كلمة المرور
                </CardTitle>
                <CardDescription>
                  قم بتحديث كلمة المرور الخاصة بك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert className="bg-green-50 text-green-900 border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{passwordSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="current-password">كلمة المرور الحالية *</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={changingPassword}
                      dir="ltr"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة المرور الجديدة *</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={changingPassword}
                      dir="ltr"
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      يجب أن تحتوي على 6 أحرف على الأقل
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة *</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changingPassword}
                      dir="ltr"
                      minLength={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full"
                  >
                    {changingPassword ? "جاري التغيير..." : "تغيير كلمة المرور"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reset Password via Email Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail size={20} />
                  إعادة تعيين كلمة المرور عبر البريد الإلكتروني
                </CardTitle>
                <CardDescription>
                  سنرسل لك رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resetEmailError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{resetEmailError}</AlertDescription>
                    </Alert>
                  )}

                  {resetEmailSuccess && (
                    <Alert className="bg-green-50 text-green-900 border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{resetEmailSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>البريد الإلكتروني المسجل</Label>
                    <Input
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                      dir="ltr"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendResetEmail}
                    disabled={sendingResetEmail}
                    className="w-full"
                  >
                    {sendingResetEmail
                      ? "جاري الإرسال..."
                      : "إرسال رابط إعادة التعيين"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. الرابط صالح لمدة ساعة واحدة.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
