export interface PerformanceMetric {
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  rpe: number;
  volume: number;
  oneRM: number;
  intensity: number; // % of 1RM
}

export interface TrendAnalysis {
  exercise: string;
  direction: 'improving' | 'stable' | 'declining';
  slope: number;
  confidence: number;
  dataPoints: number;
  timeframe: string;
  projectedGains: {
    oneWeek: number;
    oneMonth: number;
    threeMonths: number;
  };
}

export interface ComparisonMetrics {
  exercise: string;
  current: {
    oneRM: number;
    volume: number;
    frequency: number;
  };
  previous: {
    oneRM: number;
    volume: number;
    frequency: number;
  };
  changes: {
    oneRM: number;
    volume: number;
    frequency: number;
  };
  percentChanges: {
    oneRM: number;
    volume: number;
    frequency: number;
  };
}

export interface ProgressAnalysis {
  overallScore: number;
  trends: TrendAnalysis[];
  comparisons: ComparisonMetrics[];
  achievements: Achievement[];
  recommendations: ProgressRecommendation[];
  projections: PerformanceProjection[];
}

export interface Achievement {
  id: string;
  type: 'pr' | 'volume' | 'consistency' | 'milestone';
  title: string;
  description: string;
  date: string;
  exercise?: string;
  value: number;
  unit: string;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface ProgressRecommendation {
  id: string;
  category: 'strength' | 'volume' | 'frequency' | 'recovery';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
  expectedOutcome: string;
  timeframe: string;
  confidence: number;
}

export interface PerformanceProjection {
  exercise: string;
  metric: 'oneRM' | 'volume' | 'frequency';
  timeframes: {
    oneWeek: { value: number; confidence: number };
    oneMonth: { value: number; confidence: number };
    threeMonths: { value: number; confidence: number };
    sixMonths: { value: number; confidence: number };
  };
  methodology: string;
}

export interface WorkoutAnalytics {
  totalWorkouts: number;
  totalVolume: number;
  averageRPE: number;
  averageDuration: number;
  consistency: {
    weeklyAverage: number;
    streak: number;
    longestStreak: number;
  };
  exerciseBreakdown: {
    exercise: string;
    frequency: number;
    totalVolume: number;
    avgWeight: number;
    lastPerformed: string;
  }[];
}

export interface AnalyticsTimeframe {
  value: number;
  unit: 'days' | 'weeks' | 'months';
  label: string;
}