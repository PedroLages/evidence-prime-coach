import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';

export function DynamicProgressOverview() {
  // Temporarily disabled due to type mismatches with database structure
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Progress overview temporarily disabled</p>
      <p className="text-sm text-muted-foreground mt-2">Working on fixing database schema mismatches...</p>
    </div>
  );
}