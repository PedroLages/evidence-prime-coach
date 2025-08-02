-- Extend user_settings table to include preferences
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
    "units": "metric",
    "defaultEquipment": ["barbell", "dumbbell", "bodyweight"],
    "preferredWorkoutTypes": ["strength", "hypertrophy"],
    "autoProgressPhotos": false,
    "restTimerSound": true,
    "darkMode": false
}'::jsonb;

-- Update existing records to have default preferences if they don't exist
UPDATE user_settings 
SET preferences = '{
    "units": "metric",
    "defaultEquipment": ["barbell", "dumbbell", "bodyweight"],
    "preferredWorkoutTypes": ["strength", "hypertrophy"],
    "autoProgressPhotos": false,
    "restTimerSound": true,
    "darkMode": false
}'::jsonb
WHERE preferences IS NULL;

-- Add index for preferences queries
CREATE INDEX IF NOT EXISTS idx_user_settings_preferences ON user_settings USING GIN (preferences);

-- Add comment to explain the preferences field
COMMENT ON COLUMN user_settings.preferences IS 'User preferences including units, equipment, workout types, and UI settings';