import { OneRMEstimate } from '@/types/autoProgression';

export class OneRMCalculators {
  /**
   * Epley Formula: 1RM = weight × (1 + reps/30)
   * Most popular and generally accurate for 1-10 reps
   */
  static epley(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }

  /**
   * Brzycki Formula: 1RM = weight × (36 / (37 - reps))
   * More conservative, works well for lower rep ranges
   */
  static brzycki(weight: number, reps: number): number {
    if (reps === 1) return weight;
    if (reps >= 37) return weight; // Formula breaks down at high reps
    return weight * (36 / (37 - reps));
  }

  /**
   * Lombardi Formula: 1RM = weight × reps^0.10
   * Good for higher rep ranges, more optimistic
   */
  static lombardi(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return weight * Math.pow(reps, 0.10);
  }

  /**
   * Mayhew Formula: 1RM = (100 × weight) / (52.2 + 41.9 × e^(-0.055 × reps))
   * Based on bench press research, good for 2-10 reps
   */
  static mayhew(weight: number, reps: number): number {
    if (reps === 1) return weight;
    const exponent = -0.055 * reps;
    const denominator = 52.2 + 41.9 * Math.exp(exponent);
    return (100 * weight) / denominator;
  }

  /**
   * Calculates 1RM using all formulas and returns composite estimate
   */
  static calculateComposite(weight: number, reps: number, rpe?: number): {
    estimates: Record<string, number>;
    composite: number;
    confidence: number;
    recommendedMethod: string;
  } {
    const estimates = {
      epley: this.epley(weight, reps),
      brzycki: this.brzycki(weight, reps),
      lombardi: this.lombardi(weight, reps),
      mayhew: this.mayhew(weight, reps)
    };

    // Weight formulas based on rep range and research accuracy
    let weights = {
      epley: 0.3,
      brzycki: 0.25,
      lombardi: 0.2,
      mayhew: 0.25
    };

    // Adjust weights based on rep range
    if (reps <= 3) {
      weights = { epley: 0.4, brzycki: 0.35, lombardi: 0.1, mayhew: 0.15 };
    } else if (reps <= 6) {
      weights = { epley: 0.35, brzycki: 0.3, lombardi: 0.15, mayhew: 0.2 };
    } else if (reps <= 10) {
      weights = { epley: 0.25, brzycki: 0.25, lombardi: 0.25, mayhew: 0.25 };
    } else {
      weights = { epley: 0.2, brzycki: 0.15, lombardi: 0.4, mayhew: 0.25 };
    }

    // Adjust for RPE if provided
    if (rpe !== undefined) {
      const rpeAdjustment = this.getRPEAdjustment(rpe, reps);
      Object.keys(estimates).forEach(method => {
        estimates[method as keyof typeof estimates] *= rpeAdjustment;
      });
    }

    // Calculate weighted average
    const composite = Object.keys(estimates).reduce((sum, method) => {
      return sum + estimates[method as keyof typeof estimates] * weights[method as keyof typeof weights];
    }, 0);

    // Calculate confidence based on agreement between methods
    const values = Object.values(estimates);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    const confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation * 2));

    // Recommend best method based on rep range
    let recommendedMethod = 'epley';
    if (reps <= 3) recommendedMethod = 'brzycki';
    else if (reps > 10) recommendedMethod = 'lombardi';
    else if (reps >= 6 && reps <= 8) recommendedMethod = 'mayhew';

    return {
      estimates,
      composite,
      confidence,
      recommendedMethod
    };
  }

  /**
   * Adjusts 1RM estimate based on RPE
   */
  private static getRPEAdjustment(rpe: number, reps: number): number {
    // RPE to percentage of 1RM conversion table
    const rpeTable: Record<number, number> = {
      10: 1.0,   // 100% - maximum effort
      9.5: 0.975, // 97.5% - could maybe do 1 more rep
      9: 0.95,    // 95% - could do 1 more rep
      8.5: 0.925, // 92.5% - could maybe do 2 more reps
      8: 0.9,     // 90% - could do 2 more reps
      7.5: 0.875, // 87.5% - could maybe do 3 more reps
      7: 0.85,    // 85% - could do 3 more reps
      6.5: 0.825, // 82.5% - could maybe do 4 more reps
      6: 0.8,     // 80% - could do 4 more reps
      5: 0.75     // 75% - could do 5+ more reps
    };

    const basePercentage = rpeTable[rpe] || 0.8;
    
    // If they performed at RPE X for Y reps, their 1RM is:
    // current_weight / base_percentage
    return 1 / basePercentage;
  }

  /**
   * Validates data quality for 1RM calculations
   */
  static validateData(weight: number, reps: number, rpe?: number): {
    isValid: boolean;
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];
    let confidence = 1.0;

    // Check weight validity
    if (weight <= 0) {
      issues.push('Weight must be positive');
      return { isValid: false, issues, confidence: 0 };
    }

    // Check rep validity
    if (reps <= 0 || reps > 50) {
      issues.push('Reps must be between 1 and 50');
      return { isValid: false, issues, confidence: 0 };
    }

    // Check RPE validity
    if (rpe !== undefined && (rpe < 1 || rpe > 10)) {
      issues.push('RPE must be between 1 and 10');
      confidence *= 0.8;
    }

    // Accuracy warnings
    if (reps > 15) {
      issues.push('1RM estimates less accurate for high rep sets (>15)');
      confidence *= 0.7;
    }

    if (reps === 1) {
      issues.push('Single rep may not reflect true 1RM due to technique/conditions');
      confidence *= 0.9;
    }

    if (rpe !== undefined && rpe < 6) {
      issues.push('Low RPE may indicate submaximal effort, affecting accuracy');
      confidence *= 0.8;
    }

    if (rpe !== undefined && rpe > 9.5 && reps > 5) {
      issues.push('High RPE with high reps may indicate form breakdown');
      confidence *= 0.8;
    }

    return {
      isValid: issues.length === 0 || issues.every(issue => !issue.includes('must')),
      issues,
      confidence: Math.max(0.1, confidence)
    };
  }

  /**
   * Creates a comprehensive 1RM estimate from workout data
   */
  static createEstimate(
    exercise: string,
    workoutData: { weight: number; reps: number; rpe?: number; date: string }[]
  ): OneRMEstimate {
    if (workoutData.length === 0) {
      throw new Error('No workout data provided');
    }

    // Use the most recent, highest quality data point
    const sortedData = workoutData
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(d => this.validateData(d.weight, d.reps, d.rpe).isValid);

    if (sortedData.length === 0) {
      throw new Error('No valid workout data found');
    }

    // Find the best data point (highest weight, reasonable reps, good RPE)
    const bestDataPoint = sortedData.reduce((best, current) => {
      const bestScore = best.weight * (1 + best.reps / 30) * (best.rpe ? best.rpe / 10 : 0.8);
      const currentScore = current.weight * (1 + current.reps / 30) * (current.rpe ? current.rpe / 10 : 0.8);
      return currentScore > bestScore ? current : best;
    });

    const { estimates, composite, confidence, recommendedMethod } = this.calculateComposite(
      bestDataPoint.weight,
      bestDataPoint.reps,
      bestDataPoint.rpe
    );

    return {
      exercise,
      estimate: Math.round(composite * 10) / 10, // Round to 1 decimal
      confidence,
      method: 'composite',
      dataPoints: workoutData.length,
      lastUpdated: new Date().toISOString(),
      basedOnWeight: bestDataPoint.weight,
      basedOnReps: bestDataPoint.reps,
      historicalData: workoutData.slice(0, 10) // Keep last 10 data points
    };
  }

  /**
   * Updates existing estimate with new data
   */
  static updateEstimate(
    existingEstimate: OneRMEstimate,
    newData: { weight: number; reps: number; rpe?: number; date: string }
  ): OneRMEstimate {
    const validation = this.validateData(newData.weight, newData.reps, newData.rpe);
    if (!validation.isValid) {
      return existingEstimate; // Don't update with invalid data
    }

    // Add new data to historical data
    const updatedHistory = [newData, ...existingEstimate.historicalData].slice(0, 10);

    // Recalculate estimate
    return this.createEstimate(existingEstimate.exercise, updatedHistory);
  }
}