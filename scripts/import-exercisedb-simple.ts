#!/usr/bin/env ts-node

/**
 * Simple ExerciseDB Import
 * 
 * This version imports a smaller set of exercises for testing
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Sample exercises to test the import
const sampleExercises = [
  {
    name: 'Push Up',
    category: 'compound' as const,
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    instructions: 'Start in a plank position with hands shoulder-width apart.\n\nLower your body until your chest nearly touches the floor.\n\nPush back up to the starting position.',
    difficulty_level: 'beginner' as const,
    video_url: 'https://static.exercisedb.dev/media/pushup.gif',
    image_url: 'https://static.exercisedb.dev/media/pushup.gif',
  },
  {
    name: 'Barbell Bench Press',
    category: 'compound' as const,
    muscle_groups: ['chest', 'triceps', 'shoulders'], 
    equipment: ['barbell'],
    instructions: 'Lie on a bench with your feet flat on the floor.\n\nGrip the barbell with hands slightly wider than shoulder-width.\n\nLower the bar to your chest, then press it back up.',
    difficulty_level: 'intermediate' as const,
    video_url: 'https://static.exercisedb.dev/media/bench-press.gif',
    image_url: 'https://static.exercisedb.dev/media/bench-press.gif',
  },
  {
    name: 'Bicep Curls',
    category: 'isolation' as const,
    muscle_groups: ['biceps'],
    equipment: ['dumbbell'],
    instructions: 'Stand with feet shoulder-width apart, holding dumbbells at your sides.\n\nCurl the weights up toward your shoulders.\n\nSlowly lower back to starting position.',
    difficulty_level: 'beginner' as const,
    video_url: 'https://static.exercisedb.dev/media/bicep-curl.gif',
    image_url: 'https://static.exercisedb.dev/media/bicep-curl.gif',
  }
];

async function insertSampleExercises() {
  console.log('🏋️ Inserting sample exercises...\n');

  try {
    // First, let's see current exercises
    const { data: currentExercises, error: selectError } = await supabase
      .from('exercises')
      .select('name')
      .limit(5);
      
    console.log('Current exercises in DB:', currentExercises?.length || 0);
    if (currentExercises && currentExercises.length > 0) {
      console.log('Sample names:', currentExercises.map(ex => ex.name).join(', '));
    }
    console.log();

    // Try to insert sample exercises
    for (const exercise of sampleExercises) {
      console.log(`Inserting: ${exercise.name}`);
      
      const { data, error } = await supabase
        .from('exercises')
        .insert([exercise])
        .select();
      
      if (error) {
        console.error(`❌ Failed to insert ${exercise.name}:`, error.message);
      } else {
        console.log(`✅ Successfully inserted ${exercise.name}`);
      }
    }

    console.log('\n🎉 Sample insert completed!');

  } catch (error) {
    console.error('❌ Insert failed:', error);
  }
}

// Run the import
insertSampleExercises();