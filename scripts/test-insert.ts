import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hpjyznwktznaldfydcgh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwanl6bndrdHpuYWxkZnlkY2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTU1NDksImV4cCI6MjA2OTQ3MTU0OX0.9vG8kAGdwQqkeIkyz7QRi4SZFdZT_auXnRfmYU3MxIQ'
);

async function testInsert() {
  const testExercise = {
    name: 'Test Exercise',
    category: 'compound',
    muscle_groups: ['chest'],
    equipment: ['barbell'],
    instructions: 'Test instructions',
    difficulty_level: 'beginner'
  };

  const result = await supabase.from('exercises').insert([testExercise]);
  console.log('Insert result:', result);
}

testInsert().catch(console.error);