import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/integrations/supabase/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Define an explicit type for Profile, as the auto-generated one is out of sync.
export interface AppProfile {
    id: string;
    created_at: string;
    name: string | null;
    phone: string | null;
    role: string | null;
    can_create_invoices: boolean | null;
    can_delete_invoices: boolean | null;
    can_edit_invoices: boolean | null;
    can_add_brand: boolean | null;
    can_add_product: boolean | null;
    can_view_stats: boolean | null;
}

export interface ProfileWithEmail extends AppProfile {
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

        const typedProfiles = profiles as AppProfile[];

        try {
            const response = await fetch("/api/admin/list-users");
            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error("Error fetching auth users:", result.error);
                return typedProfiles.map((profile) => ({
                    ...profile,
                    email: null,
                }));
            }

            const emailMap = new Map < string, string> (
                result.users
                    .filter((u: any) => u.email)
                    .map((u: any) => [u.id, u.email as string])
            );

            const profilesWithEmails: ProfileWithEmail[] = typedProfiles.map(
                (profile) => ({
                    ...profile,
                    email: emailMap.get(profile.id) ?? null,
                })
            );

            return profilesWithEmails;
        } catch (error) {
            console.error("Failed to fetch user emails:", error);
            return typedProfiles.map((profile) => ({
                ...profile,
                email: null,
            }));
        }
    },

    async updateProfile(id: string, updates: ProfileUpdate): Promise<AppProfile> {
        const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as AppProfile;
    },

    async createUser(
        userData: CreateUserData
    ): Promise<{ userId: string; temporaryPassword: string }> {
        // Generate a temporary random password
        const temporaryPassword =
            Math.random().toString(36).slice(-12) +
            Math.random().toString(36).slice(-12).toUpperCase();

        // Call server-side API route to create user
        const response = await fetch("/api/admin/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: userData.email,
                password: temporaryPassword,
                userData: {
                    name: userData.name,
                    phone: userData.phone,
                    role: userData.role,
                    can_create_invoices: userData.can_create_invoices,
                    can_delete_invoices: userData.can_delete_invoices,
                    can_edit_invoices: userData.can_edit_invoices,
                    can_add_brand: userData.can_add_brand,
                    can_add_product: userData.can_add_product,
                    can_view_stats: userData.can_view_stats,
                },
            }),
        });

        const result = await response.json();

        if (!response.ok || !result.success || !result.userId) {
            throw new Error(result.error || "Failed to create user");
        }

        return {
            userId: result.userId,
            temporaryPassword,
        };
    },

    async deleteUser(id: string): Promise<void> {
        const response = await fetch("/api/admin/delete-user", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: id }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to delete user");
        }
    },
};