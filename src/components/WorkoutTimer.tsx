import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WorkoutTimerProps {
  type: 'workout' | 'rest';
  duration?: number; // seconds
  onComplete?: () => void;
  className?: string;
}

export default function WorkoutTimer({ 
  type, 
  duration = 0, 
  onComplete,
  className 
}: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setHasStarted(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setHasStarted(false);
  };

  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return ((duration - timeLeft) / duration) * 100;
  };

  return (
    <Card className={cn(
      "border-0",
      type === 'rest' ? "bg-gradient-accent text-accent-foreground" : "bg-gradient-primary text-primary-foreground",
      className
    )}>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Timer className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {type === 'rest' ? 'Rest Time' : 'Workout Timer'}
            </h3>
          </div>

          {/* Timer Display */}
          <div className="relative">
            <div className="text-4xl font-bold mb-2">
              {formatTime(timeLeft)}
            </div>
            
            {duration > 0 && (
              <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            {!isRunning ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStart}
                className="bg-white/20 hover:bg-white/30 text-inherit border-0"
              >
                <Play className="h-4 w-4 mr-2" />
                {hasStarted ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePause}
                className="bg-white/20 hover:bg-white/30 text-inherit border-0"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="bg-white/20 hover:bg-white/30 text-inherit border-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Add Time */}
          {type === 'rest' && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTimeLeft(prev => prev + 30)}
                className="bg-white/20 hover:bg-white/30 text-inherit border-0 text-xs"
              >
                +30s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTimeLeft(prev => prev + 60)}
                className="bg-white/20 hover:bg-white/30 text-inherit border-0 text-xs"
              >
                +1m
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}