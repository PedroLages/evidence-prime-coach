export interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'isolation' | 'cardio';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips: string[];
  videoUrl?: string;
  imageUrl?: string;
  variations: string[];
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number; // kg
  rpe?: number; // 1-10 Rate of Perceived Exertion
  restTime?: number; // seconds
  completed: boolean;
  notes?: string;
  timestamp?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: string; // e.g., "8-12", "5", "3-5"
  targetWeight?: number;
  sets: WorkoutSet[];
  notes?: string;
  substitution?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutType: WorkoutType;
  exercises: WorkoutExercise[];
  duration?: number; // minutes
  totalVolume?: number; // kg
  averageRPE?: number;
  notes?: string;
  completed: boolean;
  startTime?: string;
  endTime?: string;
}

export type WorkoutType = 
  | 'upper_power'
  | 'lower_power' 
  | 'upper_hypertrophy'
  | 'lower_hypertrophy'
  | 'arms_weak_points'
  | 'active_recovery'
  | 'cardio_liss';

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: WorkoutType;
  description: string;
  targetDuration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: {
    exerciseId: string;
    order: number;
    sets: number;
    reps: string;
    restTime: number;
    notes?: string;
  }[];
}

export interface WeeklyProgram {
  week: number;
  focus: 'power' | 'hypertrophy' | 'deload';
  workouts: {
    day: number; // 1-7
    workoutType: WorkoutType | 'rest';
    templateId?: string;
  }[];
}

export interface ProgressionRule {
  exerciseId: string;
  metric: 'weight' | 'reps' | 'sets';
  trigger: {
    type: 'rpe_threshold' | 'consecutive_completions' | 'time_based';
    value: number;
  };
  progression: {
    amount: number;
    unit: 'kg' | 'lbs' | 'reps' | 'percentage';
  };
}