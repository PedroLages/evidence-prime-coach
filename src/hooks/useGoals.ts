import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getGoals, 
  getGoalWithProgress,
  createGoal, 
  updateGoal, 
  deleteGoal,
  addGoalProgress,
  addGoalMilestone,
  getActiveGoals,
  getGoalsByCategory,
  Goal,
  GoalWithProgress,
  GoalProgress,
  GoalMilestone
} from '@/services/database';

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load goals for the current user
  const loadGoals = useCallback(async () => {
    if (!user?.id) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userGoals = await getGoals(user.id);
      setGoals(userGoals);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new goal
  const createNewGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    try {
      setError(null);
      const newGoal = await createGoal({
        ...goalData,
        user_id: user.id
      });
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (err) {
      console.error('Failed to create goal:', err);
      setError('Failed to create goal');
      throw err;
    }
  }, [user?.id]);

  // Update an existing goal
  const updateExistingGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    try {
      setError(null);
      const updatedGoal = await updateGoal(goalId, updates);
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ));
      return updatedGoal;
    } catch (err) {
      console.error('Failed to update goal:', err);
      setError('Failed to update goal');
      throw err;
    }
  }, []);

  // Delete a goal
  const deleteExistingGoal = useCallback(async (goalId: string) => {
    try {
      setError(null);
      await deleteGoal(goalId);
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (err) {
      console.error('Failed to delete goal:', err);
      setError('Failed to delete goal');
      throw err;
    }
  }, []);

  // Add progress to a goal
  const addProgress = useCallback(async (
    goalId: string, 
    value: number, 
    date?: string,
    notes?: string,
    source: 'manual' | 'body_measurement' | 'workout_session' = 'manual'
  ) => {
    try {
      setError(null);
      const progress = await addGoalProgress(goalId, value, date, notes, source);
      
      // Update the goal's current_value in local state
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, current_value: value }
          : goal
      ));
      
      return progress;
    } catch (err) {
      console.error('Failed to add goal progress:', err);
      setError('Failed to add progress');
      throw err;
    }
  }, []);

  // Get detailed goal with progress
  const getDetailedGoal = useCallback(async (goalId: string): Promise<GoalWithProgress | null> => {
    try {
      setError(null);
      return await getGoalWithProgress(goalId);
    } catch (err) {
      console.error('Failed to get detailed goal:', err);
      setError('Failed to load goal details');
      throw err;
    }
  }, []);

  // Get active goals only
  const getActiveUserGoals = useCallback(async (): Promise<Goal[]> => {
    if (!user?.id) return [];
    
    try {
      setError(null);
      return await getActiveGoals(user.id);
    } catch (err) {
      console.error('Failed to get active goals:', err);
      setError('Failed to load active goals');
      throw err;
    }
  }, [user?.id]);

  // Get goals by category
  const getGoalsByCategory = useCallback(async (category: string): Promise<Goal[]> => {
    if (!user?.id) return [];
    
    try {
      setError(null);
      return await getGoalsByCategory(user.id, category);
    } catch (err) {
      console.error('Failed to get goals by category:', err);
      setError('Failed to load category goals');
      throw err;
    }
  }, [user?.id]);

  // Load goals when user changes
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Computed values
  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const overdueGoals = goals.filter(goal => goal.status === 'overdue');
  
  const goalStats = {
    total: goals.length,
    active: activeGoals.length,
    completed: completedGoals.length,
    overdue: overdueGoals.length,
    completionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0
  };

  return {
    goals,
    activeGoals,
    completedGoals,
    overdueGoals,
    goalStats,
    loading,
    error,
    createGoal: createNewGoal,
    updateGoal: updateExistingGoal,
    deleteGoal: deleteExistingGoal,
    addProgress,
    getDetailedGoal,
    getActiveGoals: getActiveUserGoals,
    getGoalsByCategory,
    refetch: loadGoals
  };
}