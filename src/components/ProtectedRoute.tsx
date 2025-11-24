import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import React, { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // Make allowedRoles optional
}

export default function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
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
    // Only check roles if allowedRoles is provided and has roles
    if (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role)) {
      router.push("/"); // Redirect if role is not allowed
    }
  }, [user, loading, router, allowedRoles]);

  // While loading or if user role is not yet determined, show a loading state
  if (loading || !user || (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
