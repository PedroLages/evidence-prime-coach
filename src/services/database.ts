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
  age: number | null;
  height: number | null;
  weight: number | null;
  target_weight: number | null;
  unit_system: string | null;
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

  if (!data) return null;

  // Ensure all required fields are present
  return {
    id: data.id,
    full_name: data.full_name || null,
    email: data.email || null,
    fitness_level: data.fitness_level || 'beginner',
    primary_goals: data.primary_goals || null,
    avatar_url: data.avatar_url || null,
    age: (data as any).age || null,
    height: (data as any).height || null,
    weight: (data as any).weight || null,
    target_weight: (data as any).target_weight || null,
    unit_system: (data as any).unit_system || 'metric',
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function createProfile(user: User, additionalData?: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      fitness_level: 'beginner',
      age: null,
      height: null,
      weight: null,
      target_weight: null,
      unit_system: 'metric',
      ...additionalData
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  // Return the created profile with proper typing
  return {
    id: data.id,
    full_name: data.full_name || null,
    email: data.email || null,
    fitness_level: data.fitness_level || 'beginner',
    primary_goals: data.primary_goals || null,
    avatar_url: data.avatar_url || null,
    age: (data as any).age || null,
    height: (data as any).height || null,
    weight: (data as any).weight || null,
    target_weight: (data as any).target_weight || null,
    unit_system: (data as any).unit_system || 'metric',
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}

// User Settings - TODO: Implement when user_settings table exists
export interface UserSettings {
  id: string;
  user_id: string;
  notifications: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    aiInsights: boolean;
    weeklyReports: boolean;
  };
  privacy: {
    shareProgress: boolean;
    publicProfile: boolean;
    analyticsData: boolean;
  };
  created_at: string;
  updated_at: string;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  // TODO: Implement when user_settings table exists
  return null;
}

export async function createUserSettings(userId: string): Promise<UserSettings> {
  // TODO: Implement when user_settings table exists
  throw new Error('User settings not implemented yet');
}

export async function updateUserSettings(userId: string, settings: Partial<Pick<UserSettings, 'notifications' | 'privacy'>>): Promise<UserSettings> {
  // TODO: Implement when user_settings table exists
  throw new Error('User settings not implemented yet');
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
  source_type?: 'user' | 'ai_generated' | 'system';
  ai_metadata?: {
    confidence_score?: number;
    reasoning?: string;
    adaptations?: string[];
    warmup_count?: number;
    cooldown_count?: number;
  };
  generation_params?: {
    workout_type?: string;
    target_duration?: number;
    fitness_level?: string;
    equipment?: string[];
    muscle_groups?: string[];
    intensity_preference?: string;
  };
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

// AI Workout specific functions
export interface AIWorkoutData {
  id: string;
  name: string;
  type: string;
  estimatedDuration: number;
  targetIntensity: number;
  exercises: any[];
  warmup?: any[];
  cooldown?: any[];
  adaptations: {
    readinessAdjustments: string[];
    equipmentSubstitutions: string[];
    progressiveOverload: string[];
  };
  confidence: number;
  reasoning: string[];
  metadata: {
    totalVolume: number;
    averageIntensity: number;
    muscleGroupBalance: Record<string, number>;
    generatedAt: string;
  };
}

export async function saveAIWorkoutAsTemplate(
  userId: string,
  aiWorkout: AIWorkoutData,
  generationParams: any
): Promise<WorkoutTemplate> {
  // Create the template first
  const template: Omit<WorkoutTemplate, 'id' | 'created_at' | 'updated_at'> = {
    user_id: userId,
    name: aiWorkout.name,
    description: `AI-generated ${aiWorkout.type} workout - ${aiWorkout.reasoning?.[0] || 'Personalized for your fitness goals'}`,
    category: aiWorkout.type,
    difficulty_level: generationParams.fitnessLevel || 'intermediate',
    estimated_duration: aiWorkout.estimatedDuration,
    is_public: false,
    source_type: 'ai_generated',
    ai_metadata: {
      confidence_score: aiWorkout.confidence,
      reasoning: aiWorkout.reasoning?.join('; '),
      adaptations: [
        ...aiWorkout.adaptations.readinessAdjustments,
        ...aiWorkout.adaptations.equipmentSubstitutions,
        ...aiWorkout.adaptations.progressiveOverload
      ],
      warmup_count: aiWorkout.warmup?.length || 0,
      cooldown_count: aiWorkout.cooldown?.length || 0
    },
    generation_params: {
      workout_type: generationParams.workoutType,
      target_duration: generationParams.targetDuration,
      fitness_level: generationParams.fitnessLevel,
      equipment: generationParams.availableEquipment,
      muscle_groups: generationParams.targetMuscleGroups,
      intensity_preference: generationParams.intensityPreference
    }
  };

  const { data: savedTemplate, error: templateError } = await supabase
    .from('workout_templates')
    .insert(template)
    .select()
    .single();

  if (templateError) {
    console.error('Error saving AI workout template:', templateError);
    throw templateError;
  }

  // Save the exercises (main + warmup + cooldown)
  const allExercises = [
    ...(aiWorkout.warmup?.map((ex, index) => ({ ...ex, category: 'warmup', order: index })) || []),
    ...aiWorkout.exercises.map((ex, index) => ({ ...ex, category: 'main', order: index + (aiWorkout.warmup?.length || 0) })),
    ...(aiWorkout.cooldown?.map((ex, index) => ({ ...ex, category: 'cooldown', order: index + (aiWorkout.warmup?.length || 0) + aiWorkout.exercises.length })) || [])
  ];

  const templateExercises = allExercises.map((exercise, index) => ({
    template_id: savedTemplate.id,
    exercise_id: exercise.exerciseId,
    order_index: index,
    sets: exercise.targetSets || 1,
    reps: typeof exercise.targetReps === 'string' ? parseInt(exercise.targetReps.split('-')[0]) || 10 : exercise.targetReps,
    weight: exercise.targetWeight || null,
    rest_seconds: exercise.restTime || 60,
    notes: exercise.notes || `RPE: ${exercise.targetRPE || 'N/A'} | ${exercise.category || 'main'} exercise`
  }));

  if (templateExercises.length > 0) {
    const { error: exercisesError } = await supabase
      .from('workout_template_exercises')
      .insert(templateExercises);

    if (exercisesError) {
      console.error('Error saving template exercises:', exercisesError);
      // Clean up the template if exercises failed to save
      await supabase.from('workout_templates').delete().eq('id', savedTemplate.id);
      throw exercisesError;
    }
  }

  return savedTemplate;
}

export async function getAIWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('source_type', 'ai_generated')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching AI workout templates:', error);
    throw error;
  }

  return data || [];
}

