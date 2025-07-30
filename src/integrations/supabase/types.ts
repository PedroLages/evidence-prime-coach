export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          data: Json | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_read: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          data?: Json | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_read?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          data?: Json | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_read?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          arms: number | null
          body_fat_percentage: number | null
          chest: number | null
          created_at: string
          date: string
          height: number | null
          hips: number | null
          id: string
          muscle_mass: number | null
          neck: number | null
          notes: string | null
          thighs: number | null
          unit_system: string | null
          updated_at: string
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          arms?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string
          date?: string
          height?: number | null
          hips?: number | null
          id?: string
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          thighs?: number | null
          unit_system?: string | null
          updated_at?: string
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arms?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string
          date?: string
          height?: number | null
          hips?: number | null
          id?: string
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          thighs?: number | null
          unit_system?: string | null
          updated_at?: string
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          created_at: string | null
          date: string
          energy_level: number | null
          hrv_score: number | null
          id: string
          motivation_level: number | null
          notes: string | null
          resting_hr: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          soreness_level: number | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          energy_level?: number | null
          hrv_score?: number | null
          id?: string
          motivation_level?: number | null
          notes?: string | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_level?: number | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          energy_level?: number | null
          hrv_score?: number | null
          id?: string
          motivation_level?: number | null
          notes?: string | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_level?: number | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          difficulty_level: string | null
          equipment: string[] | null
          id: string
          image_url: string | null
          instructions: string | null
          muscle_groups: string[]
          name: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          difficulty_level?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_groups: string[]
          name: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          difficulty_level?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_groups?: string[]
          name?: string
          video_url?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          date: string
          exercise_id: string
          id: string
          metric_type: string | null
          notes: string | null
          session_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          exercise_id: string
          id?: string
          metric_type?: string | null
          notes?: string | null
          session_id?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          exercise_id?: string
          id?: string
          metric_type?: string | null
          notes?: string | null
          session_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          fitness_level: string | null
          full_name: string | null
          id: string
          primary_goals: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fitness_level?: string | null
          full_name?: string | null
          id: string
          primary_goals?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fitness_level?: string | null
          full_name?: string | null
          id?: string
          primary_goals?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          image_url: string
          notes: string | null
          photo_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          image_url: string
          notes?: string | null
          photo_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          image_url?: string
          notes?: string | null
          photo_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progression_data: {
        Row: {
          calculation_method: string | null
          confidence_score: number | null
          created_at: string
          data_points: Json | null
          estimated_1rm: number | null
          exercise_id: string | null
          id: string
          last_updated: string | null
          user_id: string | null
        }
        Insert: {
          calculation_method?: string | null
          confidence_score?: number | null
          created_at?: string
          data_points?: Json | null
          estimated_1rm?: number | null
          exercise_id?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string | null
        }
        Update: {
          calculation_method?: string | null
          confidence_score?: number | null
          created_at?: string
          data_points?: Json | null
          estimated_1rm?: number | null
          exercise_id?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progression_data_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progression_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_metrics: {
        Row: {
          created_at: string
          date: string
          energy_level: number | null
          hrv_score: number | null
          id: string
          motivation: number | null
          muscle_soreness: number | null
          overall_readiness: number | null
          sleep_quality: number | null
          stress_level: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          energy_level?: number | null
          hrv_score?: number | null
          id?: string
          motivation?: number | null
          muscle_soreness?: number | null
          overall_readiness?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          energy_level?: number | null
          hrv_score?: number | null
          id?: string
          motivation?: number | null
          muscle_soreness?: number | null
          overall_readiness?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "readiness_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          reps: number | null
          rest_seconds: number | null
          rpe: number | null
          session_exercise_id: string | null
          set_number: number
          weight: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rpe?: number | null
          session_exercise_id?: string | null
          set_number: number
          weight?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          reps?: number | null
          rest_seconds?: number | null
          rpe?: number | null
          session_exercise_id?: string | null
          set_number?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_exercises: {
        Row: {
          created_at: string
          exercise_id: string | null
          id: string
          order_index: number
          session_id: string | null
          sets_completed: number | null
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          order_index: number
          session_id?: string | null
          sets_completed?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          order_index?: number
          session_id?: string | null
          sets_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          average_rpe: number | null
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          name: string
          notes: string | null
          started_at: string
          template_id: string | null
          total_volume: number | null
          user_id: string | null
        }
        Insert: {
          average_rpe?: number | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          name: string
          notes?: string | null
          started_at?: string
          template_id?: string | null
          total_volume?: number | null
          user_id?: string | null
        }
        Update: {
          average_rpe?: number | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          name?: string
          notes?: string | null
          started_at?: string
          template_id?: string | null
          total_volume?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          exercise_id: string | null
          id: string
          notes: string | null
          order_index: number
          reps: number | null
          rest_seconds: number | null
          sets: number | null
          template_id: string | null
          weight: number | null
        }
        Insert: {
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_index: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          template_id?: string | null
          weight?: number | null
        }
        Update: {
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          template_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_custom_exercise: {
        Args: {
          exercise_name: string
          exercise_category: string
          exercise_muscle_groups: string[]
          exercise_equipment: string[]
          exercise_instructions: string
          exercise_video_url: string
          exercise_image_url: string
          exercise_difficulty_level: string
        }
        Returns: string
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
