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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      archived_batches: {
        Row: {
          archived_at: string
          avg_daily_usage: number | null
          batch_number: string | null
          days_to_deplete: number | null
          depleted_at: string | null
          id: string
          invoice_item_id: string | null
          opened_at: string | null
          product_id: string
          quantity_in: number | null
          quantity_out: number | null
          season: string | null
          status: string | null
          total_cost: number | null
          unit_price: number | null
        }
        Insert: {
          archived_at?: string
          avg_daily_usage?: number | null
          batch_number?: string | null
          days_to_deplete?: number | null
          depleted_at?: string | null
          id: string
          invoice_item_id?: string | null
          opened_at?: string | null
          product_id: string
          quantity_in?: number | null
          quantity_out?: number | null
          season?: string | null
          status?: string | null
          total_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          archived_at?: string
          avg_daily_usage?: number | null
          batch_number?: string | null
          days_to_deplete?: number | null
          depleted_at?: string | null
          id?: string
          invoice_item_id?: string | null
          opened_at?: string | null
          product_id?: string
          quantity_in?: number | null
          quantity_out?: number | null
          season?: string | null
          status?: string | null
          total_cost?: number | null
          unit_price?: number | null
        }
        Relationships: []
      }
      archived_stock_movements: {
        Row: {
          archived_at: string
          batch_id: string | null
          created_at: string | null
          id: string
          invoice_item_id: string | null
          product_id: string
          quantity: number | null
          reason: string | null
          type: string | null
          unit_price_snapshot: number | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string
          batch_id?: string | null
          created_at?: string | null
          id: string
          invoice_item_id?: string | null
          product_id: string
          quantity?: number | null
          reason?: string | null
          type?: string | null
          unit_price_snapshot?: number | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string
          batch_id?: string | null
          created_at?: string | null
          id?: string
          invoice_item_id?: string | null
          product_id?: string
          quantity?: number | null
          reason?: string | null
          type?: string | null
          unit_price_snapshot?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      batch_number_counters: {
        Row: {
          last_seq: number
          product_id: string
          year: number
        }
        Insert: {
          last_seq?: number
          product_id: string
          year: number
        }
        Update: {
          last_seq?: number
          product_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_number_counters_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_number_counters_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          archived_at: string | null
          avg_daily_usage: number | null
          batch_number: string
          created_at: string
          days_to_deplete: number | null
          depleted_at: string | null
          id: string
          invoice_item_id: string
          opened_at: string
          product_id: string
          quantity_in: number
          quantity_out: number
          season: string | null
          status: string
          total_cost: number
          unit_price: number
        }
        Insert: {
          archived_at?: string | null
          avg_daily_usage?: number | null
          batch_number: string
          created_at?: string
          days_to_deplete?: number | null
          depleted_at?: string | null
          id?: string
          invoice_item_id: string
          opened_at?: string
          product_id: string
          quantity_in: number
          quantity_out?: number
          season?: string | null
          status?: string
          total_cost: number
          unit_price: number
        }
        Update: {
          archived_at?: string | null
          avg_daily_usage?: number | null
          batch_number?: string
          created_at?: string
          days_to_deplete?: number | null
          depleted_at?: string | null
          id?: string
          invoice_item_id?: string
          opened_at?: string
          product_id?: string
          quantity_in?: number
          quantity_out?: number
          season?: string | null
          status?: string
          total_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "batches_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_headers: {
        Row: {
          created_at: string
          emission_date: string
          exit_date: string | null
          id: string
          natureza_operacao: string | null
          nfe_key: string
          nfe_number: string
          nfe_serie: string
          protocol: string | null
          raw_data: Json | null
          supplier_id: string
          total_value: number
        }
        Insert: {
          created_at?: string
          emission_date: string
          exit_date?: string | null
          id?: string
          natureza_operacao?: string | null
          nfe_key: string
          nfe_number: string
          nfe_serie: string
          protocol?: string | null
          raw_data?: Json | null
          supplier_id: string
          total_value: number
        }
        Update: {
          created_at?: string
          emission_date?: string
          exit_date?: string | null
          id?: string
          natureza_operacao?: string | null
          nfe_key?: string
          nfe_number?: string
          nfe_serie?: string
          protocol?: string | null
          raw_data?: Json | null
          supplier_id?: string
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_headers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cfop: string | null
          created_at: string
          cst: string | null
          icms_aliquot: number | null
          icms_base: number | null
          icms_value: number | null
          id: string
          invoice_id: string
          p_red_bc: number | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          cfop?: string | null
          created_at?: string
          cst?: string | null
          icms_aliquot?: number | null
          icms_base?: number | null
          icms_value?: number | null
          id?: string
          invoice_id: string
          p_red_bc?: number | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          cfop?: string | null
          created_at?: string
          cst?: string | null
          icms_aliquot?: number | null
          icms_base?: number | null
          icms_value?: number | null
          id?: string
          invoice_id?: string
          p_red_bc?: number | null
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_headers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_stock"
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
      product_lifecycle_events: {
        Row: {
          avg_price_paid: number | null
          event_type: string
          id: string
          notes: string | null
          occurred_at: string
          product_id: string
          stock_at_event: number | null
          total_qty_in: number | null
          total_qty_out: number | null
        }
        Insert: {
          avg_price_paid?: number | null
          event_type: string
          id?: string
          notes?: string | null
          occurred_at?: string
          product_id: string
          stock_at_event?: number | null
          total_qty_in?: number | null
          total_qty_out?: number | null
        }
        Update: {
          avg_price_paid?: number | null
          event_type?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          product_id?: string
          stock_at_event?: number | null
          total_qty_in?: number | null
          total_qty_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_lifecycle_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lifecycle_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          depleted_at: string | null
          description: string
          first_entry_at: string | null
          id: string
          min_stock_alert: number | null
          ncm: string | null
          slug: string
          status: string
          unit: string
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          depleted_at?: string | null
          description: string
          first_entry_at?: string | null
          id?: string
          min_stock_alert?: number | null
          ncm?: string | null
          slug: string
          status?: string
          unit?: string
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          depleted_at?: string | null
          description?: string
          first_entry_at?: string | null
          id?: string
          min_stock_alert?: number | null
          ncm?: string | null
          slug?: string
          status?: string
          unit?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          invoice_item_id: string | null
          product_id: string
          quantity: number
          reason: string | null
          type: string
          unit_price_snapshot: number | null
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          invoice_item_id?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          type: string
          unit_price_snapshot?: number | null
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          invoice_item_id?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          type?: string
          unit_price_snapshot?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string
          created_at: string
          id: string
          ie: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          cnpj: string
          created_at?: string
          id?: string
          ie?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string
          created_at?: string
          id?: string
          ie?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      product_stock: {
        Row: {
          avg_price: number | null
          code: string | null
          current_stock: number | null
          description: string | null
          id: string | null
          last_movement_at: string | null
          min_stock_alert: number | null
          slug: string | null
          status: string | null
          unit: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_create_invoice: {
        Args: { p_invoice: Json; p_items: Json; p_supplier: Json }
        Returns: Json
      }
      fn_create_movement: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_user_id?: string
        }
        Returns: Json
      }
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
