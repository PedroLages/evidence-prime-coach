import { supabase } from '@/integrations/supabase/client';
import { 
  getProfile, 
  getBodyMeasurements, 
  getProgressPhotos, 
  getUserSettings,
  getWorkoutSessionsWithExercises,
  WorkoutSessionWithExercises
} from './database';
import { AdvancedReportingService, AdvancedReport } from './advancedReporting';
import { PredictiveModelingEngine } from '@/lib/analytics/predictiveModeling';
import { ComparativeAnalyticsEngine } from '@/lib/analytics/comparativeAnalytics';
import { MLInsightsEngine } from '@/lib/analytics/mlInsights';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportData {
  profile: any;
  bodyMeasurements: any[];
  progressPhotos: any[];
  workoutSessions: WorkoutSessionWithExercises[];
  goals: any[];
  settings: any;
  exportDate: string;
  summary: {
    totalWorkouts: number;
    totalVolume: number;
    averageDuration: number;
    strengthPRs: any[];
    weightProgress: {
      startWeight: number | null;
      currentWeight: number | null;
      targetWeight: number | null;
      totalChange: number | null;
    };
  };
}

export class DataExportService {
  static async exportProgressData(userId: string, format: 'csv' | 'json' | 'pdf' = 'json'): Promise<void> {
    try {
      const data = await this.gatherProgressData(userId);
      
      switch (format) {
        case 'csv':
          this.downloadCSV(data, 'progress_data.csv');
          break;
        case 'json':
          this.downloadJSON(data, 'progress_data.json');
          break;
        case 'pdf':
          await this.downloadPDF(data, 'progress_report.pdf');
          break;
      }
    } catch (error) {
      console.error('Error exporting progress data:', error);
      throw new Error('Failed to export progress data');
    }
  }

