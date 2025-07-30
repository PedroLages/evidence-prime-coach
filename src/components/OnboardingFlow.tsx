import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Target, User, Activity, Calendar, CheckCircle2 } from 'lucide-react';
import { profileAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface OnboardingStep {
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
}

interface OnboardingStepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
  data: any;
  setData: (data: any) => void;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to AI Fitness Coach",
    description: "Let's personalize your fitness journey",
    component: WelcomeStep
  },
  {
    title: "Tell us about yourself",
    description: "Help us understand your fitness background",
    component: ProfileStep
  },
  {
    title: "Set your goals",
    description: "What do you want to achieve?",
    component: GoalsStep
  },
  {
    title: "Choose your level",
    description: "Select your current fitness level",
    component: FitnessLevelStep
  },
  {
    title: "You're all set!",
    description: "Ready to start your fitness journey",
    component: CompletionStep
  }
];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    fullName: '',
    goals: [],
    fitnessLevel: '',
    experience: '',
    workoutDays: 3,
    preferredWorkoutLength: 45
  });
  const { user } = useAuth();

  const handleNext = (stepData?: any) => {
    if (stepData) {
      setOnboardingData(prev => ({ ...prev, ...stepData }));
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      await profileAPI.updateProfile({
        full_name: onboardingData.fullName,
        fitness_level: onboardingData.fitnessLevel,
        primary_goals: onboardingData.goals
      });
      
      // Set onboarding as completed in localStorage
      localStorage.setItem('onboarding_completed', 'true');
      
      toast({
        title: "Welcome aboard!",
        description: "Your profile has been set up successfully."
      });
      
      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div>
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <p className="text-muted-foreground mt-2">
                {steps[currentStep].description}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            onNext={handleNext}
            onPrev={handlePrev}
            data={onboardingData}
            setData={setOnboardingData}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function WelcomeStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
        <Activity className="h-10 w-10 text-primary-foreground" />
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Your AI-powered fitness companion
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Get personalized workouts, track your progress, and receive intelligent coaching 
          tailored to your goals and fitness level.
        </p>
      </div>
      <Button onClick={() => onNext()} size="lg" className="w-full">
        Get Started
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function ProfileStep({ onNext, data, setData }: OnboardingStepProps) {
  const [localData, setLocalData] = useState({
    fullName: data.fullName || '',
    experience: data.experience || ''
  });

  const handleNext = () => {
    if (!localData.fullName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name to continue.",
        variant: "destructive"
      });
      return;
    }
    onNext(localData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={localData.fullName}
            onChange={(e) => setLocalData(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <Label htmlFor="experience">Fitness Experience (Optional)</Label>
          <Textarea
            id="experience"
            value={localData.experience}
            onChange={(e) => setLocalData(prev => ({ ...prev, experience: e.target.value }))}
            placeholder="Tell us about your fitness background, previous injuries, or preferences..."
            rows={3}
          />
        </div>
      </div>
      
      <Button onClick={handleNext} className="w-full">
        Continue
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function GoalsStep({ onNext, data, setData }: OnboardingStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals || []);

  const goals = [
    { id: 'strength', label: 'Build Strength', icon: '💪' },
    { id: 'muscle', label: 'Gain Muscle', icon: '🏋️' },
    { id: 'endurance', label: 'Improve Endurance', icon: '🏃' },
    { id: 'weight_loss', label: 'Lose Weight', icon: '⚖️' },
    { id: 'general_fitness', label: 'General Fitness', icon: '🎯' },
    { id: 'sports_performance', label: 'Sports Performance', icon: '⚽' }
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    if (selectedGoals.length === 0) {
      toast({
        title: "Select at least one goal",
        description: "Please choose what you want to achieve.",
        variant: "destructive"
      });
      return;
    }
    onNext({ goals: selectedGoals });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-4 rounded-lg border text-left transition-colors ${
              selectedGoals.includes(goal.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted'
            }`}
          >
            <div className="text-2xl mb-2">{goal.icon}</div>
            <div className="font-medium">{goal.label}</div>
          </button>
        ))}
      </div>
      
      <Button onClick={handleNext} className="w-full" disabled={selectedGoals.length === 0}>
        Continue
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function FitnessLevelStep({ onNext, data }: OnboardingStepProps) {
  const [selectedLevel, setSelectedLevel] = useState(data.fitnessLevel || '');

  const levels = [
    {
      id: 'beginner',
      title: 'Beginner',
      description: 'New to working out or getting back into fitness'
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      description: 'Comfortable with basic exercises and consistent training'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'Experienced with complex movements and training principles'
    }
  ];

  const handleNext = () => {
    if (!selectedLevel) {
      toast({
        title: "Select your fitness level",
        description: "Please choose your current fitness level.",
        variant: "destructive"
      });
      return;
    }
    onNext({ fitnessLevel: selectedLevel });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => setSelectedLevel(level.id)}
            className={`w-full p-4 rounded-lg border text-left transition-colors ${
              selectedLevel === level.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted'
            }`}
          >
            <div className="font-medium mb-1">{level.title}</div>
            <div className="text-sm text-muted-foreground">{level.description}</div>
          </button>
        ))}
      </div>
      
      <Button onClick={handleNext} className="w-full" disabled={!selectedLevel}>
        Continue
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function CompletionStep({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">You're all set!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your profile has been created and your AI coach is ready to help you 
          achieve your fitness goals. Let's start your first workout!
        </p>
      </div>
      <Button onClick={() => onNext()} size="lg" className="w-full">
        Go to Dashboard
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}