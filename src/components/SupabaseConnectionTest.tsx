import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    setTestResults(null);

    try {
      // Test 1: Basic connection
      console.log('Testing Supabase connection...');
      
      // Test 2: Database query
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (profileError) {
        throw new Error(`Database query failed: ${profileError.message}`);
      }

      // Test 3: Auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.warn('Auth check failed:', authError.message);
      }

      // Test 4: Available tables (this will help debug schema issues)
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_schema_info')
        .then(() => ({ data: 'Schema accessible', error: null }))
        .catch(() => ({ data: null, error: 'Schema RPC not available' }));

      setTestResults({
        databaseConnected: true,
        userSession: session ? 'Authenticated' : 'Not authenticated',
        userEmail: session?.user?.email || 'No user',
        projectUrl: supabase.supabaseUrl,
        tablesAccessible: !tablesError
      });

      setConnectionStatus('connected');
      console.log('✅ Supabase connection successful!');

    } catch (err: any) {
      setError(err.message);
      setConnectionStatus('failed');
      console.error('❌ Supabase connection failed:', err);
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      case 'connected':
        return <Badge variant="default" className="bg-green-600">Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supabase Connection
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={connectionStatus === 'testing'}>
          {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">Connection Error:</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {testResults && (
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800">Connection Details:</p>
              <ul className="mt-2 space-y-1 text-green-700">
                <li>• Database: {testResults.databaseConnected ? '✅ Connected' : '❌ Failed'}</li>
                <li>• Auth Status: {testResults.userSession}</li>
                <li>• User: {testResults.userEmail}</li>
                <li>• Project URL: {testResults.projectUrl}</li>
                <li>• Tables: {testResults.tablesAccessible ? '✅ Accessible' : '⚠️ Limited'}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Project: hpjyznwktznaldfydcgh</p>
          <p>URL: https://hpjyznwktznaldfydcgh.supabase.co</p>
        </div>
      </CardContent>
    </Card>
  );
}