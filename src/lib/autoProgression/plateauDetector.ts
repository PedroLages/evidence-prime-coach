import { PlateauAnalysis, RPEPattern } from '@/types/autoProgression';
import { DataAnalyzer } from '@/lib/aiCoach/dataAnalyzer';

export class PlateauDetector {
  /**
   * Analyzes workout data to detect plateaus
   */
  static analyzeForPlateau(
    exercise: string,
    workoutHistory: any[],
    minSessions: number = 4
  ): PlateauAnalysis {
    if (workoutHistory.length < minSessions) {
      return this.createNormalAnalysis(exercise);
    }

    // Sort by date (most recent first)
    const sortedHistory = workoutHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12); // Analyze last 12 sessions

    // Extract key metrics
    const weights = sortedHistory.map(w => w.weight).reverse();
    const volumes = sortedHistory.map(w => w.weight * w.reps * (w.sets || 3)).reverse();
    const rpes = sortedHistory.map(w => w.rpe || 8).reverse();

    // Analyze trends
    const weightTrend = DataAnalyzer.analyzeTrend(weights, weights.length);
    const volumeTrend = DataAnalyzer.analyzeTrend(volumes, volumes.length);
    const rpeTrend = DataAnalyzer.analyzeTrend(rpes, rpes.length);

    // Detect plateau type
    const plateauType = this.determinePlateauType(weightTrend, volumeTrend, rpeTrend);
    
    // Calculate plateau duration
    const plateauDuration = this.calculatePlateauDuration(weights, volumes, rpes);
    
    // Determine if plateau exists
    const isDetected = plateauDuration >= minSessions && (
      weightTrend.trend === 'stable' || 
      weightTrend.direction === 'negative' ||
      rpeTrend.direction === 'positive'
    );

    if (!isDetected) {
      return this.createNormalAnalysis(exercise);
    }

    // Calculate severity
    const severity = this.calculatePlateauSeverity(plateauDuration, weightTrend, rpeTrend);
    
    // Generate recommendations
    const recommendations = this.generatePlateauRecommendations(plateauType, severity);

