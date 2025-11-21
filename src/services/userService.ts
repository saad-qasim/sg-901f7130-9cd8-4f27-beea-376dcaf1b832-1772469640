
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
    // First, get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles) return [];

    // Then, get auth users to fetch emails
    // Note: This requires service role key to access auth.users
    // For now, we'll return profiles without emails as a fallback
    // In production, you'd need to use Supabase Admin API with service role key
    
    // Try to get user data from auth admin
    const profilesWithEmails: ProfileWithEmail[] = await Promise.all(
      profiles.map(async (profile) => {
        try {
          const { data: { user }, error } = await supabase.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: user?.email || null,
          };
        } catch (error) {
          console.error(`Error fetching email for user ${profile.id}:`, error);
          return {
            ...profile,
            email: null,
          };
        }
      })
    );

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
