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
      bookings: {
        Row: {
          created_at: string
          id: string
          match_id: string
          quote_id: string | null
          slot_end: string
          slot_start: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          quote_id?: string | null
          slot_end: string
          slot_start: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          quote_id?: string | null
          slot_end?: string
          slot_start?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      client_briefs: {
        Row: {
          budget_high: number | null
          budget_low: number | null
          city: string | null
          client_user_id: string
          created_at: string
          date_window_end: string | null
          date_window_start: string | null
          geo_lat: number | null
          geo_lng: number | null
          id: string
          lifestyle: string | null
          mood_tags: string[] | null
          notes: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          budget_high?: number | null
          budget_low?: number | null
          city?: string | null
          client_user_id: string
          created_at?: string
          date_window_end?: string | null
          date_window_start?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          lifestyle?: string | null
          mood_tags?: string[] | null
          notes?: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          budget_high?: number | null
          budget_low?: number | null
          city?: string | null
          client_user_id?: string
          created_at?: string
          date_window_end?: string | null
          date_window_start?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          lifestyle?: string | null
          mood_tags?: string[] | null
          notes?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_briefs_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          availability_blocks: Json | null
          created_at: string
          id: string
          price_band_high: number | null
          price_band_low: number | null
          rating_avg: number | null
          review_count: number | null
          styles: string[] | null
          travel_radius_km: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          availability_blocks?: Json | null
          created_at?: string
          id?: string
          price_band_high?: number | null
          price_band_low?: number | null
          rating_avg?: number | null
          review_count?: number | null
          styles?: string[] | null
          travel_radius_km?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          availability_blocks?: Json | null
          created_at?: string
          id?: string
          price_band_high?: number | null
          price_band_low?: number | null
          rating_avg?: number | null
          review_count?: number | null
          styles?: string[] | null
          travel_radius_km?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          brief_id: string | null
          client_liked: boolean | null
          client_user_id: string
          created_at: string
          creator_liked: boolean | null
          creator_user_id: string
          id: string
          match_score: number | null
          status: string | null
        }
        Insert: {
          brief_id?: string | null
          client_liked?: boolean | null
          client_user_id: string
          created_at?: string
          creator_liked?: boolean | null
          creator_user_id: string
          id?: string
          match_score?: number | null
          status?: string | null
        }
        Update: {
          brief_id?: string | null
          client_liked?: boolean | null
          client_user_id?: string
          created_at?: string
          creator_liked?: boolean | null
          creator_user_id?: string
          id?: string
          match_score?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "client_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          match_id: string
          sender_user_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          sender_user_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          sender_user_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_images: {
        Row: {
          created_at: string
          creator_user_id: string
          id: string
          tags: string[] | null
          url: string
        }
        Insert: {
          created_at?: string
          creator_user_id: string
          id?: string
          tags?: string[] | null
          url: string
        }
        Update: {
          created_at?: string
          creator_user_id?: string
          id?: string
          tags?: string[] | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_images_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          id: string
          match_id: string
          proposed_price: number
          proposed_slot_end: string
          proposed_slot_start: string
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          proposed_price: number
          proposed_slot_end: string
          proposed_slot_start: string
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          proposed_price?: number
          proposed_slot_end?: string
          proposed_slot_start?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          client_user_id: string
          created_at: string
          creator_user_id: string
          id: string
          rating_int: number
          text: string | null
        }
        Insert: {
          booking_id: string
          client_user_id: string
          created_at?: string
          creator_user_id: string
          id?: string
          rating_int: number
          text?: string | null
        }
        Update: {
          booking_id?: string
          client_user_id?: string
          created_at?: string
          creator_user_id?: string
          id?: string
          rating_int?: number
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          creator_user_id: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          renews_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_user_id: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          renews_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_user_id?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          renews_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: true
            referencedRelation: "users_extended"
            referencedColumns: ["id"]
          },
        ]
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
      users_extended: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          geo_lat?: number | null
          geo_lng?: number | null
          id: string
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
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
      app_role: "admin" | "creator" | "client"
      project_type:
        | "wedding"
        | "portrait"
        | "product"
        | "event"
        | "commercial"
        | "real_estate"
        | "other"
      subscription_plan: "free" | "pro" | "pro_plus"
      user_role: "creator" | "client" | "admin"
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
      app_role: ["admin", "creator", "client"],
      project_type: [
        "wedding",
        "portrait",
        "product",
        "event",
        "commercial",
        "real_estate",
        "other",
      ],
      subscription_plan: ["free", "pro", "pro_plus"],
      user_role: ["creator", "client", "admin"],
    },
  },
} as const
