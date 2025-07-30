import { DailyMetrics, ReadinessAnalysis, ReadinessFactors } from '@/types/aiCoach';
import { DataAnalyzer } from './dataAnalyzer';

export class ReadinessAnalyzer {
  /**
   * Analyzes current readiness based on daily metrics
   */
  static analyzeReadiness(
    metrics: DailyMetrics[],
    userBaseline?: number
  ): ReadinessAnalysis {
    if (metrics.length === 0) {
      return this.getDefaultReadiness();
    }

    // Analyze all factors
    const factors = DataAnalyzer.analyzeReadinessFactors(metrics);
    
    // Calculate overall weighted score
    const overallScore = this.calculateOverallScore(factors);
    
    // Determine readiness level
    const level = this.determineReadinessLevel(overallScore);
    
    // Calculate personal baseline if not provided
    const baseline = userBaseline || this.calculatePersonalBaseline(metrics);
    
    // Calculate deviation from baseline
    const deviation = overallScore - baseline;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, overallScore, deviation);
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(metrics, factors);
    
    return {
      overallScore,
      level,
      factors,
      recommendations,
      confidence,
      baseline,
      deviation,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculates weighted overall readiness score
   */
  private static calculateOverallScore(factors: ReadinessFactors): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Add weighted scores for all available factors
    Object.values(factors).forEach(factor => {
      if (factor) {
        totalScore += factor.score * factor.weight;
        totalWeight += factor.weight;
      }
    });

    // Normalize to 0-100 scale
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  /**
   * Determines readiness level based on score
   */
  private static determineReadinessLevel(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Calculates personal baseline from historical data
   */
  private static calculatePersonalBaseline(metrics: DailyMetrics[]): number {
    if (metrics.length < 7) return 60; // Default baseline for new users

    // Use data from at least 2 weeks ago to avoid recent bias
    const baselineData = metrics
      .filter(m => {
        const date = new Date(m.date);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return date < twoWeeksAgo;
      })
      .slice(-21); // Last 3 weeks of baseline data

    if (baselineData.length < 5) return 60;

    // Calculate individual factor baselines
    const sleepBaseline = DataAnalyzer.calculateBaseline(
      baselineData.map(m => m.sleep * 10).filter(v => v > 0)
    );
    const energyBaseline = DataAnalyzer.calculateBaseline(
      baselineData.map(m => m.energy * 10).filter(v => v > 0)
    );
    const sorenessBaseline = DataAnalyzer.calculateBaseline(
      baselineData.map(m => (10 - m.soreness) * 10).filter(v => v >= 0)
    );
    const stressBaseline = DataAnalyzer.calculateBaseline(
      baselineData.map(m => (10 - m.stress) * 10).filter(v => v >= 0)
    );

    // Weighted average of baselines
    const weights = { sleep: 0.35, energy: 0.25, soreness: 0.20, stress: 0.15 };
    const weightedBaseline = 
      (sleepBaseline * weights.sleep +
       energyBaseline * weights.energy +
       sorenessBaseline * weights.soreness +
       stressBaseline * weights.stress) / 
      (weights.sleep + weights.energy + weights.soreness + weights.stress);

    return Math.round(Math.max(30, Math.min(90, weightedBaseline)));
  }

  /**
   * Generates personalized recommendations based on readiness factors
   */
  private static generateRecommendations(
    factors: ReadinessFactors,
    overallScore: number,
    deviation: number
  ): string[] {
    const recommendations: string[] = [];

    // Overall readiness recommendations
    if (overallScore < 50) {
      recommendations.push("Consider a rest day or light recovery session");
    } else if (overallScore < 70) {
      recommendations.push("Proceed with caution - reduce intensity by 10-20%");
    } else if (overallScore > 85) {
      recommendations.push("Excellent readiness - consider progressive overload");
    }

    // Factor-specific recommendations
    if (factors.sleep.score < 60) {
      recommendations.push(`Prioritize sleep recovery - aim for ${Math.ceil(factors.sleep.value + 1)}+ hours tonight`);
    }

    if (factors.energy.score < 60) {
      recommendations.push("Focus on nutrition and hydration before training");
    }

    if (factors.soreness.score < 60) {
      recommendations.push("Include extra warm-up and mobility work");
      if (factors.soreness.value > 6) {
        recommendations.push("Consider massage or foam rolling session");
      }
    }

    if (factors.stress.score < 60) {
      recommendations.push("Practice stress management techniques (meditation, breathing)");
    }

    // Trend-based recommendations
    if (factors.sleep.trend === 'declining') {
      recommendations.push("Sleep quality is declining - review sleep hygiene");
    }

    if (factors.energy.trend === 'declining' && factors.stress.trend === 'declining') {
      recommendations.push("Multiple declining factors detected - consider a deload week");
    }

    // Deviation-based recommendations
    if (deviation < -15) {
      recommendations.push("Significantly below baseline - prioritize recovery");
    } else if (deviation > 15) {
      recommendations.push("Above baseline - great time for challenging workouts");
    }

    return recommendations.slice(0, 4); // Limit to top 4 recommendations
  }

  /**
   * Calculates confidence in the readiness analysis
   */
  private static calculateConfidence(
    metrics: DailyMetrics[],
    factors: ReadinessFactors
  ): number {
    let confidence = 0;

    // Data recency (more recent = higher confidence)
    const latestMetric = metrics[metrics.length - 1];
    if (latestMetric) {
      const daysSinceLatest = Math.floor(
        (Date.now() - new Date(latestMetric.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyScore = Math.max(0, 1 - daysSinceLatest / 3); // Confidence drops over 3 days
      confidence += recencyScore * 0.3;
    }

    // Data completeness (more complete = higher confidence)
    const availableFactors = Object.values(factors).filter(f => f !== undefined).length;
    const completenessScore = availableFactors / 4; // 4 main factors
    confidence += completenessScore * 0.3;

    // Data consistency (less volatile = higher confidence)
    const recentMetrics = metrics.slice(-7); // Last week
    if (recentMetrics.length >= 3) {
      const sleepData = recentMetrics.map(m => m.sleep).filter(v => v > 0);
      const energyData = recentMetrics.map(m => m.energy).filter(v => v > 0);
      
      const sleepTrend = DataAnalyzer.analyzeTrend(sleepData);
      const energyTrend = DataAnalyzer.analyzeTrend(energyData);
      
      const consistencyScore = (sleepTrend.confidence + energyTrend.confidence) / 2;
      confidence += consistencyScore * 0.2;
    }

    // Historical data (more history = higher confidence)
    const historyScore = Math.min(1, metrics.length / 21); // 3 weeks for full confidence
    confidence += historyScore * 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Returns default readiness for new users
   */
  private static getDefaultReadiness(): ReadinessAnalysis {
    const defaultFactors: ReadinessFactors = {
      sleep: { value: 7, weight: 0.35, score: 70, trend: 'stable' },
      energy: { value: 7, weight: 0.25, score: 70, trend: 'stable' },
      soreness: { value: 3, weight: 0.20, score: 70, trend: 'stable' },
      stress: { value: 3, weight: 0.15, score: 70, trend: 'stable' }
    };

    return {
      overallScore: 70,
      level: 'good',
      factors: defaultFactors,
      recommendations: [
        "Start tracking daily metrics for personalized insights",
        "Maintain consistent sleep schedule",
        "Monitor workout intensity and recovery"
      ],
      confidence: 0.1,
      baseline: 60,
      deviation: 10,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Compares current readiness to recent history
   */
  static compareToHistory(
    current: ReadinessAnalysis,
    historicalAnalyses: ReadinessAnalysis[]
  ): {
    trend: 'improving' | 'declining' | 'stable';
    comparison: string;
    significance: 'low' | 'medium' | 'high';
  } {
    if (historicalAnalyses.length < 3) {
      return {
        trend: 'stable',
        comparison: 'Insufficient history for comparison',
        significance: 'low'
      };
    }

    const recentScores = historicalAnalyses
      .slice(-7)
      .map(a => a.overallScore);
    
    const trendAnalysis = DataAnalyzer.analyzeTrend(recentScores);
    
    const averageRecent = recentScores.reduce((a, b) => a + b) / recentScores.length;
    const difference = current.overallScore - averageRecent;
    
    let comparison: string;
    if (Math.abs(difference) < 5) {
      comparison = "Similar to recent average";
    } else if (difference > 0) {
      comparison = `${Math.round(difference)} points above recent average`;
    } else {
      comparison = `${Math.round(Math.abs(difference))} points below recent average`;
    }

    const significance = Math.abs(difference) > 15 ? 'high' : 
                        Math.abs(difference) > 8 ? 'medium' : 'low';

    return {
      trend: trendAnalysis.trend === 'stable' ? 'stable' : 
             trendAnalysis.direction === 'positive' ? 'improving' : 'declining',
      comparison,
      significance
    };
  }
}