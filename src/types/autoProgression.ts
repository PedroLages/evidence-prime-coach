// Auto-Progression Type System

export interface OneRMEstimate {
  exercise: string;
  estimate: number;
  confidence: number;
  method: 'epley' | 'brzycki' | 'lombardi' | 'mayhew' | 'composite';
  dataPoints: number;
  lastUpdated: string;
  basedOnWeight: number;
  basedOnReps: number;
  historicalData: {
    date: string;
    weight: number;
    reps: number;
    rpe?: number;
  }[];
}

export interface ProgressionRule {
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  exerciseType: 'squat' | 'bench' | 'deadlift' | 'ohp' | 'accessory';
  phaseType: 'strength' | 'hypertrophy' | 'power' | 'peaking';
  weeklyIncrease: {
    weight: number; // kg per week
    percentage: number; // % of current weight
  };
  plateauThreshold: number; // sessions without progress
  deloadTrigger: {
    failedSessions: number;
    rpeThreshold: number;
    volumeDropPercent: number;
  };
}

export interface ProgressionSuggestion {
  id: string;
  exercise: string;
  type: 'weight_increase' | 'rep_increase' | 'volume_increase' | 'deload' | 'plateau_break';
  current: {
    weight: number;
    reps: number;
    sets: number;
    rpe?: number;
  };
  suggested: {
    weight: number;
    reps: number;
    sets: number;
    reasoning: string;
  };
  confidence: number;
  reasoning: string;
  evidence: string[];
  timeframe: 'next_session' | 'next_week' | 'next_cycle';
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastPerformance: {
    date: string;
    weight: number;
    reps: number;
    rpe: number;
    completed: boolean;
  }[];
}

export interface PlateauAnalysis {
  exercise: string;
  isDetected: boolean;
  duration: number; // sessions
  severity: 'mild' | 'moderate' | 'severe';
  type: 'weight_stall' | 'rep_stall' | 'volume_decline' | 'rpe_inflation';
  confidence: number;
  trend: {
    direction: 'declining' | 'stable' | 'volatile';
    significance: number;
    dataPoints: number;
  };
  recommendations: {
    type: 'deload' | 'technique_focus' | 'exercise_variation' | 'volume_adjustment' | 'frequency_change';
    description: string;
    implementation: string;
    expectedDuration: number; // weeks
    successMetrics: string[];
  }[];
  nextReviewDate: string;
}

export interface RPEPattern {
  exercise: string;
  averageRPE: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  consistency: number; // 0-1, higher = more consistent
  sessions: {
    date: string;
    plannedRPE: number;
    actualRPE: number;
    weight: number;
    reps: number;
    deviation: number;
  }[];
  analysis: {
    overreaching: boolean;
    underperforming: boolean;
    optimalLoad: boolean;
    confidence: number;
  };
  recommendations: string[];
}

export interface AutoProgressionSettings {
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'strength' | 'hypertrophy' | 'power' | 'endurance';
  plateauSensitivity: 'low' | 'medium' | 'high';
  preferredProgressionStyle: 'linear' | 'block' | 'daily_undulating' | 'conjugate';
  rpeTarget: {
    strength: number; // target RPE for strength work
    hypertrophy: number; // target RPE for hypertrophy work
    technique: number; // target RPE for technique work
  };
  deloadPreference: {
    frequency: number; // weeks between deloads
    intensity: number; // % reduction during deload
    volume: number; // % reduction during deload
  };
  exercisePriority: string[]; // ordered list of exercise names
}

export interface ProgressionHistory {
  exercise: string;
  timeline: {
    date: string;
    suggestion: ProgressionSuggestion;
    userAction: 'accepted' | 'modified' | 'rejected';
    actualPerformance: {
      weight: number;
      reps: number;
      sets: number;
      rpe: number;
      completed: boolean;
    };
    effectiveness: number; // 0-1, how well the suggestion worked
  }[];
  success_rate: number;
  averageConfidence: number;
  userPreferences: {
    acceptanceRate: number;
    preferredModifications: string[];
    commonRejectionReasons: string[];
  };
}

export interface ProgressionEngine {
  oneRMEstimates: OneRMEstimate[];
  suggestions: ProgressionSuggestion[];
  plateauAnalyses: PlateauAnalysis[];
  rpePatterns: RPEPattern[];
  settings: AutoProgressionSettings;
  history: ProgressionHistory[];
  lastAnalysis: string;
  nextScheduledAnalysis: string;
}

export interface LoadAdjustment {
  type: 'immediate' | 'next_session' | 'next_week';
  exercise: string;
  adjustment: {
    weight: number; // absolute change in kg
    percentage: number; // percentage change
    reps?: number; // rep adjustment
    sets?: number; // set adjustment
  };
  reason: string;
  basedOn: 'rpe' | 'plateau' | 'progression' | 'deload' | 'peaking';
  confidence: number;
  expectedOutcome: string;
}

export interface ProgressionMetrics {
  exercise: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  metrics: {
    oneRMProgress: {
      start: number;
      current: number;
      change: number;
      changePercent: number;
    };
    volumeProgress: {
      start: number;
      current: number;
      change: number;
      changePercent: number;
    };
    consistencyScore: number; // 0-1
    plateauCount: number;
    deloadCount: number;
    prCount: number; // personal records
    averageRPE: number;
    progressionRate: number; // kg per week
  };
  projections: {
    oneRM: {
      oneMonth: number;
      threeMonths: number;
      sixMonths: number;
      confidence: number;
    };
    milestones: {
      target: number;
      estimatedDate: string;
      probability: number;
    }[];
  };
}