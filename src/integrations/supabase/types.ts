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
      achievements: {
        Row: {
          achievement_type: string
          badge_color: string | null
          badge_icon: string | null
          created_at: string | null
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          achievement_type: string
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string | null
          criteria: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          achievement_type?: string
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
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
      challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_value: number | null
          id: string
          is_completed: boolean | null
          joined_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          joined_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          joined_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          max_participants: number | null
          prize_description: string | null
          start_date: string
          target_unit: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          prize_description?: string | null
          start_date: string
          target_unit?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          prize_description?: string | null
          start_date?: string
          target_unit?: string | null
          target_value?: number | null
          title?: string
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
      leaderboard_entries: {
        Row: {
          calculated_at: string | null
          id: string
          metric_type: string
          rank_position: number | null
          time_period: string
          user_id: string
          value: number
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          metric_type: string
          rank_position?: number | null
          time_period: string
          user_id: string
          value: number
        }
        Update: {
          calculated_at?: string | null
          id?: string
          metric_type?: string
          rank_position?: number | null
          time_period?: string
          user_id?: string
          value?: number
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
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
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
      social_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          data: Json | null
          id: string
          is_public: boolean | null
          likes_count: number | null
          post_type: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          post_type: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          post_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          progress_data: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          progress_data?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          progress_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
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
