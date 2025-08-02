#!/usr/bin/env ts-node

/**
 * Import ExerciseDB API Data
 * 
 * This script imports exercises from the free ExerciseDB API
 * and maps them to our database schema.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Types matching the ExerciseDB API format
interface ExerciseDBExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

interface ExerciseDBResponse {
  success: boolean;
  metadata: {
    totalPages: number;
    totalExercises: number;
    currentPage: number;
    previousPage: string | null;
    nextPage: string | null;
  };
  data: ExerciseDBExercise[];
}

// Our database exercise type (matching src/types/workout.ts)
interface Exercise {
  id?: string;
  name: string;
  category: 'compound' | 'isolation' | 'cardio';
  muscle_groups: string[];
  equipment: string[];
  instructions: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  video_url?: string;
  image_url?: string;
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// ExerciseDB API base URL (free version)
const EXERCISE_DB_BASE = 'https://exercisedb-api.vercel.app/api/v1';

/**
 * Map ExerciseDB body parts to our category system
 */
function mapCategory(bodyParts: string[], targetMuscles: string[]): 'compound' | 'isolation' | 'cardio' {
  const cardioKeywords = ['cardio', 'waist'];
  const compoundBodyParts = ['back', 'chest', 'upper legs', 'lower legs'];
  
  // Check for cardio exercises
  if (bodyParts.some(part => cardioKeywords.includes(part.toLowerCase()))) {
    return 'cardio';
  }
  
  // Multi-body-part exercises are typically compound
  if (bodyParts.length > 1) {
    return 'compound';
  }
  
  // Large muscle group exercises are typically compound
  if (bodyParts.some(part => compoundBodyParts.includes(part.toLowerCase()))) {
    return 'compound';
  }
  
  // Default to isolation for smaller muscle groups
  return 'isolation';
}

/**
 * Clean up muscle group names to match our conventions
 */
function cleanMuscleGroups(targetMuscles: string[], secondaryMuscles: string[]): string[] {
  const muscleMap: Record<string, string> = {
    'upper back': 'back',
    'lower back': 'lower_back',
    'upper arms': 'arms',
    'lower arms': 'forearms',
    'upper legs': 'legs',
    'lower legs': 'calves',
    'cardiovascular system': 'cardio',
    'pectorals': 'chest',
    'abs': 'abs',
    'quads': 'quads',
    'hamstrings': 'hamstrings',
    'glutes': 'glutes',
    'calves': 'calves',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'shoulders': 'shoulders',
    'traps': 'traps',
    'lats': 'lats',
    'forearms': 'forearms',
    'adductors': 'adductors',
    'spine': 'core',
  };
  
  const allMuscles = [...targetMuscles, ...secondaryMuscles];
  
  return allMuscles
    .map(muscle => muscleMap[muscle.toLowerCase()] || muscle.toLowerCase().replace(/\s+/g, '_'))
    .filter((muscle, index, self) => muscle.length > 0 && self.indexOf(muscle) === index);
}

/**
 * Clean up equipment names
 */
function cleanEquipment(equipments: string[]): string[] {
  const equipmentMap: Record<string, string> = {
    'body weight': 'bodyweight',
    'barbell': 'barbell',
    'dumbbell': 'dumbbell',
    'cable': 'cable',
    'leverage machine': 'machine',
    'smith machine': 'machine',
    'kettlebell': 'kettlebell',
    'resistance band': 'resistance_band',
    'medicine ball': 'medicine_ball',
    'olympic barbell': 'barbell',
    'ez barbell': 'barbell',
    'trap bar': 'barbell',
    'assisted': 'machine',
    'stability ball': 'exercise_ball',
    'bosu ball': 'bosu_ball',
    'roller': 'foam_roller',
  };
  
  return equipments
    .map(equipment => equipmentMap[equipment.toLowerCase()] || equipment.toLowerCase().replace(/\s+/g, '_'))
    .filter((equipment, index, self) => equipment.length > 0 && self.indexOf(equipment) === index);
}

/**
 * Determine difficulty level based on exercise characteristics
 */
function determineDifficulty(
  name: string, 
  equipments: string[], 
  targetMuscles: string[]
): 'beginner' | 'intermediate' | 'advanced' {
  const exerciseName = name.toLowerCase();
  
  // Advanced exercises
  const advancedKeywords = [
    'pistol', 'one arm', 'single arm', 'explosive', 'plyometric', 
    'muscle up', 'front lever', 'human flag', 'handstand'
  ];
  
  if (advancedKeywords.some(keyword => exerciseName.includes(keyword))) {
    return 'advanced';
  }
  
  // Intermediate exercises
  const intermediateKeywords = [
    'bulgarian', 'deficit', 'pause', 'tempo', 'chain', 'band',
    'unilateral', 'alternating', 'decline', 'incline'
  ];
  
  if (intermediateKeywords.some(keyword => exerciseName.includes(keyword))) {
    return 'intermediate';
  }
  
  // Machine exercises are typically beginner-friendly
  if (equipments.some(eq => eq.includes('machine'))) {
    return 'beginner';
  }
  
  // Bodyweight exercises for large muscle groups
  const basicBodyweightExercises = [
    'push up', 'pull up', 'squat', 'lunge', 'plank', 'crunch'
  ];
  
  if (equipments.includes('body weight') && 
      basicBodyweightExercises.some(exercise => exerciseName.includes(exercise))) {
    return 'beginner';
  }
  
  // Default to intermediate
  return 'intermediate';
}

