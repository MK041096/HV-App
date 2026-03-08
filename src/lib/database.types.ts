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
      activation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          organization_id: string
          reserved_at: string | null
          status: string
          unit_id: string
          updated_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          organization_id: string
          reserved_at?: string | null
          status?: string
          unit_id: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          organization_id?: string
          reserved_at?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_codes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_number_sequences: {
        Row: {
          created_at: string
          id: string
          last_number: number
          organization_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_number?: number
          organization_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          last_number?: number
          organization_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_number_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_report_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          damage_report_id: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          is_internal: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          damage_report_id: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          is_internal?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          damage_report_id?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          is_internal?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_report_comments_damage_report_id_fkey"
            columns: ["damage_report_id"]
            isOneToOne: false
            referencedRelation: "damage_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_report_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_report_photos: {
        Row: {
          created_at: string
          damage_report_id: string | null
          file_name: string
          file_size: number
          id: string
          mime_type: string
          organization_id: string
          sort_order: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          damage_report_id?: string | null
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          organization_id: string
          sort_order?: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          damage_report_id?: string | null
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          organization_id?: string
          sort_order?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_report_photos_damage_report_id_fkey"
            columns: ["damage_report_id"]
            isOneToOne: false
            referencedRelation: "damage_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_report_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_report_ratings: {
        Row: {
          created_at: string
          damage_report_id: string
          id: string
          organization_id: string
          rated_by: string
          rating: boolean
          rating_deadline: string
          updated_at: string
          updated_count: number
        }
        Insert: {
          created_at?: string
          damage_report_id: string
          id?: string
          organization_id: string
          rated_by: string
          rating: boolean
          rating_deadline: string
          updated_at?: string
          updated_count?: number
        }
        Update: {
          created_at?: string
          damage_report_id?: string
          id?: string
          organization_id?: string
          rated_by?: string
          rating?: boolean
          rating_deadline?: string
          updated_at?: string
          updated_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "damage_report_ratings_damage_report_id_fkey"
            columns: ["damage_report_id"]
            isOneToOne: false
            referencedRelation: "damage_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_report_ratings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_report_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          damage_report_id: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          organization_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          damage_report_id: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          organization_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          damage_report_id?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_report_status_history_damage_report_id_fkey"
            columns: ["damage_report_id"]
            isOneToOne: false
            referencedRelation: "damage_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_report_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_reports: {
        Row: {
          access_notes: string | null
          assigned_to_company: string | null
          assigned_to_email: string | null
          assigned_to_name: string | null
          assigned_to_phone: string | null
          case_number: string
          category: string
          closed_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_deleted: boolean
          organization_id: string
          preferred_appointment: string | null
          reporter_id: string
          room: string | null
          scheduled_appointment: string | null
          status: string
          subcategory: string | null
          title: string
          unit_id: string
          updated_at: string
          urgency: string
        }
        Insert: {
          access_notes?: string | null
          assigned_to_company?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          assigned_to_phone?: string | null
          case_number: string
          category: string
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          organization_id: string
          preferred_appointment?: string | null
          reporter_id: string
          room?: string | null
          scheduled_appointment?: string | null
          status?: string
          subcategory?: string | null
          title: string
          unit_id: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          access_notes?: string | null
          assigned_to_company?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          assigned_to_phone?: string | null
          case_number?: string
          category?: string
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          organization_id?: string
          preferred_appointment?: string | null
          reporter_id?: string
          room?: string | null
          scheduled_appointment?: string | null
          status?: string
          subcategory?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          einheiten_anzahl: number
          id: string
          is_active: boolean
          is_deleted: boolean
          name: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          einheiten_anzahl?: number
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          name: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          einheiten_anzahl?: number
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          name?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          first_name: string | null
          id: string
          is_deleted: boolean
          last_name: string | null
          organization_id: string
          role: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          first_name?: string | null
          id: string
          is_deleted?: boolean
          last_name?: string | null
          organization_id: string
          role?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean
          last_name?: string | null
          organization_id?: string
          role?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
          success: boolean
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
          success?: boolean
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
          success?: boolean
        }
        Relationships: []
      }
      units: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          floor: string | null
          id: string
          is_deleted: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          floor?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          floor?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_login_rate_limit: {
        Args: {
          check_ip: unknown
          max_attempts?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          check_action: string
          check_identifier: string
          max_attempts?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      expire_activation_codes: { Args: never; Returns: number }
      generate_case_number: { Args: { org_id: string }; Returns: string }
      get_user_organization_id: { Args: never; Returns: string }
      is_platform_admin: { Args: never; Returns: boolean }
      record_login_attempt: {
        Args: {
          attempt_email: string
          attempt_ip: unknown
          attempt_success: boolean
          attempt_user_agent?: string
        }
        Returns: undefined
      }
      record_rate_limit_attempt: {
        Args: {
          attempt_action: string
          attempt_identifier: string
          attempt_success?: boolean
        }
        Returns: undefined
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
