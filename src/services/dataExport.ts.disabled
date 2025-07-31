import { supabase } from '@/integrations/supabase/client';
import { 
  getProfile, 
  getBodyMeasurements, 
  getProgressPhotos, 
  getUserSettings,
  getWorkoutSessions
} from './database';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportData {
  profile: any;
  bodyMeasurements: any[];
  progressPhotos: any[];
  workoutSessions: any[];
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

  private static async gatherProgressData(userId: string): Promise<ExportData> {
    const [profile, bodyMeasurements, progressPhotos, workoutSessions, settings] = await Promise.all([
      getProfile(userId),
      getBodyMeasurements(userId),
      getProgressPhotos(userId),
      getWorkoutSessions(userId),
      getUserSettings(userId)
    ]);

    // Goals are part of the profile
    const goals = profile?.primary_goals || [];

    // Calculate summary statistics
    const totalWorkouts = workoutSessions.length;
    const totalVolume = workoutSessions.reduce((sum, session) => {
      return sum + (session.exercises?.reduce((exerciseSum: number, exercise: any) => {
        return exerciseSum + (exercise.sets?.reduce((setSum: number, set: any) => {
          return setSum + (set.weight * set.reps);
        }, 0) || 0);
      }, 0) || 0);
    }, 0);

    const averageDuration = totalWorkouts > 0 ? 
      workoutSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / totalWorkouts : 0;

    // Find strength PRs
    const strengthPRs = this.calculateStrengthPRs(workoutSessions);

    // Weight progress
    const sortedMeasurements = bodyMeasurements
      .filter(m => m.weight !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const startWeight = sortedMeasurements[0]?.weight || profile?.weight || null;
    const currentWeight = sortedMeasurements[sortedMeasurements.length - 1]?.weight || profile?.weight || null;
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
    const workoutSessions = await getWorkoutSessions(userId);
    
    // Flatten workout data for easier export
    const flattenedWorkouts = workoutSessions.flatMap(session => {
      if (!session.exercises) return [];
      
      return session.exercises.flatMap((exercise: any) => {
        if (!exercise.sets) return [];
        
        return exercise.sets.map((set: any, setIndex: number) => ({
          date: session.date,
          sessionId: session.id,
          sessionType: session.type,
          sessionDuration: session.duration,
          exerciseName: exercise.name,
          exerciseCategory: exercise.category,
          setNumber: setIndex + 1,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          restTime: set.rest_time,
          notes: set.notes,
          isPersonalRecord: set.is_personal_record,
          volume: set.weight * set.reps,
          estimatedOneRM: set.weight * (1 + set.reps / 30) // Epley formula
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

  private static calculateStrengthPRs(workoutSessions: any[]): any[] {
    const exercisePRs: { [key: string]: { weight: number; reps: number; date: string; oneRM: number } } = {};

    workoutSessions.forEach(session => {
      session.exercises?.forEach((exercise: any) => {
        exercise.sets?.forEach((set: any) => {
          if (set.weight && set.reps) {
            const oneRM = set.weight * (1 + set.reps / 30);
            const currentPR = exercisePRs[exercise.name];
            
            if (!currentPR || oneRM > currentPR.oneRM) {
              exercisePRs[exercise.name] = {
                weight: set.weight,
                reps: set.reps,
                date: session.date,
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
      'Date', 'Session Type', 'Duration (min)', 'Exercise', 'Category',
      'Set Number', 'Weight (kg)', 'Reps', 'RPE', 'Rest Time (s)',
      'Volume', 'Est. 1RM', 'Personal Record', 'Notes'
    ];

    const csvRows = [headers.join(',')];
    
    data.flattenedWorkouts.forEach((workout: any) => {
      const row = [
        workout.date,
        workout.sessionType || '',
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
        csvContent += `${pr.exercise},${pr.weight},${pr.reps},${pr.date},${pr.oneRM.toFixed(1)}\n`;
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