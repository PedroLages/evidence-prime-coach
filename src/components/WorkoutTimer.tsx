import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutTimerProps {
  type: 'rest' | 'exercise' | 'workout';
  duration?: number; // in seconds
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
}

export const WorkoutTimer = ({ 
  type, 
  duration = 60, 
  onComplete, 
  autoStart = false,
  className 
}: WorkoutTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isCompleted) {
      // Reset timer
      setTimeLeft(duration);
      setIsCompleted(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(duration);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  const getTimerConfig = () => {
    switch (type) {
      case 'rest':
        return {
          title: 'Rest Timer',
          icon: <Clock className="h-4 w-4" />,
          color: 'text-blue-600',
          progressColor: 'bg-blue-500'
        };
      case 'exercise':
        return {
          title: 'Exercise Timer',
          icon: <Clock className="h-4 w-4" />,
          color: 'text-orange-600',
          progressColor: 'bg-orange-500'
        };
      default:
        return {
          title: 'Workout Timer',
          icon: <Clock className="h-4 w-4" />,
          color: 'text-green-600',
          progressColor: 'bg-green-500'
        };
    }
  };

  const config = getTimerConfig();

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.icon}
              <h3 className="font-medium text-sm">{config.title}</h3>
            </div>
            {isCompleted && (
              <span className="text-xs text-green-600 font-medium">
                Completed!
              </span>
            )}
          </div>

          <div className="text-center">
            <div className={cn(
              "text-3xl font-mono font-bold",
              isCompleted ? 'text-green-600' : config.color
            )}>
              {formatTime(timeLeft)}
            </div>
            <Progress 
              value={progress} 
              className="mt-2 h-2"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="h-8"
            >
              {isRunning ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>

          {type === 'rest' && timeLeft <= 10 && timeLeft > 0 && isRunning && (
            <div className="text-center">
              <span className="text-xs text-orange-600 font-medium animate-pulse">
                Get ready for next set!
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};