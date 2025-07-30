-- Add height, weight, and unit preferences to profiles table

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS height NUMERIC,
ADD COLUMN IF NOT EXISTS weight NUMERIC,
ADD COLUMN IF NOT EXISTS target_weight NUMERIC,
ADD COLUMN IF NOT EXISTS unit_system TEXT CHECK (unit_system IN ('metric', 'imperial')) DEFAULT 'metric',
ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'cm',
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_unit_system ON public.profiles(unit_system);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.height IS 'User height stored in the unit specified by height_unit';
COMMENT ON COLUMN public.profiles.weight IS 'User current weight stored in the unit specified by weight_unit';
COMMENT ON COLUMN public.profiles.target_weight IS 'User target weight stored in the unit specified by weight_unit';
COMMENT ON COLUMN public.profiles.unit_system IS 'Preferred unit system: metric (kg/cm) or imperial (lbs/in)';
COMMENT ON COLUMN public.profiles.height_unit IS 'Unit for height measurement (cm, in, ft)';
COMMENT ON COLUMN public.profiles.weight_unit IS 'Unit for weight measurement (kg, lbs)';

-- Add validation constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT check_height_positive CHECK (height > 0),
ADD CONSTRAINT check_weight_positive CHECK (weight > 0),
ADD CONSTRAINT check_target_weight_positive CHECK (target_weight > 0);

-- Update RLS policies to include new columns (already covered by existing policies)
-- No need to add new RLS policies as existing ones cover all columns