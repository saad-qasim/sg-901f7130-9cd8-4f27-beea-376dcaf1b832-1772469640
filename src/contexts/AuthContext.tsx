import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface User extends SupabaseUser {
  name: string | null;
  phone: string | null;
  role: string | null;
  can_create_invoices: boolean;
  can_edit_invoices: boolean;
  can_delete_invoices: boolean;
  can_add_brand: boolean;
  can_add_product: boolean;
  can_view_stats: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setSession(session);

        if (session?.user) {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle(); // Use maybeSingle() to prevent error if no profile is found

            if (error) {
              console.warn("Error fetching profile:", error.message);
            }

            setUser({
              ...session.user,
              name: profile?.name ?? null,
              phone: profile?.phone ?? null,
              role: profile?.role ?? null,
              can_create_invoices: profile?.can_create_invoices ?? false,
              can_edit_invoices: profile?.can_edit_invoices ?? false,
              can_delete_invoices: profile?.can_delete_invoices ?? false,
              can_add_brand: profile?.can_add_brand ?? false,
              can_add_product: profile?.can_add_product ?? false,
              can_view_stats: profile?.can_view_stats ?? false,
            });

          } catch (e) {
            console.error("Error in onAuthStateChange:", e);
            setUser(session.user as User);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
