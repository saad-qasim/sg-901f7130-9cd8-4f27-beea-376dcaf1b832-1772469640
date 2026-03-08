 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
          warranty_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
          warranty_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          warranty_text?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_info_text: string | null
          company_name: string
          company_phone: string | null
          created_at: string | null
          default_currency: string | null
          id: string
          invoice_prefix: string | null
          invoice_start_number: number | null
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_info_text?: string | null
          company_name: string
          company_phone?: string | null
          created_at?: string | null
          default_currency?: string | null
          id?: string
          invoice_prefix?: string | null
          invoice_start_number?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_info_text?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string | null
          default_currency?: string | null
          id?: string
          invoice_prefix?: string | null
          invoice_start_number?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          serial_number: string | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity?: number
          serial_number?: string | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          serial_number?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          brand_id: string | null
          company_id: string | null
          company_info_snapshot: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_title: string | null
          notes: string | null
          payment_date: string | null
          payment_status: string | null
          shipping_cost: number | null
          subtotal: number
          total: number
          updated_at: string | null
          warranty_end_date: string | null
          warranty_text_snapshot: string | null
        }
        Insert: {
          brand_id?: string | null
          company_id?: string | null
          company_info_snapshot?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_title?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_status?: string | null
          shipping_cost?: number | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_text_snapshot?: string | null
        }
        Update: {
          brand_id?: string | null
          company_id?: string | null
          company_info_snapshot?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_title?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_status?: string | null
          shipping_cost?: number | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_text_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          cost: number | null
          cost_iqd: number | null
          cost_usd: number | null
          created_at: string | null
          description: string | null
          id: string
          low_stock_threshold: number | null
          model: string | null
          name: string
          price: number
          stock_quantity: number | null
          unit_price_iqd: number | null
          unit_price_usd: number | null
          updated_at: string | null
          warranty_text: string | null
        }
        Insert: {
          brand_id?: string | null
          cost?: number | null
          cost_iqd?: number | null
          cost_usd?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          low_stock_threshold?: number | null
          model?: string | null
          name: string
          price?: number
          stock_quantity?: number | null
          unit_price_iqd?: number | null
          unit_price_usd?: number | null
          updated_at?: string | null
          warranty_text?: string | null
        }
        Update: {
          brand_id?: string | null
          cost?: number | null
          cost_iqd?: number | null
          cost_usd?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          low_stock_threshold?: number | null
          model?: string | null
          name?: string
          price?: number
          stock_quantity?: number | null
          unit_price_iqd?: number | null
          unit_price_usd?: number | null
          updated_at?: string | null
          warranty_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
