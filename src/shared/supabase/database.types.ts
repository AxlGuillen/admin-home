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
      adala_prospects: {
        Row: {
          accepts_marketing: boolean
          accepts_privacy: boolean
          city: string
          consent_date: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          origin_url: string | null
          other_description: string | null
          phone: string
          service_type: string
          state_mx: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          accepts_marketing?: boolean
          accepts_privacy?: boolean
          city: string
          consent_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          origin_url?: string | null
          other_description?: string | null
          phone: string
          service_type: string
          state_mx: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          accepts_marketing?: boolean
          accepts_privacy?: boolean
          city?: string
          consent_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          origin_url?: string | null
          other_description?: string | null
          phone?: string
          service_type?: string
          state_mx?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      home_finance_cards: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          created_by: string | null
          credit_limit_cents: number | null
          cut_day: number | null
          description: string | null
          household_id: string
          id: string
          issuer: string | null
          last_four: string | null
          name: string
          owner_person_id: string | null
          payment_day: number | null
          type: Database["public"]["Enums"]["home_finance_card_type"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit_cents?: number | null
          cut_day?: number | null
          description?: string | null
          household_id: string
          id?: string
          issuer?: string | null
          last_four?: string | null
          name: string
          owner_person_id?: string | null
          payment_day?: number | null
          type: Database["public"]["Enums"]["home_finance_card_type"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit_cents?: number | null
          cut_day?: number | null
          description?: string | null
          household_id?: string
          id?: string
          issuer?: string | null
          last_four?: string | null
          name?: string
          owner_person_id?: string | null
          payment_day?: number | null
          type?: Database["public"]["Enums"]["home_finance_card_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_finance_cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "home_households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_finance_cards_owner_fkey"
            columns: ["household_id", "owner_person_id"]
            isOneToOne: false
            referencedRelation: "home_people"
            referencedColumns: ["household_id", "id"]
          },
        ]
      }
      home_finance_statement_transactions: {
        Row: {
          amount_cents: number
          category: string | null
          charge_date: string | null
          created_at: string
          description: string
          fx_rate: number | null
          household_id: string
          id: string
          kind: Database["public"]["Enums"]["home_finance_txn_kind"]
          movement_class:
            | Database["public"]["Enums"]["home_finance_txn_class"]
            | null
          operation_date: string | null
          original_amount_cents: number | null
          original_currency: string | null
          statement_id: string
        }
        Insert: {
          amount_cents: number
          category?: string | null
          charge_date?: string | null
          created_at?: string
          description: string
          fx_rate?: number | null
          household_id: string
          id?: string
          kind: Database["public"]["Enums"]["home_finance_txn_kind"]
          movement_class?:
            | Database["public"]["Enums"]["home_finance_txn_class"]
            | null
          operation_date?: string | null
          original_amount_cents?: number | null
          original_currency?: string | null
          statement_id: string
        }
        Update: {
          amount_cents?: number
          category?: string | null
          charge_date?: string | null
          created_at?: string
          description?: string
          fx_rate?: number | null
          household_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["home_finance_txn_kind"]
          movement_class?:
            | Database["public"]["Enums"]["home_finance_txn_class"]
            | null
          operation_date?: string | null
          original_amount_cents?: number | null
          original_currency?: string | null
          statement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_finance_statement_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "home_households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_finance_stmt_txn_statement_fkey"
            columns: ["statement_id", "household_id"]
            isOneToOne: false
            referencedRelation: "home_finance_statements"
            referencedColumns: ["id", "household_id"]
          },
        ]
      }
      home_finance_statements: {
        Row: {
          available_credit_cents: number | null
          card_id: string
          created_at: string
          created_by: string | null
          credit_limit_cents: number | null
          currency: string
          cut_date: string
          days_in_period: number | null
          fees_cents: number
          household_id: string
          id: string
          installment_capital_cents: number
          interest_cents: number
          minimum_payment_cents: number
          minimum_plus_installments_cents: number
          no_interest_payment_cents: number
          payment_due_date: string
          payments_credits_cents: number
          period_end: string
          period_start: string
          previous_balance_cents: number
          regular_charges_cents: number
          total_debt_cents: number
          updated_at: string
          vat_cents: number
        }
        Insert: {
          available_credit_cents?: number | null
          card_id: string
          created_at?: string
          created_by?: string | null
          credit_limit_cents?: number | null
          currency?: string
          cut_date: string
          days_in_period?: number | null
          fees_cents?: number
          household_id: string
          id?: string
          installment_capital_cents?: number
          interest_cents?: number
          minimum_payment_cents?: number
          minimum_plus_installments_cents?: number
          no_interest_payment_cents?: number
          payment_due_date: string
          payments_credits_cents?: number
          period_end: string
          period_start: string
          previous_balance_cents?: number
          regular_charges_cents?: number
          total_debt_cents?: number
          updated_at?: string
          vat_cents?: number
        }
        Update: {
          available_credit_cents?: number | null
          card_id?: string
          created_at?: string
          created_by?: string | null
          credit_limit_cents?: number | null
          currency?: string
          cut_date?: string
          days_in_period?: number | null
          fees_cents?: number
          household_id?: string
          id?: string
          installment_capital_cents?: number
          interest_cents?: number
          minimum_payment_cents?: number
          minimum_plus_installments_cents?: number
          no_interest_payment_cents?: number
          payment_due_date?: string
          payments_credits_cents?: number
          period_end?: string
          period_start?: string
          previous_balance_cents?: number
          regular_charges_cents?: number
          total_debt_cents?: number
          updated_at?: string
          vat_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "home_finance_statements_card_fkey"
            columns: ["card_id", "household_id"]
            isOneToOne: false
            referencedRelation: "home_finance_cards"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "home_finance_statements_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "home_households"
            referencedColumns: ["id"]
          },
        ]
      }
      home_household_members: {
        Row: {
          created_at: string
          household_id: string
          role: Database["public"]["Enums"]["home_household_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          role?: Database["public"]["Enums"]["home_household_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          role?: Database["public"]["Enums"]["home_household_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "home_households"
            referencedColumns: ["id"]
          },
        ]
      }
      home_households: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_people: {
        Row: {
          color: string | null
          created_at: string
          household_id: string
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          household_id: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_people_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "home_households"
            referencedColumns: ["id"]
          },
        ]
      }
      home_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ra_account_snapshots: {
        Row: {
          account_id: string
          captured_at: string
          followers: number | null
          following: number | null
          id: number
          total_likes: number | null
          total_views: number | null
          video_count: number | null
        }
        Insert: {
          account_id: string
          captured_at?: string
          followers?: number | null
          following?: number | null
          id?: never
          total_likes?: number | null
          total_views?: number | null
          video_count?: number | null
        }
        Update: {
          account_id?: string
          captured_at?: string
          followers?: number | null
          following?: number | null
          id?: never
          total_likes?: number | null
          total_views?: number | null
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ra_account_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ra_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ra_connections: {
        Row: {
          access_token: string
          account_id: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_expires_at: string | null
          refresh_token: string | null
          scope: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          account_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          account_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ra_connections_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "ra_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ra_social_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          external_id: string
          handle: string | null
          id: string
          platform: Database["public"]["Enums"]["ra_platform"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          external_id: string
          handle?: string | null
          id?: string
          platform: Database["public"]["Enums"]["ra_platform"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          external_id?: string
          handle?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["ra_platform"]
          updated_at?: string
        }
        Relationships: []
      }
      ra_video_snapshots: {
        Row: {
          captured_at: string
          comments: number
          id: number
          likes: number
          saved: number | null
          shares: number
          video_id: string
          views: number
        }
        Insert: {
          captured_at?: string
          comments: number
          id?: never
          likes: number
          saved?: number | null
          shares: number
          video_id: string
          views: number
        }
        Update: {
          captured_at?: string
          comments?: number
          id?: never
          likes?: number
          saved?: number | null
          shares?: number
          video_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "ra_video_snapshots_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "ra_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      ra_videos: {
        Row: {
          account_id: string
          caption: string | null
          created_at: string
          duration_s: number | null
          external_id: string
          hashtags: string[]
          id: string
          platform: Database["public"]["Enums"]["ra_platform"]
          published_at: string
          thumbnail_url: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          account_id: string
          caption?: string | null
          created_at?: string
          duration_s?: number | null
          external_id: string
          hashtags?: string[]
          id?: string
          platform: Database["public"]["Enums"]["ra_platform"]
          published_at: string
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          account_id?: string
          caption?: string | null
          created_at?: string
          duration_s?: number | null
          external_id?: string
          hashtags?: string[]
          id?: string
          platform?: Database["public"]["Enums"]["ra_platform"]
          published_at?: string
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ra_videos_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ra_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      home_finance_card_type: "credito" | "debito"
      home_finance_txn_class:
        | "regular"
        | "commission"
        | "msi_purchase"
        | "msi_installment"
      home_finance_txn_kind: "charge" | "payment" | "refund"
      home_household_role: "owner" | "member"
      ra_platform: "tiktok" | "instagram"
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
      home_finance_card_type: ["credito", "debito"],
      home_finance_txn_class: [
        "regular",
        "commission",
        "msi_purchase",
        "msi_installment",
      ],
      home_finance_txn_kind: ["charge", "payment", "refund"],
      home_household_role: ["owner", "member"],
      ra_platform: ["tiktok", "instagram"],
    },
  },
} as const
