import { DailyMetrics, PerformancePattern, ReadinessFactors } from '@/types/aiCoach';

export class DataAnalyzer {
  /**
   * Analyzes trends in time series data using linear regression
   */
  static analyzeTrend(data: number[], timeframe: number = 7): {
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    direction: 'positive' | 'negative' | 'neutral';
    confidence: number;
    slope: number;
    volatility: number;
  } {
    if (data.length < 3) {
      return {
        trend: 'stable',
        direction: 'neutral', 
        confidence: 0,
        slope: 0,
        volatility: 0
      };
    }

    // Calculate linear regression
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = data.reduce((a, b) => a + b) / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (data[i] - meanY), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    
    // Calculate R-squared for confidence
    const predicted = x.map(xi => meanY + slope * (xi - meanX));
    const totalVariance = data.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const residualVariance = data.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0);
    const rSquared = totalVariance === 0 ? 0 : 1 - (residualVariance / totalVariance);
    
    // Calculate volatility (coefficient of variation)
    const stdDev = Math.sqrt(data.reduce((sum, x) => sum + Math.pow(x - meanY, 2), 0) / n);
    const volatility = meanY === 0 ? 0 : stdDev / Math.abs(meanY);
    
    // Determine trend based on slope and volatility
    const slopeThreshold = 0.1;
    const volatilityThreshold = 0.3;
    
    let trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    let direction: 'positive' | 'negative' | 'neutral';
    
    if (volatility > volatilityThreshold) {
      trend = 'volatile';
      direction = 'neutral';
    } else if (Math.abs(slope) < slopeThreshold) {
      trend = 'stable';
      direction = 'neutral';
    } else if (slope > 0) {
      trend = 'increasing';
      direction = 'positive';
    } else {
      trend = 'decreasing';
      direction = 'negative';
    }
    
