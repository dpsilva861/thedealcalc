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
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_redirects: {
        Row: {
          created_at: string
          id: string
          new_slug: string
          old_slug: string
          post_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          new_slug: string
          old_slug: string
          post_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          new_slug?: string
          old_slug?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_redirects_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_revisions: {
        Row: {
          body_markdown: string
          created_at: string
          excerpt: string | null
          id: string
          post_id: string
          title: string
          updated_by: string | null
        }
        Insert: {
          body_markdown: string
          created_at?: string
          excerpt?: string | null
          id?: string
          post_id: string
          title: string
          updated_by?: string | null
        }
        Update: {
          body_markdown?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          post_id?: string
          title?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          view_count: number | null
          view_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          view_count?: number | null
          view_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          view_count?: number | null
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          body_markdown: string
          canonical_url: string | null
          category_id: string | null
          created_at: string
          difficulty: string | null
          excerpt: string | null
          featured: boolean | null
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          og_image_url: string | null
          posted_at: string | null
          property_type: string | null
          reading_time_minutes: number | null
          scheduled_at: string | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          series_id: string | null
          series_order: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count_30d: number | null
          view_count_total: number | null
        }
        Insert: {
          author_name?: string | null
          body_markdown: string
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          difficulty?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          og_image_url?: string | null
          posted_at?: string | null
          property_type?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          series_id?: string | null
          series_order?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count_30d?: number | null
          view_count_total?: number | null
        }
        Update: {
          author_name?: string | null
          body_markdown?: string
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          difficulty?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          og_image_url?: string | null
          posted_at?: string | null
          property_type?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          series_id?: string | null
          series_order?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count_30d?: number | null
          view_count_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "blog_series"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_series: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
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
      get_blog_tag_counts: {
        Args: never
        Returns: {
          post_count: number
          tag: string
        }[]
      }
      get_category_post_counts: {
        Args: never
        Returns: {
          category_id: string
          post_count: number
        }[]
      }
      get_posts_by_tag: {
        Args: { page_num?: number; page_size?: number; tag_filter: string }
        Returns: {
          excerpt: string
          featured_image_alt: string
          featured_image_url: string
          id: string
          posted_at: string
          reading_time_minutes: number
          slug: string
          tags: string[]
          title: string
          total_count: number
        }[]
      }
      get_related_posts: {
        Args: { limit_count?: number; post_id: string }
        Returns: {
          excerpt: string
          featured_image_url: string
          id: string
          posted_at: string
          relevance_score: number
          slug: string
          title: string
        }[]
      }
      get_series_post_counts: {
        Args: never
        Returns: {
          post_count: number
          series_id: string
        }[]
      }
      get_series_posts: {
        Args: { series_id_param: string }
        Returns: {
          id: string
          posted_at: string
          series_order: number
          slug: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_view: { Args: { post_slug: string }; Returns: undefined }
      increment_zip_count: { Args: { p_zip_code: string }; Returns: undefined }
      search_blog_posts: {
        Args: {
          category_slug?: string
          difficulty_filter?: string
          page_num?: number
          page_size?: number
          property_type_filter?: string
          search_query?: string
          series_slug?: string
          tag_filter?: string
        }
        Returns: {
          category_name: string
          difficulty: string
          excerpt: string
          featured: boolean
          featured_image_alt: string
          featured_image_url: string
          id: string
          posted_at: string
          property_type: string
          reading_time_minutes: number
          series_name: string
          slug: string
          tags: string[]
          title: string
          total_count: number
          view_count_total: number
        }[]
      }
      update_30d_view_counts: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
