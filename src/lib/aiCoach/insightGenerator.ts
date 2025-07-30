import { 
  CoachingInsight, 
  ReadinessAnalysis, 
  PerformancePattern, 
  UserLearningProfile,
  DailyMetrics,
  PlateauDetection 
} from '@/types/aiCoach';
import { DataAnalyzer } from './dataAnalyzer';

export class InsightGenerator {
  /**
   * Generates personalized coaching insights based on user data
   */
  static generateInsights(
    readiness: ReadinessAnalysis,
    patterns: PerformancePattern[],
    metrics: DailyMetrics[],
    userProfile: UserLearningProfile,
    workoutHistory: any[] = []
  ): CoachingInsight[] {
    const insights: CoachingInsight[] = [];

    // Generate readiness-based insights
    insights.push(...this.generateReadinessInsights(readiness, userProfile));

    // Generate pattern-based insights
    insights.push(...this.generatePatternInsights(patterns, userProfile));

    // Generate recovery insights
    insights.push(...this.generateRecoveryInsights(metrics, userProfile));

    // Generate progress insights
    insights.push(...this.generateProgressInsights(workoutHistory, patterns, userProfile));

    // Generate motivational insights
    insights.push(...this.generateMotivationalInsights(readiness, patterns, userProfile));

    // Sort by priority and confidence
    return this.prioritizeInsights(insights, userProfile).slice(0, 5);
  }

  /**
   * Generates insights based on current readiness
   */
  private static generateReadinessInsights(
    readiness: ReadinessAnalysis,
    profile: UserLearningProfile
  ): CoachingInsight[] {
    const insights: CoachingInsight[] = [];
    const { overallScore, level, factors, deviation } = readiness;

    // Critical readiness warnings
    if (overallScore < 40) {
      insights.push({
        id: `readiness_critical_${Date.now()}`,
        type: 'readiness',
        priority: 'critical',
        title: 'Recovery Day Recommended',
        message: this.adaptMessage(
          'Your readiness is significantly below baseline. Your body needs recovery to perform optimally.',
          profile.preferences.coachingStyle
        ),
        evidence: [
          `Overall readiness: ${overallScore}/100`,
          `${Math.abs(deviation)} points below personal baseline`,
          ...this.getFactorEvidence(factors)
        ],
        actions: [
          { label: 'Plan Rest Day', action: 'plan_rest', data: { type: 'full_rest' } },
          { label: 'Light Recovery', action: 'plan_recovery', data: { type: 'active_recovery' } }
        ],
        timestamp: new Date().toISOString(),
        confidence: readiness.confidence,
        category: 'warning'
      });
    }

    // Moderate readiness warnings
    else if (overallScore < 60) {
      insights.push({
        id: `readiness_moderate_${Date.now()}`,
        type: 'readiness',
        priority: 'high',
        title: 'Adjust Training Intensity',
        message: this.adaptMessage(
          'Consider reducing training intensity by 10-20% based on current readiness factors.',
          profile.preferences.coachingStyle
        ),
        evidence: [
          `Readiness level: ${level}`,
          ...readiness.recommendations.slice(0, 2)
        ],
        actions: [
          { label: 'Reduce Intensity', action: 'modify_workout', data: { intensity: -15 } },
          { label: 'Continue Planned', action: 'continue_workout' }
        ],
        timestamp: new Date().toISOString(),
        confidence: readiness.confidence,
        category: 'suggestion'
      });
    }

    // Excellent readiness opportunities
    else if (overallScore > 85 && deviation > 10) {
      insights.push({
        id: `readiness_excellent_${Date.now()}`,
        type: 'readiness',
        priority: 'medium',
        title: 'Optimal Training Window',
        message: this.adaptMessage(
          'Your readiness is excellent! This is a great time for challenging workouts or personal records.',
          profile.preferences.coachingStyle
        ),
        evidence: [
          `Outstanding readiness: ${overallScore}/100`,
          `${deviation} points above baseline`,
          'All recovery factors trending positively'
        ],
        actions: [
          { label: 'Increase Intensity', action: 'modify_workout', data: { intensity: +10 } },
          { label: 'Attempt PR', action: 'suggest_pr' }
        ],
        timestamp: new Date().toISOString(),
        confidence: readiness.confidence,
        category: 'celebration'
      });
    }

    return insights;
  }

