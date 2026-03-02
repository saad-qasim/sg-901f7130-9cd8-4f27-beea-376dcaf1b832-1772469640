import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setCheckingSession(true);

      // 1. Check if we have a hash fragment (recovery link)
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;

        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");

        if (type === "recovery" && access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) throw error;

          if (data.session) {
            setValidSession(true);
            setMessage(null);
            return;
          }
        }
      }

      // 2. Check existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session) {
        setValidSession(true);
        setMessage(null);
      } else {
        setValidSession(false);
        setMessage({
          type: "error",
          text: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.",
        });
      }
    } catch (err: any) {
      console.error("Error checking session:", err);
      setValidSession(false);
      setMessage({
        type: "error",
        text: err?.message || "حدث خطأ أثناء التحقق من الجلسة",
      });
    } finally {
      setCheckingSession(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "كلمات المرور غير متطابقة" });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "تم تغيير كلمة المرور بنجاح! سيتم تحويلك لصفحة تسجيل الدخول...",
      });

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setMessage({
        type: "error",
        text: error.message || "فشل في تغيير كلمة المرور",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>جاري التحقق من الصلاحية...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">تعيين كلمة مرور جديدة</CardTitle>
          <CardDescription className="text-center">
            أدخل كلمة المرور الجديدة لحسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!validSession ? (
            <div className="space-y-4 text-center">
              <Alert variant="destructive">
                <AlertDescription>{message?.text}</AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/login">العودة لتسجيل الدخول</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-500 text-green-700 bg-green-50" : ""}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || !!(message?.type === "success")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || !!(message?.type === "success")}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !!(message?.type === "success")}
              >
                {loading ? "جاري الحفظ..." : "تغيير كلمة المرور"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}