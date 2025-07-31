// Temporary stub implementation - original disabled due to type mismatches

export class DataExportService {
  static async exportWorkoutData(format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<void> {
    console.warn('Data export temporarily disabled - type mismatches need to be resolved');
    throw new Error('Data export temporarily disabled');
  }

  static async generateWorkoutReport(): Promise<void> {
    console.warn('Workout report generation temporarily disabled');
    throw new Error('Workout report generation temporarily disabled');
  }

  static async exportProgressData(userId: string, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<void> {
    console.warn('Progress data export temporarily disabled');
    throw new Error('Progress data export temporarily disabled');
  }

  static async exportWorkoutLogs(userId: string, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<void> {
    console.warn('Workout logs export temporarily disabled');
    throw new Error('Workout logs export temporarily disabled');
  }
}

export const exportWorkoutData = async (format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<void> => {
  console.warn('Data export temporarily disabled - type mismatches need to be resolved');
  throw new Error('Data export temporarily disabled');
};

export const generateWorkoutReport = async (): Promise<void> => {
  console.warn('Workout report generation temporarily disabled');
  throw new Error('Workout report generation temporarily disabled');
};