  /**
   * Generates insights based on performance patterns
   */
  private static generatePatternInsights(
    patterns: PerformancePattern[],
    profile: UserLearningProfile
  ): CoachingInsight[] {
    const insights: CoachingInsight[] = [];

    patterns.forEach(pattern => {
      if (pattern.confidence < 0.3) return; // Skip low-confidence patterns

      // Declining performance patterns
      if (pattern.direction === 'negative' && pattern.significance === 'high') {
        insights.push({
          id: `pattern_decline_${pattern.metric}_${Date.now()}`,
          type: 'progress',
          priority: 'high',
          title: `${pattern.metric} Performance Declining`,
          message: this.adaptMessage(
            `Your ${pattern.metric.toLowerCase()} has been declining over the past ${pattern.timeframe} days. Let's identify the cause and adjust your approach.`,
            profile.preferences.coachingStyle
          ),
          evidence: [
            `${pattern.timeframe}-day trend: ${pattern.trend}`,
            `Confidence: ${Math.round(pattern.confidence * 100)}%`,
            `Data points: ${pattern.dataPoints}`
          ],
          actions: [
            { label: 'Analyze Causes', action: 'analyze_decline', data: { metric: pattern.metric } },
            { label: 'Adjust Program', action: 'modify_program', data: { metric: pattern.metric } }
          ],
          timestamp: new Date().toISOString(),
          confidence: pattern.confidence,
          category: 'warning'
        });
      }

      // Improving performance patterns
      else if (pattern.direction === 'positive' && pattern.significance === 'high') {
        insights.push({
          id: `pattern_improve_${pattern.metric}_${Date.now()}`,
          type: 'progress',
          priority: 'medium',
          title: `Great Progress in ${pattern.metric}`,
          message: this.adaptMessage(
            `Excellent work! Your ${pattern.metric.toLowerCase()} has been steadily improving. Keep up the momentum!`,
            profile.preferences.coachingStyle
          ),
          evidence: [
            `Consistent improvement over ${pattern.timeframe} days`,
            `Strong confidence: ${Math.round(pattern.confidence * 100)}%`
          ],
          actions: [
            { label: 'Continue Program', action: 'continue_program' },
            { label: 'Progressive Overload', action: 'increase_challenge', data: { metric: pattern.metric } }
          ],
          timestamp: new Date().toISOString(),
          confidence: pattern.confidence,
          category: 'celebration'
        });
      }

      // Volatile patterns
      else if (pattern.trend === 'volatile' && pattern.significance === 'high') {
        insights.push({
          id: `pattern_volatile_${pattern.metric}_${Date.now()}`,
          type: 'technique',
          priority: 'medium',
          title: `Inconsistent ${pattern.metric} Performance`,
          message: this.adaptMessage(
            `Your ${pattern.metric.toLowerCase()} shows high variability. Focusing on consistency could improve overall progress.`,
            profile.preferences.coachingStyle
          ),
          evidence: [
            `High volatility detected over ${pattern.timeframe} days`,
            'Inconsistent performance patterns'
          ],
          actions: [
            { label: 'Focus on Form', action: 'emphasize_technique' },
            { label: 'Stabilize Load', action: 'reduce_variability', data: { metric: pattern.metric } }
          ],
          timestamp: new Date().toISOString(),
          confidence: pattern.confidence,
          category: 'suggestion'
        });
      }
    });

    return insights;
  }