/**
 * Convert ExerciseDB format to our Exercise format
 */
function convertExercise(exerciseDBExercise: ExerciseDBExercise): Exercise {
  return {
    name: exerciseDBExercise.name,
    category: mapCategory(exerciseDBExercise.bodyParts, exerciseDBExercise.targetMuscles),
    muscle_groups: cleanMuscleGroups(exerciseDBExercise.targetMuscles, exerciseDBExercise.secondaryMuscles),
    equipment: cleanEquipment(exerciseDBExercise.equipments),
    instructions: exerciseDBExercise.instructions
      .map(instruction => instruction.replace(/^Step:\d+\s*/, '')) // Remove "Step:1 " prefix
      .join('\n\n'),
    difficulty_level: determineDifficulty(
      exerciseDBExercise.name, 
      exerciseDBExercise.equipments, 
      exerciseDBExercise.targetMuscles
    ),
    video_url: exerciseDBExercise.gifUrl, // GIF URL as video
    image_url: exerciseDBExercise.gifUrl, // Same GIF as image
  };
}

/**
 * Fetch exercises from ExerciseDB API with pagination
 */
async function fetchExercises(limit = 100, offset = 0): Promise<ExerciseDBResponse> {
  const url = `${EXERCISE_DB_BASE}/exercises?limit=${limit}&offset=${offset}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data as ExerciseDBResponse;
  } catch (error) {
    console.error(`Error fetching exercises from ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch all exercises with pagination
 */
async function fetchAllExercises(): Promise<ExerciseDBExercise[]> {
  const allExercises: ExerciseDBExercise[] = [];
  let currentOffset = 0;
  const limit = 100;
  
  console.log('📥 Fetching exercises from ExerciseDB API...');
  
  while (true) {
    try {
      const response = await fetchExercises(limit, currentOffset);
      
      if (!response.success || !response.data || response.data.length === 0) {
        break;
      }
      
      allExercises.push(...response.data);
      
      console.log(`   Fetched ${allExercises.length}/${response.metadata.totalExercises} exercises`);
      
      // Check if we've fetched all exercises
      if (currentOffset + limit >= response.metadata.totalExercises) {
        break;
      }
      
      currentOffset += limit;
      
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching exercises at offset ${currentOffset}:`, error);
      break;
    }
  }
  
  console.log(`✅ Successfully fetched ${allExercises.length} exercises\n`);
  return allExercises;
}

/**
 * Insert exercises into database in batches
 */
async function insertExercises(exercises: Exercise[]): Promise<void> {
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    
    console.log(`💾 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(exercises.length / BATCH_SIZE)} (${batch.length} exercises)`);
    
    const { error } = await supabase
      .from('exercises')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting batch:', error);
      throw error;
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Main import function
 */
async function importExerciseDB() {
  console.log('🏋️ Starting ExerciseDB Import...\n');
  
  try {
    // 1. Clear existing exercises (optional - comment out to keep existing)
    console.log('🗑️ Clearing existing exercises...');
    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.warn('Warning clearing exercises (table might be empty):', deleteError.message);
    }
    
    // 2. Fetch all exercises from ExerciseDB API
    const exerciseDBExercises = await fetchAllExercises();
    
    if (exerciseDBExercises.length === 0) {
      throw new Error('No exercises fetched from ExerciseDB API');
    }
    
    // 3. Convert exercises to our format
    console.log('🔄 Converting exercises to our format...');
    const exercises: Exercise[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const exerciseDBExercise of exerciseDBExercises) {
      try {
        const convertedExercise = convertExercise(exerciseDBExercise);
        exercises.push(convertedExercise);
        successCount++;
      } catch (error) {
        console.error(`Error converting exercise ${exerciseDBExercise.name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`✅ Converted ${successCount} exercises successfully`);
    if (errorCount > 0) {
      console.log(`❌ Failed to convert ${errorCount} exercises`);
    }
    console.log();
    
    // 4. Insert into database
    console.log('💾 Inserting exercises into database...');
    await insertExercises(exercises);
    
    console.log(`\n🎉 Successfully imported ${exercises.length} exercises!`);
    
    // 5. Display summary
    const categories = exercises.reduce((acc, ex) => {
      acc[ex.category] = (acc[ex.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 Import Summary:');
    console.log('Categories:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} exercises`);
    });
    
    const difficulties = exercises.reduce((acc, ex) => {
      acc[ex.difficulty_level] = (acc[ex.difficulty_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Difficulty Levels:');
    Object.entries(difficulties).forEach(([level, count]) => {
      console.log(`  ${level}: ${count} exercises`);
    });
    
    // Show unique equipment and muscle groups
    const allEquipment = new Set(exercises.flatMap(ex => ex.equipment));
    console.log(`\nEquipment Types: ${allEquipment.size} unique types`);
    console.log(`Muscle Groups: ${new Set(exercises.flatMap(ex => ex.muscle_groups)).size} unique groups`);
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importExerciseDB()
  .then(() => {
    console.log('\n✨ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });

export { importExerciseDB, convertExercise };