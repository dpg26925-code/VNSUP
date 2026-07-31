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
      certifications: {
        Row: {
          certificate_url: string | null
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string | null
          issuer: string | null
          name: string
          sort_order: number
          updated_at: string
          verification_status: string
        }
        Insert: {
          certificate_url?: string | null
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          name: string
          sort_order?: number
          updated_at?: string
          verification_status?: string
        }
        Update: {
          certificate_url?: string | null
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issuer?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          address_verified: boolean
          ai_summary: string | null
          business_registration_number: string | null
          canonical_url: string | null
          capabilities: Json
          certifications: Json
          company_type: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          email_verified: boolean
          employee_range: string | null
          export_markets: Json | null
          faqs: Json
          featured: boolean
          featured_expires_at: string | null
          founded_year: number | null
          gallery_urls: Json
          id: string
          industrial_zone_id: string | null
          industry: string | null
          is_featured: boolean
          is_verified: boolean
          last_verified_at: string | null
          lead_notify_expires_at: string | null
          legal_representative: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          phone: string | null
          province: string | null
          rejection_reason: string | null
          revenue_range: string | null
          slug: string
          source: string
          status: string
          stock_exchange: string | null
          stock_ticker: string | null
          sub_industry: string | null
          submitted_by: string | null
          tax_code: string | null
          tax_verified: boolean
          updated_at: string
          verification_level: string
          verified: boolean
          verified_expires_at: string | null
          video_url: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_verified?: boolean
          ai_summary?: string | null
          business_registration_number?: string | null
          canonical_url?: string | null
          capabilities?: Json
          certifications?: Json
          company_type?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          email_verified?: boolean
          employee_range?: string | null
          export_markets?: Json | null
          faqs?: Json
          featured?: boolean
          featured_expires_at?: string | null
          founded_year?: number | null
          gallery_urls?: Json
          id?: string
          industrial_zone_id?: string | null
          industry?: string | null
          is_featured?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          lead_notify_expires_at?: string | null
          legal_representative?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          phone?: string | null
          province?: string | null
          rejection_reason?: string | null
          revenue_range?: string | null
          slug: string
          source?: string
          status?: string
          stock_exchange?: string | null
          stock_ticker?: string | null
          sub_industry?: string | null
          submitted_by?: string | null
          tax_code?: string | null
          tax_verified?: boolean
          updated_at?: string
          verification_level?: string
          verified?: boolean
          verified_expires_at?: string | null
          video_url?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_verified?: boolean
          ai_summary?: string | null
          business_registration_number?: string | null
          canonical_url?: string | null
          capabilities?: Json
          certifications?: Json
          company_type?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          email_verified?: boolean
          employee_range?: string | null
          export_markets?: Json | null
          faqs?: Json
          featured?: boolean
          featured_expires_at?: string | null
          founded_year?: number | null
          gallery_urls?: Json
          id?: string
          industrial_zone_id?: string | null
          industry?: string | null
          is_featured?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          lead_notify_expires_at?: string | null
          legal_representative?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          phone?: string | null
          province?: string | null
          rejection_reason?: string | null
          revenue_range?: string | null
          slug?: string
          source?: string
          status?: string
          stock_exchange?: string | null
          stock_ticker?: string | null
          sub_industry?: string | null
          submitted_by?: string | null
          tax_code?: string | null
          tax_verified?: boolean
          updated_at?: string
          verification_level?: string
          verified?: boolean
          verified_expires_at?: string | null
          video_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_industrial_zone_id_fkey"
            columns: ["industrial_zone_id"]
            isOneToOne: false
            referencedRelation: "industrial_zones"
            referencedColumns: ["id"]
          },
        ]
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
      company_export_markets: {
        Row: {
          company_id: string
          country: string
          created_at: string
          id: string
          note: string | null
          share_percent: number | null
          sort_order: number
        }
        Insert: {
          company_id: string
          country: string
          created_at?: string
          id?: string
          note?: string | null
          share_percent?: number | null
          sort_order?: number
        }
        Update: {
          company_id?: string
          country?: string
          created_at?: string
          id?: string
          note?: string | null
          share_percent?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_export_markets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_faqs: {
        Row: {
          answer: string
          company_id: string
          created_at: string
          id: string
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          company_id: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          company_id?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_faqs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_gallery: {
        Row: {
          caption: string | null
          company_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          company_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          company_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_gallery_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_reviews: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          rating: number
          reviewer_name: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          rating: number
          reviewer_name?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          rating?: number
          reviewer_name?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_reviews_company_id_fkey"
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
      company_videos: {
        Row: {
          company_id: string
          created_at: string
          id: string
          sort_order: number
          thumbnail_url: string | null
          title: string | null
          video_url: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string | null
          video_url: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_videos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_bids: {
        Row: {
          bid_amount: number
          bid_status: string
          company_id: string
          created_at: string
          created_by: string | null
          effective_bid: number
          id: string
          industry_slug: string
          period_end: string
          period_start: string
          province_slug: string
          rank: number | null
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bid_status?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          effective_bid?: number
          id?: string
          industry_slug: string
          period_end?: string
          period_start?: string
          province_slug: string
          rank?: number | null
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bid_status?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          effective_bid?: number
          id?: string
          industry_slug?: string
          period_end?: string
          period_start?: string
          province_slug?: string
          rank?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_bids_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          id: string
          import_id: string
          options: Json
          performed_at: string
          performed_by: string | null
          results: Json
          source: string
          summary: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_id: string
          options?: Json
          performed_at?: string
          performed_by?: string | null
          results?: Json
          source?: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          import_id?: string
          options?: Json
          performed_at?: string
          performed_by?: string | null
          results?: Json
          source?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: []
      }
      industrial_zones: {
        Row: {
          address: string | null
          ai_summary: string | null
          area_ha: number | null
          banner_url: string | null
          canonical_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          developer: string | null
          district: string | null
          established_year: number | null
          faqs: Json | null
          gallery_url: string[] | null
          highlights: string[] | null
          id: string
          industries: string[] | null
          is_featured: boolean
          kind: Database["public"]["Enums"]["zone_kind"]
          land_price_usd_m2_year: number | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          occupancy_percent: number | null
          province: string | null
          slug: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          area_ha?: number | null
          banner_url?: string | null
          canonical_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          developer?: string | null
          district?: string | null
          established_year?: number | null
          faqs?: Json | null
          gallery_url?: string[] | null
          highlights?: string[] | null
          id?: string
          industries?: string[] | null
          is_featured?: boolean
          kind: Database["public"]["Enums"]["zone_kind"]
          land_price_usd_m2_year?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          occupancy_percent?: number | null
          province?: string | null
          slug: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          area_ha?: number | null
          banner_url?: string | null
          canonical_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          developer?: string | null
          district?: string | null
          established_year?: number | null
          faqs?: Json | null
          gallery_url?: string[] | null
          highlights?: string[] | null
          id?: string
          industries?: string[] | null
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["zone_kind"]
          land_price_usd_m2_year?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          occupancy_percent?: number | null
          province?: string | null
          slug?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
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
      priority_cache: {
        Row: {
          company_id: string
          computed_at: string
          display_order: number
          id: string
          industry_slug: string
          priority_score: number
          province_slug: string
        }
        Insert: {
          company_id: string
          computed_at?: string
          display_order: number
          id?: string
          industry_slug: string
          priority_score: number
          province_slug: string
        }
        Update: {
          company_id?: string
          computed_at?: string
          display_order?: number
          id?: string
          industry_slug?: string
          priority_score?: number
          province_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "priority_cache_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          catalog_url: string | null
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          lead_time: string | null
          moq: string | null
          name: string
          price_range: string | null
          sort_order: number
        }
        Insert: {
          catalog_url?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lead_time?: string | null
          moq?: string | null
          name: string
          price_range?: string | null
          sort_order?: number
        }
        Update: {
          catalog_url?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lead_time?: string | null
          moq?: string | null
          name?: string
          price_range?: string | null
          sort_order?: number
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
      search_logs: {
        Row: {
          created_at: string
          filters: Json
          id: string
          query: string | null
          results_count: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          query?: string | null
          results_count?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          query?: string | null
          results_count?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      slug_redirects: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          new_slug: string
          old_slug: string
        }
        Insert: {
          created_at?: string
          entity_type?: string
          id?: string
          new_slug: string
          old_slug: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          new_slug?: string
          old_slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean
          company_id: string | null
          created_at: string
          expires_at: string
          id: string
          industry_slug: string | null
          metadata: Json
          order_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          province_slug: string | null
          reminder_sent_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          tier: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          auto_renew?: boolean
          company_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          industry_slug?: string | null
          metadata?: Json
          order_id?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          province_slug?: string | null
          reminder_sent_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean
          company_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          industry_slug?: string | null
          metadata?: Json
          order_id?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          province_slug?: string | null
          reminder_sent_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: number | null
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
      can_manage_company: { Args: { _company_id: string }; Returns: boolean }
      can_publish: { Args: { _user_id: string }; Returns: boolean }
      company_is_public: { Args: { _company_id: string }; Returns: boolean }
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
      plan_type:
        | "featured_listing"
        | "verified_badge"
        | "lead_notification"
        | "profile_verification"
        | "profile_claim"
      post_status: "draft" | "pending" | "published" | "archived"
      subscription_status: "active" | "expired" | "cancelled"
      zone_kind: "kcn" | "ccn"
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
      plan_type: [
        "featured_listing",
        "verified_badge",
        "lead_notification",
        "profile_verification",
        "profile_claim",
      ],
      post_status: ["draft", "pending", "published", "archived"],
      subscription_status: ["active", "expired", "cancelled"],
      zone_kind: ["kcn", "ccn"],
    },
  },
} as const