  static async exportWorkoutLogs(userId: string, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<void> {
    try {
      const workoutData = await this.gatherWorkoutData(userId);
      
      switch (format) {
        case 'csv':
          this.downloadWorkoutCSV(workoutData, 'workout_logs.csv');
          break;
        case 'json':
          this.downloadJSON(workoutData, 'workout_logs.json');
          break;
        case 'pdf':
          await this.downloadWorkoutPDF(workoutData, 'workout_logs.pdf');
          break;
      }
    } catch (error) {
      console.error('Error exporting workout logs:', error);
      throw new Error('Failed to export workout logs');
    }
  }

  // Advanced Analytics Export Methods
  static async exportAdvancedReport(userId: string, reportType: 'comprehensive' | 'performance' | 'comparative' | 'predictive' = 'comprehensive'): Promise<void> {
    try {
      const timeframe = {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      const config = {
        userId,
        reportType,
        timeframe,
        includeCharts: true,
        includePredictions: true,
        includeComparisons: true
      };

      const report = await AdvancedReportingService.generateAdvancedReport(config);
      this.downloadJSON(report, `advanced_${reportType}_report.json`);
    } catch (error) {
      console.error('Error exporting advanced report:', error);
      throw new Error('Failed to export advanced analytics report');
    }
  }

  static async exportPredictionReport(userId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<void> {
    try {
      const predictionData = await this.gatherPredictionData(userId);
      
      switch (format) {
        case 'csv':
          this.downloadPredictionCSV(predictionData, 'prediction_report.csv');
          break;
        case 'json':
          this.downloadJSON(predictionData, 'prediction_report.json');
          break;
        case 'pdf':
          await this.downloadPredictionPDF(predictionData, 'prediction_report.pdf');
          break;
      }
    } catch (error) {
      console.error('Error exporting prediction report:', error);
      throw new Error('Failed to export prediction report');
    }
  }

  static async exportComparisonReport(userId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<void> {
    try {
      const comparisonData = await this.gatherComparisonData(userId);
      
      switch (format) {
        case 'csv':
          this.downloadComparisonCSV(comparisonData, 'comparison_report.csv');
          break;
        case 'json':
          this.downloadJSON(comparisonData, 'comparison_report.json');
          break;
        case 'pdf':
          await this.downloadComparisonPDF(comparisonData, 'comparison_report.pdf');
          break;
      }
    } catch (error) {
      console.error('Error exporting comparison report:', error);
      throw new Error('Failed to export comparison report');
    }
  }

  static async exportMLInsights(userId: string, format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      const insightsData = await this.gatherMLInsightsData(userId);
      
      switch (format) {
        case 'csv':
          this.downloadMLInsightsCSV(insightsData, 'ml_insights.csv');
          break;
        case 'json':
          this.downloadJSON(insightsData, 'ml_insights.json');
          break;
      }
    } catch (error) {
      console.error('Error exporting ML insights:', error);
      throw new Error('Failed to export ML insights');
    }
  }

  private static async gatherProgressData(userId: string): Promise<ExportData> {
    const [profile, bodyMeasurements, progressPhotos, workoutSessions, settings] = await Promise.all([
      getProfile(userId),
      getBodyMeasurements(userId),
      getProgressPhotos(userId),
      getWorkoutSessionsWithExercises(userId),
      getUserSettings(userId)
    ]);

    // Goals are part of the profile
    const goals = profile?.primary_goals || [];

    // Calculate summary statistics
    const totalWorkouts = workoutSessions.length;
    const totalVolume = workoutSessions.reduce((sum, session) => {
      return sum + (session.exercises?.reduce((exerciseSum, exercise) => {
        return exerciseSum + (exercise.sets?.reduce((setSum, set) => {
          return setSum + ((set.weight || 0) * (set.reps || 0));
        }, 0) || 0);
      }, 0) || 0);
    }, 0);

    const averageDuration = totalWorkouts > 0 ? 
      workoutSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) / totalWorkouts : 0;

    // Find strength PRs
    const strengthPRs = this.calculateStrengthPRs(workoutSessions);

    // Weight progress
    const sortedMeasurements = bodyMeasurements
      .filter(m => m.weight !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const startWeight = sortedMeasurements[0]?.weight || null;
    const currentWeight = sortedMeasurements[sortedMeasurements.length - 1]?.weight || null;
    const targetWeight = profile?.target_weight || null;
    const totalChange = startWeight && currentWeight ? currentWeight - startWeight : null;

    return {
      profile,
      bodyMeasurements,
      progressPhotos: progressPhotos.map(photo => ({
        ...photo,
        image_url: 'URL_REDACTED_FOR_PRIVACY' // Don't export actual image URLs
      })),
      workoutSessions,
      goals,
      settings,
      exportDate: new Date().toISOString(),
      summary: {
        totalWorkouts,
        totalVolume,
        averageDuration,
        strengthPRs,
        weightProgress: {
          startWeight,
          currentWeight,
          targetWeight,
          totalChange
        }
      }
    };
  }

  private static async gatherWorkoutData(userId: string) {
    const workoutSessions = await getWorkoutSessionsWithExercises(userId);
    
    // Flatten workout data for easier export
    const flattenedWorkouts = workoutSessions.flatMap(session => {
      if (!session.exercises) return [];
      
      return session.exercises.flatMap((exercise) => {
        if (!exercise.sets) return [];
        
        return exercise.sets.map((set, setIndex) => ({
          date: session.started_at,
          sessionId: session.id,
          sessionName: session.name,
          sessionDuration: session.duration_minutes,
          exerciseName: exercise.name,
          exerciseCategory: exercise.category,
          setNumber: setIndex + 1,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          restTime: set.rest_time,
          notes: set.notes,
          isPersonalRecord: set.is_personal_record,
          volume: (set.weight || 0) * (set.reps || 0),
          estimatedOneRM: set.weight && set.reps ? set.weight * (1 + set.reps / 30) : null // Epley formula
        }));
      });
    });

    return {
      sessions: workoutSessions,
      flattenedWorkouts,
      exportDate: new Date().toISOString(),
      summary: {
        totalSessions: workoutSessions.length,
        totalSets: flattenedWorkouts.length,
        totalVolume: flattenedWorkouts.reduce((sum, set) => sum + set.volume, 0),
        averageRPE: flattenedWorkouts.length > 0 ? 
          flattenedWorkouts.reduce((sum, set) => sum + (set.rpe || 0), 0) / flattenedWorkouts.length : 0,
        personalRecords: flattenedWorkouts.filter(set => set.isPersonalRecord).length
      }
    };
  }

  private static calculateStrengthPRs(workoutSessions: WorkoutSessionWithExercises[]): any[] {
    const exercisePRs: { [key: string]: { weight: number; reps: number; date: string; oneRM: number } } = {};

    workoutSessions.forEach(session => {
      session.exercises?.forEach((exercise) => {
        exercise.sets?.forEach((set) => {
          if (set.weight && set.reps) {
            const oneRM = set.weight * (1 + set.reps / 30);
            const currentPR = exercisePRs[exercise.name];
            
            if (!currentPR || oneRM > currentPR.oneRM) {
              exercisePRs[exercise.name] = {
                weight: set.weight,
                reps: set.reps,
                date: session.started_at,
                oneRM
              };
            }
          }
        });
      });
    });

    return Object.entries(exercisePRs).map(([exercise, pr]) => ({
      exercise,
      ...pr
    }));
  }

  private static downloadCSV(data: any, filename: string): void {
    // Convert progress data to CSV format
    const csvContent = this.convertToCSV(data);
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private static downloadWorkoutCSV(data: any, filename: string): void {
    // Convert workout data to CSV format
    const headers = [
      'Date', 'Session Name', 'Duration (min)', 'Exercise', 'Category',
      'Set Number', 'Weight (kg)', 'Reps', 'RPE', 'Rest Time (s)',
      'Volume', 'Est. 1RM', 'Personal Record', 'Notes'
    ];

    const csvRows = [headers.join(',')];
    
    data.flattenedWorkouts.forEach((workout: any) => {
      const row = [
        new Date(workout.date).toISOString().split('T')[0],
        workout.sessionName || '',
        workout.sessionDuration || '',
        workout.exerciseName || '',
        workout.exerciseCategory || '',
        workout.setNumber,
        workout.weight || '',
        workout.reps || '',
        workout.rpe || '',
        workout.restTime || '',
        workout.volume || '',
        workout.estimatedOneRM?.toFixed(1) || '',
        workout.isPersonalRecord ? 'Yes' : 'No',
        `"${(workout.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private static convertToCSV(data: ExportData): string {
    // Create a comprehensive CSV with multiple sheets worth of data
    let csvContent = 'FITNESS PROGRESS EXPORT\n';
    csvContent += `Export Date: ${data.exportDate}\n\n`;

    // Summary section
    csvContent += 'SUMMARY\n';
    csvContent += `Total Workouts,${data.summary.totalWorkouts}\n`;
    csvContent += `Total Volume (kg),${data.summary.totalVolume}\n`;
    csvContent += `Average Duration (min),${data.summary.averageDuration.toFixed(1)}\n`;
    csvContent += `Start Weight (kg),${data.summary.weightProgress.startWeight || 'N/A'}\n`;
    csvContent += `Current Weight (kg),${data.summary.weightProgress.currentWeight || 'N/A'}\n`;
    csvContent += `Target Weight (kg),${data.summary.weightProgress.targetWeight || 'N/A'}\n`;
    csvContent += `Weight Change (kg),${data.summary.weightProgress.totalChange?.toFixed(1) || 'N/A'}\n\n`;

    // Body measurements
    if (data.bodyMeasurements.length > 0) {
      csvContent += 'BODY MEASUREMENTS\n';
      csvContent += 'Date,Weight,Body Fat %,Muscle Mass,Waist,Chest,Arms,Thighs,Hips,Neck,Height,Notes\n';
      data.bodyMeasurements.forEach((measurement: any) => {
        csvContent += `${measurement.date},${measurement.weight || ''},${measurement.body_fat_percentage || ''},${measurement.muscle_mass || ''},${measurement.waist || ''},${measurement.chest || ''},${measurement.arms || ''},${measurement.thighs || ''},${measurement.hips || ''},${measurement.neck || ''},${measurement.height || ''},"${(measurement.notes || '').replace(/"/g, '""')}"\n`;
      });
      csvContent += '\n';
    }

    // Strength PRs
    if (data.summary.strengthPRs.length > 0) {
      csvContent += 'STRENGTH PERSONAL RECORDS\n';
      csvContent += 'Exercise,Weight (kg),Reps,Date,Estimated 1RM\n';
      data.summary.strengthPRs.forEach((pr: any) => {
        csvContent += `${pr.exercise},${pr.weight},${pr.reps},${new Date(pr.date).toISOString().split('T')[0]},${pr.oneRM.toFixed(1)}\n`;
      });
    }

    return csvContent;
  }

  private static downloadJSON(data: any, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  private static async downloadPDF(data: ExportData, filename: string): Promise<void> {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Fitness Progress Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Export Date: ${new Date(data.exportDate).toLocaleDateString()}`, 20, 35);
    
    // Summary statistics
    doc.setFontSize(16);
    doc.text('Summary Statistics', 20, 55);
    
    const summaryData = [
      ['Total Workouts', data.summary.totalWorkouts.toString()],
      ['Total Volume', `${data.summary.totalVolume.toLocaleString()} kg`],
      ['Average Workout Duration', `${data.summary.averageDuration.toFixed(1)} min`],
      ['Current Weight', `${data.summary.weightProgress.currentWeight || 'N/A'} kg`],
      ['Target Weight', `${data.summary.weightProgress.targetWeight || 'N/A'} kg`],
      ['Weight Progress', `${data.summary.weightProgress.totalChange?.toFixed(1) || 'N/A'} kg`]
    ];

    (doc as any).autoTable({
      startY: 65,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid'
    });

    // Strength PRs
    if (data.summary.strengthPRs.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Strength Personal Records', 20, 20);

      const prData = data.summary.strengthPRs.slice(0, 10).map((pr: any) => [
        pr.exercise,
        `${pr.weight} kg`,
        `${pr.reps} reps`,
        new Date(pr.date).toLocaleDateString(),
        `${pr.oneRM.toFixed(1)} kg`
      ]);

      (doc as any).autoTable({
        startY: 30,
        head: [['Exercise', 'Weight', 'Reps', 'Date', 'Est. 1RM']],
        body: prData,
        theme: 'grid'
      });
    }

    doc.save(filename);
  }

  private static async downloadWorkoutPDF(data: any, filename: string): Promise<void> {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Workout Logs Export', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Export Date: ${new Date(data.exportDate).toLocaleDateString()}`, 20, 35);
    
    // Summary
    doc.setFontSize(16);
    doc.text('Workout Summary', 20, 55);
    
    const summaryData = [
      ['Total Sessions', data.summary.totalSessions.toString()],
      ['Total Sets', data.summary.totalSets.toString()],
      ['Total Volume', `${data.summary.totalVolume.toLocaleString()} kg`],
      ['Average RPE', data.summary.averageRPE.toFixed(1)],
      ['Personal Records', data.summary.personalRecords.toString()]
    ];

    (doc as any).autoTable({
      startY: 65,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid'
    });

    // Recent workouts (last 20 entries)
    if (data.flattenedWorkouts.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Recent Workout Details', 20, 20);

      const workoutData = data.flattenedWorkouts.slice(-20).map((workout: any) => [
        new Date(workout.date).toLocaleDateString(),
        workout.exerciseName.substring(0, 15),
        `${workout.weight}kg`,
        `${workout.reps}`,
        workout.rpe || 'N/A',
        workout.isPersonalRecord ? 'PR!' : ''
      ]);

      (doc as any).autoTable({
        startY: 30,
        head: [['Date', 'Exercise', 'Weight', 'Reps', 'RPE', 'PR']],
        body: workoutData,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
    }

    doc.save(filename);
  }

  // Advanced Analytics Data Gathering Methods
  private static async gatherPredictionData(userId: string) {
    const workoutSessions = await getWorkoutSessionsWithExercises(userId);
    
    // Convert to PerformanceMetric format
    const performanceMetrics = this.convertToPerformanceMetrics(workoutSessions);
    
    // Generate predictions for each exercise
    const exerciseGroups = this.groupMetricsByExercise(performanceMetrics);
    const predictions: any[] = [];
    const injuryRisk = PredictiveModelingEngine.assessInjuryRisk(performanceMetrics);
    
    Object.entries(exerciseGroups).forEach(([exercise, metrics]) => {
      const models = PredictiveModelingEngine.predictPerformance(metrics);
      predictions.push({
        exercise,
        models,
        goalPredictions: PredictiveModelingEngine.predictGoalAchievement(
          metrics[metrics.length - 1]?.oneRM || 0,
          (metrics[metrics.length - 1]?.oneRM || 0) * 1.15,
          metrics,
          'strength'
        ),
        plateauPrediction: PredictiveModelingEngine.predictPlateau(metrics)
      });
    });

    return {
      userId,
      generatedAt: new Date().toISOString(),
      predictions,
      injuryRisk,
      dataPoints: performanceMetrics.length,
      exercisesCovered: Object.keys(exerciseGroups)
    };
  }

  private static async gatherComparisonData(userId: string) {
    const workoutSessions = await getWorkoutSessionsWithExercises(userId);
    const performanceMetrics = this.convertToPerformanceMetrics(workoutSessions);
    
    const competitiveAnalysis = ComparativeAnalyticsEngine.generateCompetitiveAnalysis(
      performanceMetrics,
      {} // Mock user profile
    );
    
    const populationStats = ComparativeAnalyticsEngine.getPopulationStatistics();
    
    return {
      userId,
      generatedAt: new Date().toISOString(),
      competitiveAnalysis,
      populationStats,
      personalHistory: ComparativeAnalyticsEngine.compareAgainstPersonalHistory(
        performanceMetrics.slice(-10),
        performanceMetrics
      )
    };
  }

  private static async gatherMLInsightsData(userId: string) {
    const workoutSessions = await getWorkoutSessionsWithExercises(userId);
    const performanceMetrics = this.convertToPerformanceMetrics(workoutSessions);
    
    const patterns = MLInsightsEngine.detectTrainingPatterns(performanceMetrics);
    const anomalies = MLInsightsEngine.detectAnomalies(performanceMetrics);
    const optimalWindows = MLInsightsEngine.calculateOptimalTrainingWindows(performanceMetrics);
    const recommendations = MLInsightsEngine.generateAdaptiveRecommendations(
      performanceMetrics,
      patterns,
      anomalies
    );
    const clusters = MLInsightsEngine.clusterExercisePerformance(performanceMetrics);
    
    return {
      userId,
      generatedAt: new Date().toISOString(),
      patterns,
      anomalies,
      optimalWindows,
      recommendations,
      clusters,
      dataQuality: {
        totalDataPoints: performanceMetrics.length,
        exercisesCovered: [...new Set(performanceMetrics.map(m => m.exercise))].length,
        timeSpan: performanceMetrics.length > 0 ? this.calculateTimeSpan(performanceMetrics) : 0
      }
    };
  }

  // CSV Export Methods for Advanced Analytics
  private static downloadPredictionCSV(data: any, filename: string): void {
    const headers = ['Exercise', 'Model', 'R_Squared', '1_Week_Pred', '1_Month_Pred', '3_Month_Pred', '6_Month_Pred'];
    const rows: string[][] = [];
    
    data.predictions.forEach((pred: any) => {
      pred.models.forEach((model: any) => {
        rows.push([
          pred.exercise,
          model.name,
          (model.rSquared * 100).toFixed(1) + '%',
          model.predictions.oneWeek.value.toFixed(1),
          model.predictions.oneMonth.value.toFixed(1),
          model.predictions.threeMonths.value.toFixed(1),
          model.predictions.sixMonths.value.toFixed(1)
        ]);
      });
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private static downloadComparisonCSV(data: any, filename: string): void {
    const headers = ['Exercise', 'Current_Value', 'Personal_Best', 'Percentile_Rank', 'Progress_Rate', 'Relative_Pace'];
    const rows: string[][] = [];
    
    data.competitiveAnalysis.exerciseRankings.forEach((ranking: any) => {
      rows.push([
        ranking.exercise,
        ranking.currentValue.toString(),
        ranking.personalBest.toString(),
        Math.round(ranking.percentileRank).toString(),
        ranking.progressVelocity.currentRate.toFixed(2),
        ranking.progressVelocity.relativePace
      ]);
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private static downloadMLInsightsCSV(data: any, filename: string): void {
    const headers = ['Type', 'Exercise', 'Description', 'Confidence', 'Recommendation', 'Category'];
    const rows: string[][] = [];
    
    // Add patterns
    data.patterns.forEach((pattern: any) => {
      rows.push([
        'Pattern',
        pattern.exercises.join(', '),
        pattern.description,
        (pattern.confidence * 100).toFixed(1) + '%',
        pattern.recommendations.join('; '),
        pattern.characteristics.volumePattern
      ]);
    });
    
    // Add anomalies
    data.anomalies.forEach((anomaly: any) => {
      rows.push([
        'Anomaly',
        anomaly.exercise || 'Multiple',
        anomaly.description,
        (anomaly.confidence * 100).toFixed(1) + '%',
        anomaly.suggestedActions.join('; '),
        anomaly.type
      ]);
    });
    
    // Add recommendations
    data.recommendations.forEach((rec: any) => {
      rows.push([
        'Recommendation',
        'General',
        rec.description,
        (rec.confidence * 100).toFixed(1) + '%',
        rec.implementation.immediate.join('; '),
        rec.category
      ]);
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  // PDF Export Methods for Advanced Analytics
  private static async downloadPredictionPDF(data: any, filename: string): Promise<void> {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Performance Predictions Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString()}`, 20, 35);
    doc.text(`Data Points: ${data.dataPoints}`, 20, 45);
    doc.text(`Exercises Covered: ${data.exercisesCovered.length}`, 20, 55);
    
    // Injury Risk Section
    let yPos = 70;
    doc.setFontSize(16);
    doc.text('Injury Risk Assessment', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(12);
    doc.text(`Risk Level: ${data.injuryRisk.riskLevel.toUpperCase()}`, 20, yPos);
    yPos += 10;
    doc.text(`Risk Score: ${Math.round(data.injuryRisk.riskScore)}/100`, 20, yPos);
    yPos += 15;
    
    // Predictions Table
    doc.setFontSize(16);
    doc.text('Performance Predictions', 20, yPos);
    yPos += 10;
    
    const predictionData = data.predictions.flatMap((pred: any) =>
      pred.models.slice(0, 1).map((model: any) => [
        pred.exercise,
        model.name,
        `${(model.rSquared * 100).toFixed(1)}%`,
        `${model.predictions.oneMonth.value.toFixed(1)} lbs`,
        `${model.predictions.threeMonths.value.toFixed(1)} lbs`
      ])
    );
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Exercise', 'Model', 'Accuracy', '1-Month', '3-Month']],
      body: predictionData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    doc.save(filename);
  }

  private static async downloadComparisonPDF(data: any, filename: string): Promise<void> {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Performance Comparison Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString()}`, 20, 35);
    
    // Overall Ranking
    let yPos = 55;
    doc.setFontSize(16);
    doc.text('Overall Ranking', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(12);
    doc.text(`Percentile: ${Math.round(data.competitiveAnalysis.overallRank.percentile)}th`, 20, yPos);
    yPos += 10;
    doc.text(`Level: ${data.competitiveAnalysis.overallRank.description}`, 20, yPos);
    yPos += 20;
    
    // Exercise Rankings Table
    doc.setFontSize(16);
    doc.text('Exercise Rankings', 20, yPos);
    yPos += 10;
    
    const rankingData = data.competitiveAnalysis.exerciseRankings.map((ranking: any) => [
      ranking.exercise,
      `${ranking.currentValue} lbs`,
      `${Math.round(ranking.percentileRank)}th`,
      ranking.progressVelocity.relativePace
    ]);
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Exercise', 'Current', 'Percentile', 'Progress Pace']],
      body: rankingData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    doc.save(filename);
  }

  // Helper Methods
  private static convertToPerformanceMetrics(workoutSessions: WorkoutSessionWithExercises[]): any[] {
    const metrics: any[] = [];
    
    workoutSessions.forEach(session => {
      session.exercises?.forEach(exercise => {
        if (exercise.sets && exercise.sets.length > 0) {
          const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0));
          const totalVolume = exercise.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
          const avgRPE = exercise.sets.reduce((sum, set) => sum + (set.rpe || 0), 0) / exercise.sets.length;
          
          metrics.push({
            date: session.started_at,
            exercise: exercise.name,
            weight: maxWeight,
            reps: Math.max(...exercise.sets.map(set => set.reps || 0)),
            sets: exercise.sets.length,
            rpe: avgRPE,
            volume: totalVolume,
            oneRM: maxWeight * 1.0278, // Conservative estimate
            intensity: 85 // Mock intensity
          });
        }
      });
    });
    
    return metrics;
  }

  private static groupMetricsByExercise(metrics: any[]): Record<string, any[]> {
    return metrics.reduce((groups, metric) => {
      if (!groups[metric.exercise]) {
        groups[metric.exercise] = [];
      }
      groups[metric.exercise].push(metric);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private static calculateTimeSpan(metrics: any[]): number {
    if (metrics.length < 2) return 0;
    
    const sortedMetrics = metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = new Date(sortedMetrics[0].date);
    const lastDate = new Date(sortedMetrics[sortedMetrics.length - 1].date);
    
    return Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Backward compatibility exports
export const exportWorkoutData = async (format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<void> => {
  console.warn('exportWorkoutData is deprecated. Use DataExportService.exportWorkoutLogs instead.');
  throw new Error('This function requires a userId parameter. Use DataExportService.exportWorkoutLogs instead.');
};

export const generateWorkoutReport = async (): Promise<void> => {
  console.warn('generateWorkoutReport is deprecated. Use DataExportService.exportProgressData instead.');
  throw new Error('This function requires a userId parameter. Use DataExportService.exportProgressData instead.');
};