  /**
   * Generates recovery-focused insights
   */
  private static generateRecoveryInsights(
    metrics: DailyMetrics[],
    profile: UserLearningProfile
  ): CoachingInsight[] {
    const insights: CoachingInsight[] = [];

    if (metrics.length < 3) return insights;

    const recentMetrics = metrics.slice(-7);
    const sleepData = recentMetrics.map(m => m.sleep).filter(v => v > 0);
    const sorenessData = recentMetrics.map(m => m.soreness).filter(v => v > 0);
    const stressData = recentMetrics.map(m => m.stress).filter(v => v > 0);

    // Sleep pattern analysis
    if (sleepData.length >= 3) {
      const sleepTrend = DataAnalyzer.analyzeTrend(sleepData);
      const avgSleep = sleepData.reduce((a, b) => a + b) / sleepData.length;

      if (avgSleep < 6.5 && sleepTrend.direction === 'negative') {
        insights.push({
          id: `recovery_sleep_${Date.now()}`,
          type: 'recovery',
          priority: 'high',
          title: 'Sleep Debt Accumulating',
          message: this.adaptMessage(
            `Your sleep has been consistently below optimal levels. This could impact recovery and performance.`,
            profile.preferences.coachingStyle
          ),
          evidence: [
            `Average sleep: ${avgSleep.toFixed(1)} hours`,
            'Declining sleep trend detected',
            'Recommended: 7-9 hours per night'
          ],
          actions: [
            { label: 'Sleep Plan', action: 'create_sleep_plan' },
            { label: 'Reduce Volume', action: 'modify_workout', data: { volume: -20 } }
          ],
          timestamp: new Date().toISOString(),
          confidence: sleepTrend.confidence,
          category: 'warning'
        });
      }
    }

    // Soreness accumulation
    if (sorenessData.length >= 3) {
      const sorenessTrend = DataAnalyzer.analyzeTrend(sorenessData);
      const avgSoreness = sorenessData.reduce((a, b) => a + b) / sorenessData.length;

      if (avgSoreness > 6 && sorenessTrend.direction === 'positive') {
        insights.push({
          id: `recovery_soreness_${Date.now()}`,
          type: 'recovery',
          priority: 'high',
          title: 'Elevated Muscle Soreness',
          message: this.adaptMessage(
            'Muscle soreness has been increasing. Consider adding more recovery modalities to your routine.',
            profile.preferences.coachingStyle
          ),
          evidence: [
            `Average soreness: ${avgSoreness.toFixed(1)}/10`,
            'Increasing soreness trend',
            'Potential overreaching detected'
          ],
          actions: [
            { label: 'Recovery Session', action: 'plan_recovery' },
            { label: 'Deload Week', action: 'plan_deload' }
          ],
          timestamp: new Date().toISOString(),
          confidence: sorenessTrend.confidence,
          category: 'warning'
        });
      }
    }

    return insights;
  }

  /**
   * Generates progress-focused insights
   */
  private static generateProgressInsights(
    workoutHistory: any[],
    patterns: PerformancePattern[],
    profile: UserLearningProfile
  ): CoachingInsight[] {
    const insights: CoachingInsight[] = [];

    // Plateau detection
    const plateauMetrics = patterns.filter(p => 
      p.trend === 'stable' && 
      p.timeframe > 14 && 
      p.confidence > 0.4
    );

    plateauMetrics.forEach(metric => {
      insights.push({
        id: `plateau_${metric.metric}_${Date.now()}`,
        type: 'plateau',
        priority: 'medium',
        title: `${metric.metric} Plateau Detected`,
        message: this.adaptMessage(
          `Your ${metric.metric.toLowerCase()} hasn't progressed in ${metric.timeframe} days. Time to shake things up!`,
          profile.preferences.coachingStyle
        ),
        evidence: [
          `No significant progress in ${metric.timeframe} days`,
          `Confidence: ${Math.round(metric.confidence * 100)}%`
        ],
        actions: [
          { label: 'Change Exercise', action: 'exercise_variation', data: { metric: metric.metric } },
          { label: 'Alter Rep Range', action: 'modify_reps', data: { metric: metric.metric } },
          { label: 'Deload', action: 'plan_deload', data: { metric: metric.metric } }
        ],
        timestamp: new Date().toISOString(),
        confidence: metric.confidence,
        category: 'suggestion'
      });
    });

    return insights;
  }

