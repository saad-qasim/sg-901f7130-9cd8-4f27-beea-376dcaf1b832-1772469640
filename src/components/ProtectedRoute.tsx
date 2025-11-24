import { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }
    if (!user) {
      router.push("/login"); // Redirect if not authenticated
      return;
    }
    if (user.role && !allowedRoles.includes(user.role)) {
      router.push("/"); // Redirect if role is not allowed
    }
  }, [user, loading, router, allowedRoles]);

  // While loading or if user role is not yet determined, show a loading state
  if (loading || !user || (user.role && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // If authenticated and role is allowed, render the children
  return <>{children}</>;
}
