import { useState } from 'react';
import { TrendingUp, Target, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProgressionSuggestion } from '@/types/autoProgression';
import { cn } from '@/lib/utils';

interface AutoProgressionCardProps {
  suggestions: ProgressionSuggestion[];
  onAcceptSuggestion: (suggestion: ProgressionSuggestion) => void;
  onModifySuggestion: (suggestion: ProgressionSuggestion) => void;
  onRejectSuggestion: (suggestion: ProgressionSuggestion) => void;
  className?: string;
}

export function AutoProgressionCard({
  suggestions,
  onAcceptSuggestion,
  onModifySuggestion,
  onRejectSuggestion,
  className
}: AutoProgressionCardProps) {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  const toggleExpanded = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const getSuggestionIcon = (type: ProgressionSuggestion['type']) => {
    switch (type) {
      case 'weight_increase':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'volume_increase':
        return <Target className="h-4 w-4 text-primary" />;
      case 'deload':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'plateau_break':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: ProgressionSuggestion['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-destructive bg-destructive/5';
      case 'high':
        return 'border-l-warning bg-warning/5';
      case 'medium':
        return 'border-l-primary bg-primary/5';
      default:
        return 'border-l-muted bg-muted/5';
    }
  };

  const formatWeight = (weight: number) => `${weight}kg`;
  const formatChange = (current: number, suggested: number) => {
    const diff = suggested - current;
    return diff > 0 ? `+${diff}kg` : `${diff}kg`;
  };

  if (suggestions.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No progression suggestions available</p>
          <p className="text-sm text-muted-foreground">Complete more workouts to get AI recommendations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Auto-Progression
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <Collapsible
            key={suggestion.id}
            open={expandedSuggestions.has(suggestion.id)}
            onOpenChange={() => toggleExpanded(suggestion.id)}
          >
            <div className={cn(
              "border-l-4 rounded-lg p-4 transition-all duration-200",
              getPriorityColor(suggestion.priority)
            )}>
              <CollapsibleTrigger asChild>
                <div className="flex items-start justify-between cursor-pointer group">
                  <div className="flex items-start gap-3 flex-1">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm leading-tight">
                          {suggestion.exercise}
                        </h4>
                        <Badge 
                          variant={suggestion.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs px-1.5 py-0.5"
                        >
                          {suggestion.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Current:</span>
                          <span className="font-mono">
                            {formatWeight(suggestion.current.weight)} × {suggestion.current.reps}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Suggested:</span>
                          <span className="font-mono font-medium">
                            {formatWeight(suggestion.suggested.weight)} × {suggestion.suggested.reps}
                            <span className="text-success ml-2">
                              ({formatChange(suggestion.current.weight, suggestion.suggested.weight)})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                    {expandedSuggestions.has(suggestion.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-3 animate-accordion-down">
                <div className="space-y-3 ml-7">
                  {/* Reasoning */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">
                      Reasoning:
                    </h5>
                    <p className="text-sm text-foreground">
                      {suggestion.reasoning}
                    </p>
                  </div>

                  {/* Evidence */}
                  {suggestion.evidence && suggestion.evidence.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">
                        Evidence:
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {suggestion.evidence.map((evidence, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0" />
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence Bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <Progress value={suggestion.confidence * 100} className="flex-1 h-1.5" />
                    <span className="text-xs font-medium">{Math.round(suggestion.confidence * 100)}%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptSuggestion(suggestion);
                      }}
                      className="flex-1 h-8 text-xs"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onModifySuggestion(suggestion);
                      }}
                      className="flex-1 h-8 text-xs"
                    >
                      Modify
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectSuggestion(suggestion);
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {/* Summary Stats */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {suggestions.filter(s => s.priority === 'critical' || s.priority === 'high').length} high priority
            </span>
            <span>
              Avg confidence: {Math.round(
                suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length * 100
              )}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}