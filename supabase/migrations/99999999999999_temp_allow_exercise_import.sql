-- Temporary migration to allow exercise imports
-- This will be reverted after import is complete

-- Create temporary policy to allow public inserts for exercise import
CREATE POLICY "Temporary: Allow public exercise inserts" ON public.exercises
  FOR INSERT USING (true);

-- Note: Remember to drop this policy after import is complete
-- DROP POLICY IF EXISTS "Temporary: Allow public exercise inserts" ON public.exercises;