  /**
   * Generates motivational insights
   */
  private static generateMotivationalInsights(
    readiness: ReadinessAnalysis,
    patterns: PerformancePattern[],
    profile: UserLearningProfile
  ): CoachingInsight[] {
    const insights: CoachingInsight[] = [];

    // Consistency achievements
    const consistentPatterns = patterns.filter(p => 
      p.trend !== 'volatile' && p.confidence > 0.5
    );

    if (consistentPatterns.length >= 2) {
      insights.push({
        id: `motivation_consistency_${Date.now()}`,
        type: 'motivation',
        priority: 'low',
        title: 'Consistency Paying Off',
        message: this.adaptMessage(
          'Your consistent training approach is showing in your data patterns. Keep up the excellent work!',
          profile.preferences.coachingStyle
        ),
        evidence: [
          `${consistentPatterns.length} metrics showing consistent patterns`,
          'Data quality is excellent'
        ],
        timestamp: new Date().toISOString(),
        confidence: 0.8,
        category: 'celebration'
      });
    }

    // Goal proximity
    if (readiness.overallScore > 75) {
      insights.push({
        id: `motivation_goal_${Date.now()}`,
        type: 'goal',
        priority: 'low',
        title: 'Prime Training Conditions',
        message: this.adaptMessage(
          'With your current readiness level, you\'re well-positioned to make significant progress toward your goals.',
          profile.preferences.coachingStyle
        ),
        evidence: [
          `Excellent readiness: ${readiness.overallScore}/100`,
          'All systems optimized for performance'
        ],
        actions: [
          { label: 'Set New Goal', action: 'create_goal' },
          { label: 'Challenge Workout', action: 'suggest_challenge' }
        ],
        timestamp: new Date().toISOString(),
        confidence: readiness.confidence,
        category: 'information'
      });
    }

    return insights;
  }

  /**
   * Prioritizes insights based on user preferences and importance
   */
  private static prioritizeInsights(
    insights: CoachingInsight[],
    profile: UserLearningProfile
  ): CoachingInsight[] {
    const priorityWeights = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };

    const categoryWeights = {
      warning: 20,
      suggestion: 15,
      celebration: 10,
      information: 5
    };

    return insights
      .map(insight => ({
        ...insight,
        score: priorityWeights[insight.priority] + 
               categoryWeights[insight.category] + 
               (insight.confidence * 20)
      }))
      .sort((a, b) => (b as any).score - (a as any).score)
      .map(({ score, ...insight }) => insight);
  }

  /**
   * Adapts message tone based on user preferences
   */
  private static adaptMessage(baseMessage: string, style: string): string {
    switch (style) {
      case 'supportive':
        return baseMessage.replace(/\b(should|must|need to)\b/g, 'might consider')
                         .replace(/\bYour\b/g, 'Your amazing');
      case 'direct':
        return baseMessage.replace(/consider/g, 'should')
                         .replace(/might/g, 'need to');
      case 'technical':
        return `Based on data analysis: ${baseMessage}`;
      case 'motivational':
        return `${baseMessage} You've got this! 💪`;
      default:
        return baseMessage;
    }
  }

  /**
   * Extracts evidence from readiness factors
   */
  private static getFactorEvidence(factors: any): string[] {
    const evidence: string[] = [];
    
    Object.entries(factors).forEach(([key, factor]: [string, any]) => {
      if (factor && factor.score < 60) {
        evidence.push(`Low ${key}: ${factor.score}/100`);
      }
    });

    return evidence;
  }
}