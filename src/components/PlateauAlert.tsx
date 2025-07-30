import { AlertTriangle, TrendingDown, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlateauAnalysis } from '@/types/autoProgression';
import { cn } from '@/lib/utils';

interface PlateauAlertProps {
  analysis: PlateauAnalysis;
  onAcceptRecommendation: (recommendation: PlateauAnalysis['recommendations'][0]) => void;
  onDismiss: () => void;
  className?: string;
}

export function PlateauAlert({ 
  analysis, 
  onAcceptRecommendation, 
  onDismiss, 
  className 
}: PlateauAlertProps) {
  if (!analysis.isDetected) {
    return null;
  }

  const getSeverityColor = (severity: PlateauAnalysis['severity']) => {
    switch (severity) {
      case 'severe':
        return 'border-destructive bg-destructive/10 text-destructive';
      case 'moderate':
        return 'border-warning bg-warning/10 text-warning';
      case 'mild':
        return 'border-orange-500 bg-orange-500/10 text-orange-600';
      default:
        return 'border-muted bg-muted/10 text-muted-foreground';
    }
  };

  const getTypeIcon = (type: PlateauAnalysis['type']) => {
    switch (type) {
      case 'weight_stall':
        return <TrendingDown className="h-4 w-4" />;
      case 'rpe_inflation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'volume_decline':
        return <Target className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatPlateauType = (type: PlateauAnalysis['type']) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className={cn(
      "w-full border-l-4 transition-all duration-200",
      getSeverityColor(analysis.severity),
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getTypeIcon(analysis.type)}
          <span className="text-base">Plateau Detected: {analysis.exercise}</span>
          <Badge 
            variant={analysis.severity === 'severe' ? 'destructive' : 'secondary'}
            className="ml-auto"
          >
            {analysis.severity}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Plateau Details */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{analysis.duration}</div>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{formatPlateauType(analysis.type)}</div>
            <p className="text-xs text-muted-foreground">Type</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{Math.round(analysis.confidence * 100)}%</div>
            <p className="text-xs text-muted-foreground">Confidence</p>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Performance Trend:</h4>
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <span>
              {analysis.trend.direction === 'declining' ? 'Declining' : 
               analysis.trend.direction === 'stable' ? 'Stagnant' : 'Volatile'} 
              performance over {analysis.trend.dataPoints} sessions
            </span>
          </div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Recommended Actions:
            </h4>
            <div className="space-y-2">
              {analysis.recommendations.slice(0, 2).map((rec, index) => (
                <div 
                  key={index}
                  className="p-3 border rounded-lg space-y-2 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">{rec.description}</h5>
                    <Badge variant="outline" className="text-xs">
                      {rec.expectedDuration}w
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {rec.implementation}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                      Success metrics: {rec.successMetrics.slice(0, 2).join(', ')}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onAcceptRecommendation(rec)}
                      className="h-7 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            Next review: {new Date(analysis.nextReviewDate).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="h-8 text-xs"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => analysis.recommendations[0] && onAcceptRecommendation(analysis.recommendations[0])}
              className="h-8 text-xs"
              disabled={analysis.recommendations.length === 0}
            >
              Apply Top Recommendation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}