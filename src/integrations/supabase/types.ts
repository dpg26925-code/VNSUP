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
          capabilities: Json
          cover_url: string | null
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          employee_range: string | null
          featured: boolean
          founded_year: number | null
          id: string
          industry: string | null
          last_verified_at: string | null
          logo_url: string | null
          name: string
          phone: string | null
          province: string | null
          rejection_reason: string | null
          slug: string
          source: string
          status: string
          sub_industry: string | null
          submitted_by: string | null
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          capabilities?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          employee_range?: string | null
          featured?: boolean
          founded_year?: number | null
          id?: string
          industry?: string | null
          last_verified_at?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          province?: string | null
          rejection_reason?: string | null
          slug: string
          source?: string
          status?: string
          sub_industry?: string | null
          submitted_by?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          capabilities?: Json
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          employee_range?: string | null
          featured?: boolean
          founded_year?: number | null
          id?: string
          industry?: string | null
          last_verified_at?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          province?: string | null
          rejection_reason?: string | null
          slug?: string
          source?: string
          status?: string
          sub_industry?: string | null
          submitted_by?: string | null
          updated_at?: string
          verified?: boolean
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      claim_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      claim_status: ["pending", "approved", "rejected"],
    },
  },
} as const
