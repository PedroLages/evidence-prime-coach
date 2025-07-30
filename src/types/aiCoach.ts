// AI Coach Intelligence Type System

export interface DailyMetrics {
  id: string;
  date: string;
  sleep: number; // hours (0-12)
  energy: number; // 1-10 scale
  soreness: number; // 1-10 scale (1 = none, 10 = severe)
  stress: number; // 1-10 scale (1 = none, 10 = high)
  hrv?: number; // heart rate variability (optional)
  restingHR?: number; // resting heart rate (optional)
  bodyWeight?: number; // kg (optional)
  notes?: string;
}

export interface ReadinessFactors {
  sleep: {
    value: number;
    weight: number;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  energy: {
    value: number;
    weight: number;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  soreness: {
    value: number;
    weight: number;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  stress: {
    value: number;
    weight: number;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  hrv?: {
    value: number;
    weight: number;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export interface ReadinessAnalysis {
  overallScore: number; // 0-100
  level: 'poor' | 'fair' | 'good' | 'excellent';
  factors: ReadinessFactors;
  recommendations: string[];
  confidence: number; // 0-1
  baseline: number; // user's personal baseline
  deviation: number; // how far from baseline (-/+)
  lastUpdated: string;
}

export interface WorkoutModification {
  type: 'intensity' | 'volume' | 'exercise' | 'rest' | 'deload';
  severity: 'minor' | 'moderate' | 'major';
  reason: string;
  original: any;
  suggested: any;
  confidence: number;
  explanation: string;
}

export interface CoachingInsight {
  id: string;
  type: 'readiness' | 'progress' | 'technique' | 'recovery' | 'motivation' | 'plateau' | 'goal';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  evidence: string[];
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
  timestamp: string;
  dismissed?: boolean;
  confidence: number;
  category: 'warning' | 'suggestion' | 'celebration' | 'information';
}

export interface PerformancePattern {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  direction: 'positive' | 'negative' | 'neutral';
  confidence: number;
  timeframe: number; // days
  significance: 'low' | 'medium' | 'high';
  dataPoints: number;
  correlation?: {
    factor: string;
    strength: number; // -1 to 1
    significance: number; // 0 to 1
  }[];
}

export interface ProgressPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: number; // days
  confidence: number;
  factors: string[];
  methodology: string;
}

export interface RealTimeCoaching {
  phase: 'pre-workout' | 'during-workout' | 'between-sets' | 'post-workout';
  suggestions: {
    type: 'intensity' | 'form' | 'rest' | 'weight' | 'reps' | 'motivation';
    message: string;
    urgency: 'low' | 'medium' | 'high';
    timing: 'immediate' | 'next-set' | 'next-exercise';
  }[];
  context: {
    currentExercise?: string;
    setNumber?: number;
    rpe?: number;
    timeElapsed?: number;
    fatigue?: number;
  };
}

export interface UserLearningProfile {
  preferences: {
    coachingStyle: 'supportive' | 'direct' | 'technical' | 'motivational';
    feedbackFrequency: 'minimal' | 'moderate' | 'frequent';
    insightComplexity: 'simple' | 'detailed' | 'technical';
  };
  responsiveness: {
    [insightType: string]: {
      dismissed: number;
      acted: number;
      ignored: number;
      effectiveness: number;
    };
  };
  adaptations: {
    messageStyle: string;
    preferredMetrics: string[];
    warningThresholds: Record<string, number>;
  };
}

export interface AICoachState {
  isActive: boolean;
  currentInsights: CoachingInsight[];
  readinessAnalysis: ReadinessAnalysis | null;
  recentPatterns: PerformancePattern[];
  predictions: ProgressPrediction[];
  learningProfile: UserLearningProfile;
  lastAnalysis: string;
  analysisFrequency: number; // hours
}

export interface CoachingAction {
  type: 'analyze' | 'suggest' | 'warn' | 'celebrate' | 'modify' | 'predict';
  data: any;
  context: {
    trigger: string;
    timestamp: string;
    userId: string;
    confidence: number;
  };
}

export interface ExerciseCoaching {
  exerciseId: string;
  exerciseName: string;
  suggestions: {
    formCues: string[];
    intensityAdjustments: {
      weight?: number;
      reps?: number;
      sets?: number;
      rest?: number;
      reason: string;
    };
    technique: string[];
    safety: string[];
  };
  realTimeGuidance: {
    preSet: string[];
    duringSet: string[];
    postSet: string[];
    betweenSets: string[];
  };
}

export interface PlateauDetection {
  isDetected: boolean;
  metric: string;
  duration: number; // days
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  suggestions: {
    type: 'deload' | 'variation' | 'technique' | 'recovery' | 'progression';
    description: string;
    implementation: string;
    duration: number;
  }[];
  analysis: {
    trend: number[];
    volatility: number;
    expectedProgress: number;
    actualProgress: number;
  };
}

export interface RecoveryForecast {
  metric: 'readiness' | 'soreness' | 'energy' | 'overall';
  currentLevel: number;
  predictedLevels: {
    tomorrow: number;
    in3Days: number;
    in7Days: number;
  };
  factors: {
    factor: string;
    impact: number; // -1 to 1
    confidence: number;
  }[];
  recommendations: {
    action: string;
    impact: number;
    timeframe: string;
  }[];
}