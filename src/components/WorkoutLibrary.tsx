import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Play, Clock, Target, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import TemplateBuilder from '@/components/TemplateBuilder';
import ExerciseCreator from '@/components/ExerciseCreator';
import { 
  getExercises, 
  getWorkoutTemplates, 
  createWorkoutTemplate, 
  deleteExercise,
  deleteWorkoutTemplate,
  Exercise, 
  WorkoutTemplate 
} from '@/services/database';

interface WorkoutLibraryProps {
  onStartWorkout?: (templateId: string, templateName: string) => void;
}

export default function WorkoutLibrary({ onStartWorkout }: WorkoutLibraryProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exercises' | 'templates'>('templates');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) {
      console.log('WorkoutLibrary: No user found, skipping data load');
      setLoading(false);
      return;
    }
    
    console.log('WorkoutLibrary: Loading data for user:', user.id);
    
    try {
      setLoading(true);
      const [exercisesData, templatesData] = await Promise.all([
        getExercises(),
        getWorkoutTemplates(user.id)
      ]);
      console.log('WorkoutLibrary: Data loaded successfully', { exercises: exercisesData.length, templates: templatesData.length });
      setExercises(exercisesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('WorkoutLibrary: Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load workout data. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateCreated = (templateId: string) => {
    setShowTemplateBuilder(false);
    loadData(); // Refresh the templates list
    toast({
      title: "Success",
      description: "Template created successfully!"
    });
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      await deleteWorkoutTemplate(templateId);
      loadData(); // Refresh the templates list
      toast({
        title: "Success",
        description: "Template deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${exerciseName}"?`)) {
      return;
    }

    try {
      await deleteExercise(exerciseId);
      loadData(); // Refresh the exercises list
      toast({
        title: "Success",
        description: "Exercise deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.muscle_groups.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = ['all', ...Array.from(new Set(exercises.map(e => e.category)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showTemplateBuilder) {
    return (
      <TemplateBuilder 
        onTemplateCreated={handleTemplateCreated}
        onCancel={() => setShowTemplateBuilder(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workout Library</h1>
        <div className="flex space-x-2">
          <ExerciseCreator onExerciseCreated={loadData} />
          <Button onClick={() => setShowTemplateBuilder(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'templates' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </Button>
        <Button
          variant={activeTab === 'exercises' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('exercises')}
        >
          Exercises
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
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
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {activeTab === 'templates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary">
                    {template.difficulty_level}
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {template.estimated_duration} min
                  </div>
                  <div className="flex items-center">
                    <Target className="mr-1 h-4 w-4" />
                    {template.category}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => onStartWorkout?.(template.id, template.name)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Workout
                  </Button>
                  {user && template.user_id === user.id && (
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No templates found. Create your first template!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map(exercise => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow">
              {exercise.image_url && (
                <div className="relative h-48 w-full">
                  <img 
                    src={exercise.image_url} 
                    alt={exercise.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  {exercise.video_url && (
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => window.open(exercise.video_url, '_blank')}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Video
                    </Button>
                  )}
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {exercise.difficulty_level}
                    </Badge>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                      className="text-destructive hover:text-destructive h-6 w-6"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups.map(group => (
                    <Badge key={group} variant="outline" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {exercise.instructions}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{exercise.category}</span>
                  {exercise.equipment && exercise.equipment.length > 0 && (
                    <span>Equipment: {exercise.equipment.join(', ')}</span>
                  )}
                </div>
                {!exercise.image_url && exercise.video_url && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(exercise.video_url, '_blank')}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Watch Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredExercises.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No exercises found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}