import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { getBodyMeasurements } from '@/services/database';
import { formatWeight, getDefaultUnits } from '@/lib/units';

interface WeightProgress {
  currentWeight: number | null;
  goalWeight: number | null;
  progressKg: number | null;
  progressPercentage: number | null;
  remainingKg: number | null;
  formattedCurrent: string;
  formattedGoal: string;
  formattedRemaining: string;
  weightUnit: string;
}

export function useWeightProgress(): WeightProgress & { loading: boolean; error: string | null } {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) {
      fetchLatestWeight();
    }
  }, [user, profile]);

  const fetchLatestWeight = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      setError(null);

      // Get the latest body measurements to find current weight
      const measurements = await getBodyMeasurements(user.id);
      
      // Find the most recent weight measurement
      const latestWeightMeasurement = measurements
        .filter(m => m.weight !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      // Use measurement weight if available
      const weight = latestWeightMeasurement?.weight || null;
      setCurrentWeight(weight);
    } catch (err) {
      console.error('Error fetching weight progress:', err);
      setError('Failed to load weight progress');
      // Set to null on error
      setCurrentWeight(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress metrics
  const goalWeight = profile?.target_weight || null;
  const startWeight = null; // TODO: Get from first body measurement  
  const units = getDefaultUnits(profile?.unit_system as 'metric' | 'imperial' || 'metric');
  
  let progressKg: number | null = null;
  let progressPercentage: number | null = null;
  let remainingKg: number | null = null;

  if (currentWeight && goalWeight && startWeight) {
    // Calculate progress from start weight to current weight
    const totalChange = goalWeight - startWeight;
    const currentChange = currentWeight - startWeight;
    
    if (totalChange !== 0) {
      progressPercentage = Math.round((currentChange / totalChange) * 100);
      progressPercentage = Math.max(0, Math.min(100, progressPercentage)); // Clamp between 0-100
    }
    
    progressKg = currentChange;
    remainingKg = goalWeight - currentWeight;
  }

  const formattedCurrent = formatWeight(currentWeight, units.weightUnit);
  const formattedGoal = formatWeight(goalWeight, units.weightUnit);
  const formattedRemaining = remainingKg !== null ? 
    `${Math.abs(remainingKg!).toFixed(1)} ${units.weightUnit}` : '--';

  return {
    currentWeight,
    goalWeight,
    progressKg,
    progressPercentage,
    remainingKg,
    formattedCurrent,
    formattedGoal,
    formattedRemaining,
    weightUnit: units.weightUnit,
    loading,
    error
  };
}