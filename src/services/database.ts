import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Profile types and functions
export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  fitness_level: string | null;
  primary_goals: string[] | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createProfile(user: User, additionalData?: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      ...additionalData
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}

// Workout Templates
export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty_level: string;
  estimated_duration: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export async function getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .or(`user_id.eq.${userId},is_public.eq.true`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workout templates:', error);
    return [];
  }

  return data || [];
}

export async function createWorkoutTemplate(template: Omit<WorkoutTemplate, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('workout_templates')
    .insert(template)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout template:', error);
    throw error;
  }

  return data;
}

// Workout Sessions
export interface WorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  total_volume: number | null;
  average_rpe: number | null;
  notes: string | null;
  created_at: string;
}

export async function getWorkoutSessions(userId: string, limit: number = 50): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching workout sessions:', error);
    return [];
  }

  return data || [];
}

export async function createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    console.error('Error creating workout session:', error);
    throw error;
  }

  return data;
}

export async function updateWorkoutSession(sessionId: string, updates: Partial<WorkoutSession>) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating workout session:', error);
    throw error;
  }

  return data;
}

// Daily Metrics
export interface DailyMetric {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  energy_level: number | null;
  soreness_level: number | null;
  stress_level: number | null;
  hrv_score: number | null;
  resting_hr: number | null;
  motivation_level: number | null;
  notes: string | null;
  created_at: string;
}

export async function getDailyMetrics(userId: string, days: number = 30): Promise<DailyMetric[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching daily metrics:', error);
    return [];
  }

  return data || [];
}

export async function upsertDailyMetric(metric: Omit<DailyMetric, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .upsert(metric, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting daily metric:', error);
    throw error;
  }

  return data;
}

// Performance Metrics
export interface PerformanceMetric {
  id: string;
  user_id: string;
  exercise_id: string;
  session_id: string | null;
  metric_type: 'volume' | 'one_rm' | 'rpe' | 'duration' | 'distance';
  value: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export async function getPerformanceMetrics(userId: string, exerciseId?: string, days: number = 90): Promise<PerformanceMetric[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from('performance_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (exerciseId) {
    query = query.eq('exercise_id', exerciseId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching performance metrics:', error);
    return [];
  }

  return (data || []) as PerformanceMetric[];
}

export async function createPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('performance_metrics')
    .insert(metric)
    .select()
    .single();

  if (error) {
    console.error('Error creating performance metric:', error);
    throw error;
  }

  return data;
}

// Exercises
export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment: string[] | null;
  instructions: string | null;
  video_url: string | null;
  difficulty_level: string;
  created_at: string;
}

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }

  return data || [];
}