    return {
      trend,
      direction,
      confidence: Math.max(0, Math.min(1, rSquared)),
      slope,
      volatility
    };
  }

  /**
   * Calculates correlation between two data series
   */
  static calculateCorrelation(x: number[], y: number[]): {
    correlation: number;
    significance: number;
    strength: 'weak' | 'moderate' | 'strong';
  } {
    if (x.length !== y.length || x.length < 3) {
      return { correlation: 0, significance: 0, strength: 'weak' };
    }

    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    
    const correlation = (denomX === 0 || denomY === 0) ? 0 : numerator / (denomX * denomY);
    
    // Calculate significance (simplified t-test approximation)
    const tStat = Math.abs(correlation) * Math.sqrt((n - 2) / (1 - correlation * correlation));
    const significance = Math.min(1, Math.max(0, (tStat - 1) / 3)); // Normalized approximation
    
    // Determine strength
    const absCorr = Math.abs(correlation);
    const strength = absCorr < 0.3 ? 'weak' : absCorr < 0.7 ? 'moderate' : 'strong';
    
    return { correlation, significance, strength };
  }

  /**
   * Analyzes readiness factors and calculates weighted scores
   */
  static analyzeReadinessFactors(metrics: DailyMetrics[]): ReadinessFactors {
    const defaultWeights = {
      sleep: 0.35,
      energy: 0.25,
      soreness: 0.20,
      stress: 0.15,
      hrv: 0.05
    };

    const analyzeFactor = (
      values: number[], 
      isInverted: boolean = false
    ): { score: number; trend: 'improving' | 'stable' | 'declining' } => {
      if (values.length === 0) return { score: 50, trend: 'stable' };
      
      const latest = values[values.length - 1];
      const normalized = isInverted ? (10 - latest) * 10 : latest * 10;
      
      const trendAnalysis = this.analyzeTrend(values, 7);
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      
      if (trendAnalysis.confidence > 0.3) {
        if (isInverted) {
          trend = trendAnalysis.direction === 'negative' ? 'improving' : 'declining';
        } else {
          trend = trendAnalysis.direction === 'positive' ? 'improving' : 'declining';
        }
      }
      
      return { score: Math.max(0, Math.min(100, normalized)), trend };
    };

    const sleepValues = metrics.map(m => m.sleep).filter(v => v > 0);
    const energyValues = metrics.map(m => m.energy).filter(v => v > 0);
    const sorenessValues = metrics.map(m => m.soreness).filter(v => v > 0);
    const stressValues = metrics.map(m => m.stress).filter(v => v > 0);
    const hrvValues = metrics.map(m => m.hrv).filter(v => v !== undefined && v > 0) as number[];

    const sleepAnalysis = analyzeFactor(sleepValues);
    const energyAnalysis = analyzeFactor(energyValues);
    const sorenessAnalysis = analyzeFactor(sorenessValues, true); // Inverted: lower soreness = better
    const stressAnalysis = analyzeFactor(stressValues, true); // Inverted: lower stress = better
    const hrvAnalysis = hrvValues.length > 0 ? analyzeFactor(hrvValues) : null;

    const factors: ReadinessFactors = {
      sleep: {
        value: sleepValues[sleepValues.length - 1] || 0,
        weight: defaultWeights.sleep,
        score: sleepAnalysis.score,
        trend: sleepAnalysis.trend
      },
      energy: {
        value: energyValues[energyValues.length - 1] || 0,
        weight: defaultWeights.energy,
        score: energyAnalysis.score,
        trend: energyAnalysis.trend
      },
      soreness: {
        value: sorenessValues[sorenessValues.length - 1] || 0,
        weight: defaultWeights.soreness,
        score: sorenessAnalysis.score,
        trend: sorenessAnalysis.trend
      },
      stress: {
        value: stressValues[stressValues.length - 1] || 0,
        weight: defaultWeights.stress,
        score: stressAnalysis.score,
        trend: stressAnalysis.trend
      }
    };

    if (hrvAnalysis && hrvValues.length > 0) {
      factors.hrv = {
        value: hrvValues[hrvValues.length - 1],
        weight: defaultWeights.hrv,
        score: hrvAnalysis.score,
        trend: hrvAnalysis.trend
      };
    }

    return factors;
  }

  /**
   * Detects patterns in performance data
   */
  static detectPerformancePatterns(
    metric: string,
    data: number[], 
    timeframe: number = 14
  ): PerformancePattern {
    const trendAnalysis = this.analyzeTrend(data, timeframe);
    
    // Determine significance based on data quality and trend strength
    const dataQuality = Math.min(1, data.length / timeframe);
    const trendStrength = Math.abs(trendAnalysis.slope);
    const significance = trendStrength > 0.2 ? 'high' : trendStrength > 0.1 ? 'medium' : 'low';
    
    return {
      metric,
      trend: trendAnalysis.trend,
      direction: trendAnalysis.direction,
      confidence: trendAnalysis.confidence * dataQuality,
      timeframe,
      significance,
      dataPoints: data.length
    };
  }

  /**
   * Calculates moving averages for trend smoothing
   */
  static calculateMovingAverage(data: number[], window: number): number[] {
    if (data.length < window) return data;
    
    const result: number[] = [];
    for (let i = window - 1; i < data.length; i++) {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
    return result;
  }

  /**
   * Detects outliers using the IQR method
   */
  static detectOutliers(data: number[]): { indices: number[]; values: number[] } {
    if (data.length < 4) return { indices: [], values: [] };
    
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outlierIndices: number[] = [];
    const outlierValues: number[] = [];
    
    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outlierIndices.push(index);
        outlierValues.push(value);
      }
    });
    
    return { indices: outlierIndices, values: outlierValues };
  }

  /**
   * Calculates personal baseline from historical data
   */
  static calculateBaseline(data: number[], method: 'mean' | 'median' | 'mode' = 'median'): number {
    if (data.length === 0) return 0;
    
    switch (method) {
      case 'mean':
        return data.reduce((a, b) => a + b) / data.length;
      case 'median':
        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid];
      case 'mode':
        const frequency: Record<number, number> = {};
        data.forEach(value => {
          frequency[value] = (frequency[value] || 0) + 1;
        });
        return Number(Object.keys(frequency).reduce((a, b) => 
          frequency[Number(a)] > frequency[Number(b)] ? a : b
        ));
      default:
        return this.calculateBaseline(data, 'median');
    }
  }
}