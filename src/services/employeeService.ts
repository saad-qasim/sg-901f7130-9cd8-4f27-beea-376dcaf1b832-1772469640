
import { Database } from "@/integrations/supabase/types";

export type Employee = Database["public"]["Tables"]["profiles"]["Row"];

export interface CreateEmployeeData {
  email: string;
  password: string;
  profile: {
    name: string;
    phone: string;
    role: string;
    can_create_invoices: boolean;
    can_delete_invoices: boolean;
    can_edit_invoices: boolean;
    can_add_brand: boolean;
    can_add_product: boolean;
    can_view_stats: boolean;
  };
}

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const response = await fetch("/api/admin/employees", {
      method: "GET",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to load employees");
    }

    return result.employees;
  },

  async create(data: CreateEmployeeData): Promise<{ userId: string }> {
    const response = await fetch("/api/admin/employees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to create employee");
    }

    return { userId: result.userId };
  },

  async update(
    userId: string,
    updates: Database["public"]["Tables"]["profiles"]["Update"]
  ): Promise<void> {
    const response = await fetch("/api/admin/employees", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, updates }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to update employee");
    }
  },

  async delete(userId: string): Promise<void> {
    const response = await fetch("/api/admin/employees", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to delete employee");
    }
  },
};
