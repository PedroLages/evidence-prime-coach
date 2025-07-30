import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type Profile = Tables['profiles']['Row'];
type Exercise = Tables['exercises']['Row'];
type WorkoutTemplate = Tables['workout_templates']['Row'];
type WorkoutSession = Tables['workout_sessions']['Row'];
type ReadinessMetric = Tables['readiness_metrics']['Row'];
type AIInsight = Tables['ai_insights']['Row'];
type ProgressionData = Tables['progression_data']['Row'];

// Profile API
export const profileAPI = {
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createOrUpdateProfile(profileData: Partial<Profile>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profileData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Exercise API
export const exerciseAPI = {
  async getAllExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('category', category)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }
};

// Workout Template API
export const workoutTemplateAPI = {
  async getUserTemplates(): Promise<WorkoutTemplate[]> {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createTemplate(template: Omit<WorkoutTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<WorkoutTemplate> {
    const { data, error } = await supabase
      .from('workout_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Workout Session API
export const workoutSessionAPI = {
  async getUserSessions(limit = 50): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async createSession(session: Omit<WorkoutSession, 'id' | 'created_at'>): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSession(id: string, updates: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Readiness Metrics API
export const readinessAPI = {
  async getTodaysMetrics(): Promise<ReadinessMetric | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('readiness_metrics')
      .select('*')
      .eq('date', today)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getRecentMetrics(days = 30): Promise<ReadinessMetric[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('readiness_metrics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async saveMetrics(metrics: Omit<ReadinessMetric, 'id' | 'created_at'>): Promise<ReadinessMetric> {
    const { data, error } = await supabase
      .from('readiness_metrics')
      .upsert(metrics, { onConflict: 'user_id,date' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// AI Insights API
export const aiInsightsAPI = {
  async getUnreadInsights(): Promise<AIInsight[]> {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async createInsight(insight: Omit<AIInsight, 'id' | 'created_at'>): Promise<AIInsight> {
    const { data, error } = await supabase
      .from('ai_insights')
      .insert(insight)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Progression Data API
export const progressionAPI = {
  async getUserProgressions(): Promise<ProgressionData[]> {
    const { data, error } = await supabase
      .from('progression_data')
      .select('*, exercises(*)')
      .order('last_updated', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updateProgression(exerciseId: string, progressionData: Partial<ProgressionData>): Promise<ProgressionData> {
    const { data, error } = await supabase
      .from('progression_data')
      .upsert(
        { exercise_id: exerciseId, ...progressionData },
        { onConflict: 'user_id,exercise_id' }
      )
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};