
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      company_settings: {
        Row: {
          id: string
          company_name: string | null
          company_info_text: string | null
          default_currency: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_name?: string | null
          company_info_text?: string | null
          default_currency?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string | null
          company_info_text?: string | null
          default_currency?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          role: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          role?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          role?: string | null
          phone?: string | null
          created_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          warranty_default_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          warranty_default_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          warranty_default_text?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          brand_id: string
          name: string
          description: string | null
          model_number: string | null
          warranty_text: string | null
          unit_price_iqd: number | null
          unit_price_usd: number | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          description?: string | null
          model_number?: string | null
          warranty_text?: string | null
          unit_price_iqd?: number | null
          unit_price_usd?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          description?: string | null
          model_number?: string | null
          warranty_text?: string | null
          unit_price_iqd?: number | null
          unit_price_usd?: number | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          email?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          invoice_date: string
          warranty_end_date: string | null
          customer_id: string
          brand_id: string
          company_info_snapshot: string | null
          warranty_text_snapshot: string | null
          currency: string
          subtotal: number
          shipping_cost: number
          total: number
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          invoice_date: string
          warranty_end_date?: string | null
          customer_id: string
          brand_id: string
          company_info_snapshot?: string | null
          warranty_text_snapshot?: string | null
          currency: string
          subtotal: number
          shipping_cost: number
          total: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          invoice_date?: string
          warranty_end_date?: string | null
          customer_id?: string
          brand_id?: string
          company_info_snapshot?: string | null
          warranty_text_snapshot?: string | null
          currency?: string
          subtotal?: number
          shipping_cost?: number
          total?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string | null
          product_name_snapshot: string
          serial_number: string | null
          quantity: number
          unit_price: number
          total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          unit_price: number
          total: number
          serial_number?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          unit_price?: number
          total?: number
          serial_number?: string | null
        }
      }
    }
  }
}
