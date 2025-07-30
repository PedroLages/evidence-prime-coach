import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CoachingInsight } from '@/types/aiCoach';
import { cn } from '@/lib/utils';

interface AICoachPanelProps {
  insights: CoachingInsight[];
  onDismissInsight: (insightId: string) => void;
  onActionClick: (action: string, data?: any) => void;
  className?: string;
}

export function AICoachPanel({ 
  insights, 
  onDismissInsight, 
  onActionClick, 
  className 
}: AICoachPanelProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  // Auto-expand critical insights
  useEffect(() => {
    const criticalInsights = insights
      .filter(insight => insight.priority === 'critical' && !dismissedInsights.has(insight.id))
      .map(insight => insight.id);
    
    setExpandedInsights(prev => new Set([...prev, ...criticalInsights]));
  }, [insights, dismissedInsights]);

  const toggleExpanded = (insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  const handleDismiss = (insightId: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]));
    onDismissInsight(insightId);
  };

  const getInsightIcon = (insight: CoachingInsight) => {
    switch (insight.category) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'celebration':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'suggestion':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: CoachingInsight['priority']) => {
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

  const activeInsights = insights.filter(insight => !dismissedInsights.has(insight.id));

  if (activeInsights.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No insights available. Keep tracking your data!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Coach Insights
          <Badge variant="secondary" className="ml-auto">
            {activeInsights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {activeInsights.map((insight) => (
          <Collapsible
            key={insight.id}
            open={expandedInsights.has(insight.id)}
            onOpenChange={() => toggleExpanded(insight.id)}
          >
            <div className={cn(
              "border-l-4 rounded-lg p-4 transition-all duration-200",
              getPriorityColor(insight.priority)
            )}>
              <CollapsibleTrigger asChild>
                <div className="flex items-start justify-between cursor-pointer group">
                  <div className="flex items-start gap-3 flex-1">
                    {getInsightIcon(insight)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm leading-tight">
                          {insight.title}
                        </h4>
                        <Badge 
                          variant={insight.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs px-1.5 py-0.5"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(insight.id);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {expandedInsights.has(insight.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-3 animate-accordion-down">
                <div className="space-y-3 ml-7">
                  {/* Evidence */}
                  {insight.evidence && insight.evidence.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">
                        Evidence:
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {insight.evidence.map((evidence, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0" />
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  {insight.actions && insight.actions.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">
                        Recommended Actions:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {insight.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => onActionClick(action.action, action.data)}
                            className="h-7 text-xs"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </span>
                    <span>
                      {new Date(insight.timestamp).toLocaleDateString()}
                    </span>
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
              {activeInsights.filter(i => i.priority === 'critical' || i.priority === 'high').length} high priority
            </span>
            <span>
              Avg confidence: {Math.round(
                activeInsights.reduce((sum, i) => sum + i.confidence, 0) / activeInsights.length * 100
              )}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}