export async function deleteAIWorkoutTemplate(templateId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId)
    .eq('source_type', 'ai_generated');

  if (error) {
    console.error('Error deleting AI workout template:', error);
    throw error;
  }
}

// Workout Template Exercises
export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: number;
  weight: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export async function createTemplateExercise(templateExercise: Omit<WorkoutTemplateExercise, 'id'>): Promise<WorkoutTemplateExercise> {
  const { data, error } = await supabase
    .from('workout_template_exercises')
    .insert(templateExercise)
    .select()
    .single();

  if (error) {
    console.error('Error creating template exercise:', error);
    throw error;
  }

  return data;
}

export async function getTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
  const { data, error } = await supabase
    .from('workout_template_exercises')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('template_id', templateId)
    .order('order_index');

  if (error) {
    console.error('Error fetching template exercises:', error);
    return [];
  }

  return data || [];
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

// Extended workout session with exercises and sets for analytics
export interface WorkoutSessionWithExercises extends WorkoutSession {
  exercises: {
    id: string;
    name: string;
    category: string;
    sets: {
      id: string;
      weight: number | null;
      reps: number | null;
      rpe: number | null;
      rest_time: number | null;
      notes: string | null;
      is_personal_record: boolean;
    }[];
  }[];
}

export async function getWorkoutSessionsWithExercises(userId: string, limit: number = 50): Promise<WorkoutSessionWithExercises[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout_session_exercises (
        id,
        exercise:exercises (
          id,
          name,
          category
        ),
        sets (
          id,
          weight,
          reps,
          rpe,
          rest_time,
          notes,
          is_personal_record
        )
      )
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching workout sessions with exercises:', error);
    return [];
  }

  // Transform the data to match the expected structure
  return (data || []).map(session => ({
    ...session,
    exercises: (session.workout_session_exercises || []).map((sessionExercise: any) => ({
      id: sessionExercise.exercise?.id || '',
      name: sessionExercise.exercise?.name || 'Unknown Exercise',
      category: sessionExercise.exercise?.category || 'Other',
      sets: sessionExercise.sets || []
    }))
  }));
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
  image_url: string | null;
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

export async function createCustomExercise(exercise: {
  name: string;
  category: string;
  muscle_groups: string[];
  equipment: string[];
  instructions: string;
  video_url?: string;
  image_url?: string;
  difficulty_level: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_custom_exercise', {
    exercise_name: exercise.name,
    exercise_category: exercise.category,
    exercise_muscle_groups: exercise.muscle_groups,
    exercise_equipment: exercise.equipment,
    exercise_instructions: exercise.instructions,
    exercise_video_url: exercise.video_url || null,
    exercise_image_url: exercise.image_url || null,
    exercise_difficulty_level: exercise.difficulty_level
  });

  if (error) {
    console.error('Error creating custom exercise:', error);
    throw error;
  }

  return data;
}

// Body Measurements
export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  waist: number | null;
  chest: number | null;
  arms: number | null;
  thighs: number | null;
  hips: number | null;
  neck: number | null;
  height: number | null;
  unit_system: 'metric' | 'imperial';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getBodyMeasurements(userId: string, limit: number = 50): Promise<BodyMeasurement[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching body measurements:', error);
    return [];
  }

  return (data || []) as BodyMeasurement[];
}

export async function createBodyMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'created_at' | 'updated_at'>): Promise<BodyMeasurement> {
  const { data, error } = await supabase
    .from('body_measurements')
    .insert(measurement)
    .select()
    .single();

  if (error) {
    console.error('Error creating body measurement:', error);
    throw error;
  }

  return data as BodyMeasurement;
}

export async function updateBodyMeasurement(id: string, updates: Partial<BodyMeasurement>): Promise<BodyMeasurement> {
  const { data, error } = await supabase
    .from('body_measurements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating body measurement:', error);
    throw error;
  }

  return data as BodyMeasurement;
}

// Progress Photos
export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  photo_type: 'front' | 'side' | 'back' | 'other';
  image_url: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProgressPhotos(userId: string, limit: number = 50): Promise<ProgressPhoto[]> {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching progress photos:', error);
    return [];
  }

  return (data || []) as ProgressPhoto[];
}

export async function createProgressPhoto(photo: Omit<ProgressPhoto, 'id' | 'created_at' | 'updated_at'>): Promise<ProgressPhoto> {
  const { data, error } = await supabase
    .from('progress_photos')
    .insert(photo)
    .select()
    .single();

  if (error) {
    console.error('Error creating progress photo:', error);
    throw error;
  }

  return data as ProgressPhoto;
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  const { error } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting progress photo:', error);
    throw error;
  }
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
}

export async function deleteWorkoutTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting workout template:', error);
    throw error;
  }
}