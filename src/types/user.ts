export interface UserProfile {
  id: string;
  name: string;
  age: number;
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  trainingExperience: 'beginner' | 'intermediate' | 'advanced';
  maxWorkoutDays: number;
  sleepTarget: number; // hours
  preferences: {
    units: 'metric' | 'imperial';
    notifications: boolean;
    autoProgression: boolean;
  };
  goals: {
    primaryGoal: 'muscle_gain' | 'strength' | 'fat_loss';
    timeline: string;
    targetBodyFat?: number;
  };
  created: string;
  lastUpdated: string;
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  totalVolumeLifted: number; // kg
  averageWorkoutDuration: number; // minutes
  consistencyRate: number; // percentage
}

export interface DailyMetrics {
  date: string;
  weight?: number;
  sleepDuration?: number;
  sleepQuality?: number; // 1-10
  energyLevel?: number; // 1-10
  stressLevel?: number; // 1-10
  motivation?: number; // 1-10
  soreness?: {
    chest: number;
    back: number;
    shoulders: number;
    arms: number;
    legs: number;
    core: number;
  };
  hrv?: number;
  restingHR?: number;
  notes?: string;
}