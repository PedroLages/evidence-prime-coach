/**
 * AI Workout Generation Page
 * 
 * Dedicated page for AI-powered workout generation with ML insights
 */

import React from 'react';
import { AIWorkoutGenerator } from '@/components/AIWorkoutGenerator';

export default function AIWorkoutPage() {
  const handleWorkoutGenerated = (workout: any) => {
    console.log('Generated workout:', workout);
    // Could save to database, navigate to workout execution, etc.
  };

  return (
    <div className="container mx-auto p-6">
      <AIWorkoutGenerator onWorkoutGenerated={handleWorkoutGenerated} />
    </div>
  );
}