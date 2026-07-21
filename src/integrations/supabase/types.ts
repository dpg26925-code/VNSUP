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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          changes: Json
          created_at: string
          id: string
          ip: string | null
          target_id: string | null
          target_slug: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          changes?: Json
          created_at?: string
          id?: string
          ip?: string | null
          target_id?: string | null
          target_slug?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          changes?: Json
          created_at?: string
          id?: string
          ip?: string | null
          target_id?: string | null
          target_slug?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      capabilities: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "capabilities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      celebrities: {
        Row: {
          achievements: string[]
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          category: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          featured: boolean
          id: string
          name: string
          nationality: string | null
          published: boolean
          slug: string
          socials: Json
          stage_name: string | null
          updated_at: string
          views: number
        }
        Insert: {
          achievements?: string[]
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          name: string
          nationality?: string | null
          published?: boolean
          slug: string
          socials?: Json
          stage_name?: string | null
          updated_at?: string
          views?: number
        }
        Update: {
          achievements?: string[]
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          name?: string
          nationality?: string | null
          published?: boolean
          slug?: string
          socials?: Json
          stage_name?: string | null
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          ai_summary: string | null
          canonical_url: string | null
          capabilities: Json
          cover_url: string | null
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          employee_range: string | null
          featured: boolean
          featured_expires_at: string | null
          founded_year: number | null
          id: string
          industry: string | null
          is_featured: boolean
          is_verified: boolean
          last_verified_at: string | null
          lead_notify_expires_at: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          phone: string | null
          province: string | null
          rejection_reason: string | null
          slug: string
          source: string
          status: string
          stock_exchange: string | null
          stock_ticker: string | null
          sub_industry: string | null
          submitted_by: string | null
          updated_at: string
          verified: boolean
          verified_expires_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          canonical_url?: string | null
          capabilities?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          employee_range?: string | null
          featured?: boolean
          featured_expires_at?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_featured?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          lead_notify_expires_at?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          phone?: string | null
          province?: string | null
          rejection_reason?: string | null
          slug: string
          source?: string
          status?: string
          stock_exchange?: string | null
          stock_ticker?: string | null
          sub_industry?: string | null
          submitted_by?: string | null
          updated_at?: string
          verified?: boolean
          verified_expires_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          canonical_url?: string | null
          capabilities?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          employee_range?: string | null
          featured?: boolean
          featured_expires_at?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_featured?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          lead_notify_expires_at?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          phone?: string | null
          province?: string | null
          rejection_reason?: string | null
          slug?: string
          source?: string
          status?: string
          stock_exchange?: string | null
          stock_ticker?: string | null
          sub_industry?: string | null
          submitted_by?: string | null
          updated_at?: string
          verified?: boolean
          verified_expires_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_claims: {
        Row: {
          company_id: string
          created_at: string
          id: string
          note: string | null
          requester_email: string
          requester_name: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["claim_status"]
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          note?: string | null
          requester_email: string
          requester_name?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          note?: string | null
          requester_email?: string
          requester_name?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_claims_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_updates: {
        Row: {
          company_id: string
          content: string | null
          created_at: string
          id: string
          published_at: string
          title: string
          update_type: string
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string
          id?: string
          published_at?: string
          title: string
          update_type: string
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string
          id?: string
          published_at?: string
          title?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_updates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          company_id: string
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source_page: string | null
        }
        Insert: {
          company?: string | null
          company_id: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source_page?: string | null
        }
        Update: {
          company?: string | null
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source_page?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          cancel_url: string | null
          checkout_url: string | null
          company_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          order_code: number
          paid_at: string | null
          payos_payment_link_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          qr_code: string | null
          raw_webhook: Json | null
          return_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cancel_url?: string | null
          checkout_url?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_code: number
          paid_at?: string | null
          payos_payment_link_id?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          qr_code?: string | null
          raw_webhook?: Json | null
          return_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cancel_url?: string | null
          checkout_url?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_code?: number
          paid_at?: string | null
          payos_payment_link_id?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          qr_code?: string | null
          raw_webhook?: Json | null
          return_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          query: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          query?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          query?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          company_id: string | null
          created_at: string
          expires_at: string
          id: string
          order_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          reminder_sent_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          company_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          order_id?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          reminder_sent_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          company_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          reminder_sent_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          allowed_categories: string[]
          can_delete: boolean
          can_manage_users: boolean
          can_publish: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_categories?: string[]
          can_delete?: boolean
          can_manage_users?: boolean
          can_publish?: boolean
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_categories?: string[]
          can_delete?: boolean
          can_manage_users?: boolean
          can_publish?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_delete: { Args: { _user_id: string }; Returns: boolean }
      can_publish: { Args: { _user_id: string }; Returns: boolean }
      factoryhub_slugify: { Args: { _input: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_role: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "publisher" | "viewer"
      claim_status: "pending" | "approved" | "rejected"
      payment_status: "pending" | "paid" | "cancelled" | "failed" | "expired"
      plan_type: "featured_listing" | "verified_badge" | "lead_notification"
      post_status: "draft" | "pending" | "published" | "archived"
      subscription_status: "active" | "expired" | "cancelled"
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
    Enums: {
      app_role: ["admin", "user", "editor", "publisher", "viewer"],
      claim_status: ["pending", "approved", "rejected"],
      payment_status: ["pending", "paid", "cancelled", "failed", "expired"],
      plan_type: ["featured_listing", "verified_badge", "lead_notification"],
      post_status: ["draft", "pending", "published", "archived"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
