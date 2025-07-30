import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, X, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getExercises, 
  createWorkoutTemplate,
  createTemplateExercise,
  Exercise 
} from '@/services/database';

interface TemplateExercise {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight?: number;
  rest_seconds?: number;
  notes?: string;
  order_index: number;
}

interface TemplateBuilderProps {
  onTemplateCreated?: (templateId: string) => void;
  onCancel?: () => void;
}

export default function TemplateBuilder({ onTemplateCreated, onCancel }: TemplateBuilderProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Template details
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    estimated_duration: 30
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const exercisesData = await getExercises();
      setExercises(exercisesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load exercises",
        variant: "destructive"
      });
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.muscle_groups.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(exercises.map(e => e.category)))];

  const addExerciseToTemplate = (exercise: Exercise) => {
    const newTemplateExercise: TemplateExercise = {
      id: `template_ex_${Date.now()}`,
      exercise,
      sets: 3,
      reps: 8,
      weight: undefined,
      rest_seconds: 120,
      notes: '',
      order_index: templateExercises.length
    };
    setTemplateExercises(prev => [...prev, newTemplateExercise]);
    setIsAddingExercise(false);
    toast({
      title: "Exercise Added",
      description: `${exercise.name} has been added to your template`
    });
  };

  const removeExerciseFromTemplate = (exerciseId: string) => {
    setTemplateExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const updateTemplateExercise = (exerciseId: string, updates: Partial<TemplateExercise>) => {
    setTemplateExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ));
  };

  const moveExercise = (exerciseId: string, direction: 'up' | 'down') => {
    setTemplateExercises(prev => {
      const currentIndex = prev.findIndex(ex => ex.id === exerciseId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newArray = [...prev];
      [newArray[currentIndex], newArray[newIndex]] = [newArray[newIndex], newArray[currentIndex]];
      
      // Update order indices
      return newArray.map((ex, index) => ({ ...ex, order_index: index }));
    });
  };

  const saveTemplate = async () => {
    if (!templateData.name || !templateData.category) {
      toast({
        title: "Error",
        description: "Please fill in template name and category",
        variant: "destructive"
      });
      return;
    }

    if (templateExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one exercise to your template",
        variant: "destructive"
      });
      return;
    }

    try {
      const template = await createWorkoutTemplate({
        ...templateData,
        user_id: user?.id || '',
        is_public: false
      });

      // Save template exercises
      for (const templateEx of templateExercises) {
        await createTemplateExercise({
          template_id: template.id,
          exercise_id: templateEx.exercise.id,
          order_index: templateEx.order_index,
          sets: templateEx.sets,
          reps: templateEx.reps,
          weight: templateEx.weight,
          rest_seconds: templateEx.rest_seconds,
          notes: templateEx.notes
        });
      }
      
      toast({
        title: "Success",
        description: "Workout template created successfully!"
      });
      
      onTemplateCreated?.(template.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
      console.error('Error creating template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Workout Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Full Body Strength"
              />
            </div>
            <div>
              <Label htmlFor="template-category">Category *</Label>
              <Input
                id="template-category"
                value={templateData.category}
                onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Strength, Cardio"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={templateData.description}
              onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the workout..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-difficulty">Difficulty</Label>
              <Select
                value={templateData.difficulty_level}
                onValueChange={(value) => setTemplateData(prev => ({ ...prev, difficulty_level: value }))}
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
            <div>
              <Label htmlFor="template-duration">Estimated Duration (minutes)</Label>
              <Input
                id="template-duration"
                type="number"
                value={templateData.estimated_duration}
                onChange={(e) => setTemplateData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                min="10"
                max="180"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Exercises */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Template Exercises ({templateExercises.length})</CardTitle>
              <Dialog open={isAddingExercise} onOpenChange={setIsAddingExercise}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Exercise
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add Exercise to Template</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Exercise Search */}
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search exercises..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category === 'all' ? 'All Categories' : category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Exercise List */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {filteredExercises.map(exercise => (
                        <Card key={exercise.id} className="cursor-pointer hover:bg-muted/50" onClick={() => addExerciseToTemplate(exercise)}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{exercise.name}</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {exercise.muscle_groups.map(group => (
                                    <Badge key={group} variant="outline" className="text-xs">
                                      {group}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Badge variant="secondary">{exercise.category}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {templateExercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No exercises added yet</p>
                <Button onClick={() => setIsAddingExercise(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Exercise
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {templateExercises.map((templateEx, index) => (
                  <Card key={templateEx.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{templateEx.exercise.name}</h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {templateEx.exercise.muscle_groups.map(group => (
                              <Badge key={group} variant="outline" className="text-xs">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {index > 0 && (
                            <Button size="sm" variant="outline" onClick={() => moveExercise(templateEx.id, 'up')}>
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                          )}
                          {index < templateExercises.length - 1 && (
                            <Button size="sm" variant="outline" onClick={() => moveExercise(templateEx.id, 'down')}>
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => removeExerciseFromTemplate(templateEx.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <Label htmlFor={`sets-${templateEx.id}`} className="text-xs">Sets</Label>
                          <Input
                            id={`sets-${templateEx.id}`}
                            type="number"
                            value={templateEx.sets}
                            onChange={(e) => updateTemplateExercise(templateEx.id, { sets: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`reps-${templateEx.id}`} className="text-xs">Reps</Label>
                          <Input
                            id={`reps-${templateEx.id}`}
                            type="number"
                            value={templateEx.reps}
                            onChange={(e) => updateTemplateExercise(templateEx.id, { reps: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`weight-${templateEx.id}`} className="text-xs">Weight (lbs)</Label>
                          <Input
                            id={`weight-${templateEx.id}`}
                            type="number"
                            value={templateEx.weight || ''}
                            onChange={(e) => updateTemplateExercise(templateEx.id, { weight: parseInt(e.target.value) || undefined })}
                            min="0"
                            placeholder="Optional"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`rest-${templateEx.id}`} className="text-xs">Rest (sec)</Label>
                          <Input
                            id={`rest-${templateEx.id}`}
                            type="number"
                            value={templateEx.rest_seconds || ''}
                            onChange={(e) => updateTemplateExercise(templateEx.id, { rest_seconds: parseInt(e.target.value) || undefined })}
                            min="0"
                            placeholder="120"
                            className="h-8"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{templateData.name || 'Untitled Template'}</h3>
                <p className="text-sm text-muted-foreground">{templateData.description || 'No description'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-2">{templateData.category || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="ml-2 capitalize">{templateData.difficulty_level}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2">{templateData.estimated_duration} min</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exercises:</span>
                  <span className="ml-2">{templateExercises.length}</span>
                </div>
              </div>

              {templateExercises.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Exercise Order:</h4>
                  <div className="space-y-2">
                    {templateExercises.map((ex, index) => (
                      <div key={ex.id} className="flex justify-between text-sm">
                        <span>{index + 1}. {ex.exercise.name}</span>
                        <span className="text-muted-foreground">
                          {ex.sets} × {ex.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={saveTemplate}>
          <Save className="mr-2 h-4 w-4" />
          Save Template
        </Button>
      </div>
    </div>
  );
}