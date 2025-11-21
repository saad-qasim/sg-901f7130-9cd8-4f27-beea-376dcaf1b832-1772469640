
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface ProfileWithEmail extends ProfileRow {
  email: string | null;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  role: string;
  can_create_invoices: boolean;
  can_delete_invoices: boolean;
  can_edit_invoices: boolean;
  can_add_brand: boolean;
  can_add_product: boolean;
  can_view_stats: boolean;
}

export const userService = {
  async getAllProfiles(): Promise<ProfileWithEmail[]> {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return [];

    const userIds = profiles.map((p) => p.id);

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Adjust as needed
    });

    if (usersError) {
      console.error("Error fetching auth users:", usersError);
      // Return profiles without emails as a fallback
      return profiles.map(profile => ({
        ...profile,
        email: null,
      }));
    }
    
    const emailMap = new Map(users.users.map(u => [u.id, u.email]));

    const profilesWithEmails: ProfileWithEmail[] = profiles.map(profile => ({
      ...profile,
      email: emailMap.get(profile.id) || null,
    }));
    
    return profilesWithEmails;
  },

  async updateProfile(id: string, updates: ProfileUpdate): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createUser(userData: CreateUserData): Promise<{ userId: string; temporaryPassword: string }> {
    // Generate a temporary random password
    const temporaryPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();

    // Create user in auth.users using Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create user");

    // Create corresponding profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        can_create_invoices: userData.can_create_invoices,
        can_delete_invoices: userData.can_delete_invoices,
        can_edit_invoices: userData.can_edit_invoices,
        can_add_brand: userData.can_add_brand,
        can_add_product: userData.can_add_product,
        can_view_stats: userData.can_view_stats,
      });

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // Try to send password reset email
    try {
      await supabase.auth.resetPasswordForEmail(userData.email);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      // Don't throw - user is created successfully, just log the temp password
    }

    return {
      userId: authData.user.id,
      temporaryPassword,
    };
  },

  async deleteUser(id: string): Promise<void> {
    // Delete profile (this should cascade or be handled separately)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) throw profileError;

    // Delete from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) {
      console.error("Failed to delete auth user:", authError);
      // Profile is already deleted, so we don't throw
    }
  },
};
