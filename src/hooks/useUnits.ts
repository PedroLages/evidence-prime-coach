import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getBodyMeasurements } from '@/services/database';
import { UnitSystem, getDefaultUnits } from '@/lib/units';

interface UseUnitsReturn {
  unitSystem: UnitSystem;
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'in';
  setUnitSystem: (system: UnitSystem) => void;
  loading: boolean;
}

// Default to metric system
const DEFAULT_UNIT_SYSTEM: UnitSystem = 'metric';

export function useUnits(): UseUnitsReturn {
  const { user } = useAuth();
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(DEFAULT_UNIT_SYSTEM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnitPreference();
  }, [user]);

  const loadUnitPreference = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First, try to get from localStorage
      const storedUnitSystem = localStorage.getItem(`unit_system_${user.id}`);
      if (storedUnitSystem && (storedUnitSystem === 'metric' || storedUnitSystem === 'imperial')) {
        setUnitSystemState(storedUnitSystem);
        setLoading(false);
        return;
      }

      // If no localStorage setting, try to infer from most recent body measurement
      const measurements = await getBodyMeasurements(user.id, 1);
      if (measurements.length > 0) {
        const lastMeasurement = measurements[0];
        setUnitSystemState(lastMeasurement.unit_system);
        // Save to localStorage for future use
        localStorage.setItem(`unit_system_${user.id}`, lastMeasurement.unit_system);
      } else {
        // No measurements found, use default
        setUnitSystemState(DEFAULT_UNIT_SYSTEM);
        localStorage.setItem(`unit_system_${user.id}`, DEFAULT_UNIT_SYSTEM);
      }
    } catch (error) {
      console.error('Error loading unit preference:', error);
      setUnitSystemState(DEFAULT_UNIT_SYSTEM);
    } finally {
      setLoading(false);
    }
  };

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`unit_system_${user.id}`, system);
    }
  };

  const { weightUnit, heightUnit } = getDefaultUnits(unitSystem);

  return {
    unitSystem,
    weightUnit,
    heightUnit,
    setUnitSystem,
    loading
  };
}