// Unit conversion utilities

export type UnitSystem = 'metric' | 'imperial';
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'in' | 'ft';

// Weight conversions
export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return value;
  
  if (from === 'kg' && to === 'lbs') {
    return value * 2.20462;
  }
  
  if (from === 'lbs' && to === 'kg') {
    return value / 2.20462;
  }
  
  return value;
};

// Height conversions
export const convertHeight = (value: number, from: HeightUnit, to: HeightUnit): number => {
  if (from === to) return value;
  
  // Convert to cm first (base unit)
  let valueInCm = value;
  
  if (from === 'in') {
    valueInCm = value * 2.54;
  } else if (from === 'ft') {
    valueInCm = value * 30.48;
  }
  
  // Convert from cm to target unit
  if (to === 'in') {
    return valueInCm / 2.54;
  } else if (to === 'ft') {
    return valueInCm / 30.48;
  }
  
  return valueInCm; // cm
};

// Get default units for a unit system
export const getDefaultUnits = (system: UnitSystem) => {
  if (system === 'metric') {
    return {
      weightUnit: 'kg' as WeightUnit,
      heightUnit: 'cm' as HeightUnit
    };
  } else {
    return {
      weightUnit: 'lbs' as WeightUnit,
      heightUnit: 'in' as HeightUnit
    };
  }
};

// Format display values
export const formatWeight = (value: number | null, unit: WeightUnit): string => {
  if (value === null) return '--';
  return `${value.toFixed(1)} ${unit}`;
};

export const formatHeight = (value: number | null, unit: HeightUnit): string => {
  if (value === null) return '--';
  
  if (unit === 'ft') {
    const feet = Math.floor(value);
    const inches = Math.round((value - feet) * 12);
    return `${feet}'${inches}"`;
  }
  
  return `${Math.round(value)} ${unit}`;
};

// Convert height from feet/inches input to decimal feet
export const feetInchesToDecimalFeet = (feet: number, inches: number = 0): number => {
  return feet + (inches / 12);
};

// Convert decimal feet to feet and inches
export const decimalFeetToFeetInches = (decimalFeet: number): { feet: number; inches: number } => {
  const feet = Math.floor(decimalFeet);
  const inches = Math.round((decimalFeet - feet) * 12);
  return { feet, inches };
};

// Calculate BMI
export const calculateBMI = (weight: number | null, height: number | null, weightUnit: WeightUnit, heightUnit: HeightUnit): number | null => {
  if (!weight || !height) return null;
  
  // Convert to metric for calculation
  const weightInKg = convertWeight(weight, weightUnit, 'kg');
  const heightInCm = convertHeight(height, heightUnit, 'cm');
  const heightInM = heightInCm / 100;
  
  return weightInKg / (heightInM * heightInM);
};

// Validate measurements
export const validateWeight = (value: number, unit: WeightUnit): boolean => {
  const minWeight = unit === 'kg' ? 20 : 44; // 20kg or 44lbs minimum
  const maxWeight = unit === 'kg' ? 300 : 660; // 300kg or 660lbs maximum
  
  return value >= minWeight && value <= maxWeight;
};

export const validateHeight = (value: number, unit: HeightUnit): boolean => {
  let minHeight: number, maxHeight: number;
  
  switch (unit) {
    case 'cm':
      minHeight = 100; // 1m
      maxHeight = 250; // 2.5m
      break;
    case 'in':
      minHeight = 39; // ~1m
      maxHeight = 98; // ~2.5m
      break;
    case 'ft':
      minHeight = 3.3; // ~1m
      maxHeight = 8.2; // ~2.5m
      break;
    default:
      return false;
  }
  
  return value >= minHeight && value <= maxHeight;
};