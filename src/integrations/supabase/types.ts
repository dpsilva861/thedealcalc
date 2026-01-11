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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      billing_private: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          body_markdown: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          posted_at: string | null
          reading_time_minutes: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body_markdown: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          posted_at?: string | null
          reading_time_minutes?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body_markdown?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          posted_at?: string | null
          reading_time_minutes?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_issues: {
        Row: {
          blog_post_id: string | null
          body_markdown: string
          created_at: string
          created_by: string | null
          id: string
          published_at: string | null
          scheduled_at: string | null
          send_count: number | null
          sent_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          tldr_bullets: string[] | null
          updated_at: string
        }
        Insert: {
          blog_post_id?: string | null
          body_markdown: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          send_count?: number | null
          sent_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          tldr_bullets?: string[] | null
          updated_at?: string
        }
        Update: {
          blog_post_id?: string | null
          body_markdown?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          send_count?: number | null
          sent_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          tldr_bullets?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_issues_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_send_log: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          issue_id: string
          sent_at: string | null
          status: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          issue_id: string
          sent_at?: string | null
          status?: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          issue_id?: string
          sent_at?: string | null
          status?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_send_log_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_send_log_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirm_token_hash: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          status: string
          unsubscribe_token_hash: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirm_token_hash?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          status?: string
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirm_token_hash?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          status?: string
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          analyses_used: number
          created_at: string
          free_analyses_limit: number
          id: string
          plan_tier: string
          selected_calculator: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyses_used?: number
          created_at?: string
          free_analyses_limit?: number
          id?: string
          plan_tier?: string
          selected_calculator?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyses_used?: number
          created_at?: string
          free_analyses_limit?: number
          id?: string
          plan_tier?: string
          selected_calculator?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_analyses: {
        Row: {
          address: string
          city: string | null
          created_at: string
          id: string
          inputs: Json
          results: Json
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          id?: string
          inputs: Json
          results: Json
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          results?: Json
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      zip_codes: {
        Row: {
          analysis_count: number
          city: string | null
          created_at: string
          id: string
          state: string | null
          updated_at: string
          zip_code: string
        }
        Insert: {
          analysis_count?: number
          city?: string | null
          created_at?: string
          id?: string
          state?: string | null
          updated_at?: string
          zip_code: string
        }
        Update: {
          analysis_count?: number
          city?: string | null
          created_at?: string
          id?: string
          state?: string | null
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_zip_count: { Args: { p_zip_code: string }; Returns: undefined }
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
