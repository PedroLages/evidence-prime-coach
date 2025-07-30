import { useState, useEffect } from 'react';
import { Brain, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RealTimeCoaching } from '@/types/aiCoach';
import { cn } from '@/lib/utils';

interface CoachingFloatingButtonProps {
  coaching: RealTimeCoaching | null;
  onGuidanceRequest: () => void;
  className?: string;
}

export function CoachingFloatingButton({
  coaching,
  onGuidanceRequest,
  className
}: CoachingFloatingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);

  useEffect(() => {
    if (coaching && coaching.suggestions.length > 0) {
      setHasNewSuggestions(true);
      // Auto-expand for high urgency suggestions
      const hasHighUrgency = coaching.suggestions.some(s => s.urgency === 'high');
      if (hasHighUrgency) {
        setIsExpanded(true);
      }
    }
  }, [coaching]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    setHasNewSuggestions(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const immediateSuggestions = coaching?.suggestions.filter(s => s.timing === 'immediate') || [];
  const nextSetSuggestions = coaching?.suggestions.filter(s => s.timing === 'next-set') || [];

  return (
    <div className={cn("fixed bottom-24 right-4 z-50", className)}>
      {isExpanded && coaching && (
        <Card className="mb-4 w-80 animate-scale-in shadow-lg border-primary">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Coach</span>
                <Badge variant="secondary" className="text-xs">
                  {coaching.phase.replace('-', ' ')}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Immediate Suggestions */}
            {immediateSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Right Now:</h4>
                {immediateSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 rounded-lg text-sm border-l-2",
                      suggestion.urgency === 'high' 
                        ? "bg-destructive/10 border-destructive" 
                        : "bg-primary/10 border-primary"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Badge className={cn("text-xs", getUrgencyColor(suggestion.urgency))}>
                        {suggestion.type}
                      </Badge>
                      <span className="flex-1">{suggestion.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Next Set Suggestions */}
            {nextSetSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Next Set:</h4>
                {nextSetSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg text-sm bg-muted/30 border-l-2 border-muted"
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <span className="flex-1">{suggestion.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Context Info */}
            {coaching.context && (
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {coaching.context.currentExercise && (
                    <div>Exercise: {coaching.context.currentExercise}</div>
                  )}
                  {coaching.context.setNumber && (
                    <div>Set: {coaching.context.setNumber}</div>
                  )}
                  {coaching.context.rpe && (
                    <div>Last RPE: {coaching.context.rpe}/10</div>
                  )}
                  {coaching.context.fatigue && (
                    <div>Fatigue: {Math.round(coaching.context.fatigue)}/10</div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={onGuidanceRequest}
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Ask Coach
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Floating Button */}
      <Button
        onClick={handleExpand}
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg relative transition-all duration-200 hover-scale",
          hasNewSuggestions && "animate-pulse"
        )}
      >
        <Brain className="h-6 w-6" />
        
        {/* Notification Badge */}
        {hasNewSuggestions && !isExpanded && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
            <span className="text-xs text-destructive-foreground font-medium">
              {coaching?.suggestions.length || 0}
            </span>
          </div>
        )}

        {/* Expand/Collapse Icon */}
        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-secondary rounded-full flex items-center justify-center">
          {isExpanded ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </div>
      </Button>
    </div>
  );
}