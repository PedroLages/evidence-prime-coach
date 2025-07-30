import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, TrendingDown, Clock, Target, CheckCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkoutModification } from '@/types/aiCoach';
import { cn } from '@/lib/utils';

interface WorkoutModificationAlertProps {
  modifications: WorkoutModification[];
  onAccept: (modification: WorkoutModification) => void;
  onDismiss: (modification: WorkoutModification) => void;
  onModify: (modification: WorkoutModification) => void;
  className?: string;
}

export function WorkoutModificationAlert({
  modifications,
  onAccept,
  onDismiss,
  onModify,
  className
}: WorkoutModificationAlertProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeModifications = modifications.filter(mod => 
    !dismissed.has(`${mod.type}_${mod.severity}`)
  );

  const getSeverityColor = (severity: WorkoutModification['severity']) => {
    switch (severity) {
      case 'major':
        return 'border-destructive bg-destructive/10 text-destructive';
      case 'moderate':
        return 'border-warning bg-warning/10 text-warning';
      case 'minor':
        return 'border-primary bg-primary/10 text-primary';
      default:
        return 'border-muted bg-muted/10 text-muted-foreground';
    }
  };

  const getTypeIcon = (type: WorkoutModification['type']) => {
    switch (type) {
      case 'intensity':
        return <TrendingUp className="h-4 w-4" />;
      case 'volume':
        return <TrendingDown className="h-4 w-4" />;
      case 'rest':
        return <Clock className="h-4 w-4" />;
      case 'exercise':
        return <Target className="h-4 w-4" />;
      case 'deload':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const handleDismiss = (modification: WorkoutModification) => {
    const key = `${modification.type}_${modification.severity}`;
    setDismissed(prev => new Set([...prev, key]));
    onDismiss(modification);
  };

  if (activeModifications.length === 0) return null;

  return (
    <div className={cn("space-y-3 animate-fade-in", className)}>
      {activeModifications.map((modification, index) => (
        <Card 
          key={`${modification.type}_${index}`}
          className={cn(
            "border-l-4 transition-all duration-200 hover:shadow-md",
            getSeverityColor(modification.severity)
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-0.5">
                  {getTypeIcon(modification.type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">
                      AI Workout Suggestion
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {modification.type.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={modification.severity === 'major' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {modification.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    <strong>Reason:</strong> {modification.reason}
                  </p>
                  
                  <p className="text-sm">
                    {modification.explanation}
                  </p>
                  
                  {/* Suggested Changes */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      Suggested Changes:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">From:</span>
                        <div className="font-mono text-xs bg-muted/50 p-1 rounded">
                          {JSON.stringify(modification.original, null, 1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To:</span>
                        <div className="font-mono text-xs bg-primary/10 p-1 rounded">
                          {JSON.stringify(modification.suggested, null, 1)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Confidence */}
                  <div className="text-xs text-muted-foreground">
                    Confidence: {Math.round(modification.confidence * 100)}%
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2 ml-2">
                <Button
                  size="sm"
                  onClick={() => onAccept(modification)}
                  className="h-8 text-xs"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onModify(modification)}
                  className="h-8 text-xs"
                >
                  Modify
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(modification)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Bulk Actions */}
      {activeModifications.length > 1 && (
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {activeModifications.length} suggestions available
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => activeModifications.forEach(onAccept)}
              className="h-8 text-xs"
            >
              Accept All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => activeModifications.forEach(handleDismiss)}
              className="h-8 text-xs"
            >
              Dismiss All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}