    return {
      exercise,
      isDetected: true,
      duration: plateauDuration,
      severity,
      type: plateauType,
      confidence: Math.min(weightTrend.confidence, volumeTrend.confidence, 0.8),
      trend: {
        direction: weightTrend.trend === 'stable' ? 'stable' : 
                  weightTrend.direction === 'negative' ? 'declining' : 'volatile',
        significance: weightTrend.confidence,
        dataPoints: sortedHistory.length
      },
      recommendations,
      nextReviewDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
    };
  }

  /**
   * Determines the type of plateau based on trend analysis
   */
  private static determinePlateauType(
    weightTrend: any,
    volumeTrend: any,
    rpeTrend: any
  ): 'weight_stall' | 'rep_stall' | 'volume_decline' | 'rpe_inflation' {
    // RPE increasing while weight/volume stable = RPE inflation
    if (rpeTrend.direction === 'positive' && rpeTrend.confidence > 0.5) {
      return 'rpe_inflation';
    }

    // Volume declining = volume decline
    if (volumeTrend.direction === 'negative' && volumeTrend.confidence > 0.4) {
      return 'volume_decline';
    }

    // Weight not progressing = weight stall
    if (weightTrend.trend === 'stable' || weightTrend.direction === 'negative') {
      return 'weight_stall';
    }

    return 'rep_stall';
  }

  /**
   * Calculates how long the plateau has been occurring
   */
  private static calculatePlateauDuration(
    weights: number[],
    volumes: number[],
    rpes: number[]
  ): number {
    if (weights.length < 3) return 0;

    let duration = 0;
    const recentWeight = weights[weights.length - 1];
    const tolerance = recentWeight * 0.025; // 2.5% tolerance

    // Count sessions from the end where weight hasn't meaningfully increased
    for (let i = weights.length - 1; i >= 1; i--) {
      const currentWeight = weights[i];
      const previousWeight = weights[i - 1];
      
      if (currentWeight - previousWeight <= tolerance) {
        duration++;
      } else {
        break;
      }
    }

    return duration;
  }

  /**
   * Calculates plateau severity
   */
  private static calculatePlateauSeverity(
    duration: number,
    weightTrend: any,
    rpeTrend: any
  ): 'mild' | 'moderate' | 'severe' {
    let severityScore = 0;

    // Duration factor
    if (duration >= 6) severityScore += 3;
    else if (duration >= 4) severityScore += 2;
    else severityScore += 1;

    // Weight trend factor
    if (weightTrend.direction === 'negative') severityScore += 2;
    else if (weightTrend.trend === 'stable') severityScore += 1;

    // RPE trend factor
    if (rpeTrend.direction === 'positive' && rpeTrend.confidence > 0.5) {
      severityScore += 2;
    }

    if (severityScore >= 6) return 'severe';
    if (severityScore >= 4) return 'moderate';
    return 'mild';
  }

  /**
   * Generates recommendations based on plateau type and severity
   */
  private static generatePlateauRecommendations(
    type: PlateauAnalysis['type'],
    severity: PlateauAnalysis['severity']
  ): PlateauAnalysis['recommendations'] {
    const baseRecommendations = {
      weight_stall: [
        {
          type: 'deload' as const,
          description: 'Deload to 85% of current weight for 1-2 weeks',
          implementation: 'Reduce weight by 15%, maintain reps and sets, focus on perfect form',
          expectedDuration: 2,
          successMetrics: ['RPE drops to 7-8', 'Form quality improves', 'Ready to exceed previous weight']
        },
        {
          type: 'volume_adjustment' as const,
          description: 'Temporarily increase volume at lower intensity',
          implementation: 'Add 1-2 sets at 90% of current weight, or increase reps by 2-3',
          expectedDuration: 3,
          successMetrics: ['Improved work capacity', 'Higher volume tolerance', 'Strength endurance gains']
        }
      ],
      rpe_inflation: [
        {
          type: 'technique_focus' as const,
          description: 'Focus on technique refinement at reduced load',
          implementation: 'Drop weight 10-15%, emphasize perfect form and tempo control',
          expectedDuration: 2,
          successMetrics: ['More consistent RPE ratings', 'Improved movement quality', 'Better mind-muscle connection']
        },
        {
          type: 'deload' as const,
          description: 'Full deload week to restore neuromuscular efficiency',
          implementation: 'Reduce all parameters by 20-30% for one week',
          expectedDuration: 1,
          successMetrics: ['Reduced subjective fatigue', 'RPE normalization', 'Renewed motivation']
        }
      ],
      volume_decline: [
        {
          type: 'frequency_change' as const,
          description: 'Increase training frequency with lower per-session volume',
          implementation: 'Split current volume across more sessions per week',
          expectedDuration: 4,
          successMetrics: ['Better recovery between sessions', 'Maintained or increased total volume', 'Improved consistency']
        }
      ],
      rep_stall: [
        {
          type: 'exercise_variation' as const,
          description: 'Introduce exercise variations to stimulate adaptation',
          implementation: 'Replace with similar movement pattern variation for 4-6 weeks',
          expectedDuration: 6,
          successMetrics: ['Strength gains in variation', 'Improved weak points', 'Ready to return to main lift']
        }
      ]
    };

    let recommendations = [...(baseRecommendations[type] || baseRecommendations.weight_stall)];

    // Adjust based on severity
    if (severity === 'severe') {
      // Add more aggressive interventions
      recommendations.unshift({
        type: 'deload' as const,
        description: 'Extended deload phase with technique analysis',
        implementation: 'Two-week deload: Week 1 at 70%, Week 2 at 80% with video form analysis',
        expectedDuration: 2,
        successMetrics: ['Movement pattern correction', 'Significant RPE reduction', 'Technical mastery']
      });
    }

    return recommendations;
  }

  /**
   * Creates analysis for non-plateau cases
   */
  private static createNormalAnalysis(exercise: string): PlateauAnalysis {
    return {
      exercise,
      isDetected: false,
      duration: 0,
      severity: 'mild',
      type: 'weight_stall',
      confidence: 0.1,
      trend: {
        direction: 'stable',
        significance: 0.1,
        dataPoints: 0
      },
      recommendations: [],
      nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Analyzes RPE patterns for autoregulation insights
   */
  static analyzeRPEPatterns(
    exercise: string,
    workoutHistory: any[]
  ): RPEPattern {
    if (workoutHistory.length < 3) {
      return this.createDefaultRPEPattern(exercise);
    }

    const sessions = workoutHistory
      .filter(w => w.rpe !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(w => ({
        date: w.date,
        plannedRPE: w.plannedRPE || 8,
        actualRPE: w.rpe,
        weight: w.weight,
        reps: w.reps,
        deviation: Math.abs((w.rpe || 8) - (w.plannedRPE || 8))
      }));

    const rpeValues = sessions.map(s => s.actualRPE);
    const averageRPE = rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;
    
    const rpeTrend = DataAnalyzer.analyzeTrend(rpeValues.reverse());
    const deviations = sessions.map(s => s.deviation);
    const consistency = 1 - (deviations.reduce((a, b) => a + b, 0) / deviations.length / 10);

    // Analyze current state
    const recentAvgRPE = rpeValues.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, rpeValues.length);
    const analysis = {
      overreaching: recentAvgRPE > 9 && rpeTrend.direction === 'positive',
      underperforming: recentAvgRPE < 7 && rpeTrend.direction === 'negative',
      optimalLoad: recentAvgRPE >= 7.5 && recentAvgRPE <= 8.5 && rpeTrend.trend === 'stable',
      confidence: rpeTrend.confidence * Math.min(1, sessions.length / 5)
    };

    // Generate recommendations
    const recommendations = this.generateRPERecommendations(analysis, averageRPE, rpeTrend);

    return {
      exercise,
      averageRPE: Math.round(averageRPE * 10) / 10,
      trend: rpeTrend.trend as any,
      consistency: Math.round(consistency * 100) / 100,
      sessions,
      analysis,
      recommendations
    };
  }

  /**
   * Generates RPE-based recommendations
   */
  private static generateRPERecommendations(
    analysis: any,
    avgRPE: number,
    trend: any
  ): string[] {
    const recommendations: string[] = [];

    if (analysis.overreaching) {
      recommendations.push('Consider reducing training intensity - RPE consistently above 9');
      recommendations.push('Implement a deload week to restore performance capacity');
    }

    if (analysis.underperforming) {
      recommendations.push('Current loads may be too light - consider increasing intensity');
      recommendations.push('Verify RPE calibration - ensure honest effort assessment');
    }

    if (analysis.optimalLoad) {
      recommendations.push('Current loading is optimal - maintain this intensity range');
      recommendations.push('Look for opportunities to progress weight while maintaining RPE');
    }

    if (trend.trend === 'increasing' && avgRPE > 8.5) {
      recommendations.push('RPE trend is increasing - monitor for overreaching signs');
    }

    if (trend.trend === 'volatile') {
      recommendations.push('RPE is inconsistent - focus on effort calibration and consistency');
    }

    return recommendations;
  }

  /**
   * Creates default RPE pattern for insufficient data
   */
  private static createDefaultRPEPattern(exercise: string): RPEPattern {
      return {
        exercise,
        averageRPE: 8.0,
        trend: 'stable' as const,
        consistency: 0.7,
        sessions: [],
        analysis: {
          overreaching: false,
          underperforming: false,
          optimalLoad: true,
          confidence: 0.1
        },
        recommendations: ['Track RPE consistently to enable pattern analysis']
      };
  }
}