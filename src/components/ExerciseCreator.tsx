import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, X, Save, Video, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createCustomExercise } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseCreatorProps {
  onExerciseCreated?: () => void;
}

const muscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes',
  'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Calves', 'Abs'
];

const equipmentOptions = [
  'Barbell', 'Dumbbells', 'Kettlebell', 'Resistance Bands', 'Bodyweight',
  'Cable Machine', 'Pull-up Bar', 'Medicine Ball', 'Bench', 'None'
];

const categories = [
  'Strength', 'Cardio', 'Flexibility', 'Balance', 'Power', 'Endurance'
];

export default function ExerciseCreator({ onExerciseCreated }: ExerciseCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [exerciseData, setExerciseData] = useState({
    name: '',
    category: '',
    muscle_groups: [] as string[],
    equipment: [] as string[],
    instructions: '',
    video_url: '',
    difficulty_level: 'beginner'
  });

  const resetForm = () => {
    setExerciseData({
      name: '',
      category: '',
      muscle_groups: [],
      equipment: [],
      instructions: '',
      video_url: '',
      difficulty_level: 'beginner'
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `exercises/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('exercise-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const addMuscleGroup = (muscleGroup: string) => {
    if (!exerciseData.muscle_groups.includes(muscleGroup)) {
      setExerciseData(prev => ({
        ...prev,
        muscle_groups: [...prev.muscle_groups, muscleGroup]
      }));
    }
  };

  const removeMuscleGroup = (muscleGroup: string) => {
    setExerciseData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.filter(mg => mg !== muscleGroup)
    }));
  };

  const addEquipment = (equipment: string) => {
    if (!exerciseData.equipment.includes(equipment)) {
      setExerciseData(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipment]
      }));
    }
  };

  const removeEquipment = (equipment: string) => {
    setExerciseData(prev => ({
      ...prev,
      equipment: prev.equipment.filter(eq => eq !== equipment)
    }));
  };

  const handleSubmit = async () => {
    if (!exerciseData.name || !exerciseData.category || exerciseData.muscle_groups.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in name, category, and at least one muscle group",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Upload image if present
      const imageUrl = await uploadImage();

      // Create the exercise
      await createCustomExercise({
        ...exerciseData,
        image_url: imageUrl
      });

      toast({
        title: "Success",
        description: "Custom exercise created successfully!"
      });

      resetForm();
      setIsOpen(false);
      onExerciseCreated?.(
);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create exercise",
        variant: "destructive"
      });
      console.error('Error creating exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Exercise</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="exercise-name">Exercise Name *</Label>
                  <Input
                    id="exercise-name"
                    value={exerciseData.name}
                    onChange={(e) => setExerciseData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bulgarian Split Squat"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exercise-category">Category *</Label>
                    <Select
                      value={exerciseData.category}
                      onValueChange={(value) => setExerciseData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="exercise-difficulty">Difficulty</Label>
                    <Select
                      value={exerciseData.difficulty_level}
                      onValueChange={(value) => setExerciseData(prev => ({ ...prev, difficulty_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="exercise-instructions">Instructions</Label>
                  <Textarea
                    id="exercise-instructions"
                    value={exerciseData.instructions}
                    onChange={(e) => setExerciseData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Describe how to perform the exercise..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="exercise-video">Video URL (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="exercise-video"
                      value={exerciseData.video_url}
                      onChange={(e) => setExerciseData(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Muscle Groups & Equipment */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Muscle Groups *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select onValueChange={addMuscleGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add muscle group" />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.filter(mg => !exerciseData.muscle_groups.includes(mg)).map(muscleGroup => (
                        <SelectItem key={muscleGroup} value={muscleGroup}>
                          {muscleGroup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2">
                    {exerciseData.muscle_groups.map(muscleGroup => (
                      <Badge key={muscleGroup} variant="secondary" className="cursor-pointer">
                        {muscleGroup}
                        <X 
                          className="ml-1 h-3 w-3" 
                          onClick={() => removeMuscleGroup(muscleGroup)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select onValueChange={addEquipment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentOptions.filter(eq => !exerciseData.equipment.includes(eq)).map(equipment => (
                        <SelectItem key={equipment} value={equipment}>
                          {equipment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2">
                    {exerciseData.equipment.map(equipment => (
                      <Badge key={equipment} variant="outline" className="cursor-pointer">
                        {equipment}
                        <X 
                          className="ml-1 h-3 w-3" 
                          onClick={() => removeEquipment(equipment)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exercise Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-muted/50">
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={imagePreview} 
                            alt="Exercise preview" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1"
                            onClick={(e) => {
                              e.preventDefault();
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> exercise image
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                      <input 
                        id="image-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Exercise'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}