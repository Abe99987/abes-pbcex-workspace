import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  Repeat,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Generate unique ID without external dependency
const generateId = () => Math.random().toString(36).substring(2, 18);

interface IdempotencyWindow {
  present: number;
  dupes: number;
  unique: number;
  dupePercentage: string;
  sampleKeys: string[];
}

interface IdempotencyStats {
  window5m: IdempotencyWindow;
  window60m: IdempotencyWindow;
  lastUpdated: string;
  timestamp: string;
}

const IdempotencyOpsPage: React.FC = () => {
  const [stats, setStats] = useState<IdempotencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [testRunning, setTestRunning] = useState(false);
  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'passed' | 'failed'
  >('idle');
  const [testResults, setTestResults] = useState<{
    beforeStats: IdempotencyStats | null;
    afterStats: IdempotencyStats | null;
  }>({ beforeStats: null, afterStats: null });

  const pollingRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Fetch idempotency stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ops/idem/stats', {
        headers: {
          'X-Admin-Key':
            process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setStats(result.data);
      setError(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(errorMsg);
      console.error('Failed to fetch idempotency stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start/stop polling
  useEffect(() => {
    if (isPolling) {
      fetchStats(); // Initial fetch
      pollingRef.current = setInterval(fetchStats, 5000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isPolling]);

  const getDupesBadge = (percentage: string) => {
    const pct = parseFloat(percentage);
    if (pct === 0) {
      return (
        <Badge className='bg-green-100 text-green-800'>
          <CheckCircle className='w-3 h-3 mr-1' />
          {percentage}
        </Badge>
      );
    } else if (pct < 10) {
      return (
        <Badge className='bg-yellow-100 text-yellow-800'>
          <AlertTriangle className='w-3 h-3 mr-1' />
          {percentage}
        </Badge>
      );
    } else {
      return (
        <Badge className='bg-red-100 text-red-800'>
          <XCircle className='w-3 h-3 mr-1' />
          {percentage}
        </Badge>
      );
    }
  };

  const runDuplicateTest = async () => {
    if (testRunning) {
      setTestRunning(false);
      setTestStatus('idle');
      return;
    }

    setTestRunning(true);
    setTestStatus('testing');
    setTestResults({ beforeStats: null, afterStats: null });

    try {
      // Step 1: Get baseline stats
      await fetchStats();
      const beforeStats = stats;
      setTestResults(prev => ({ ...prev, beforeStats }));

      // Step 2: Generate unique idempotency key
      const idempotencyKey = generateId();

      // Step 3: Send first request (should increment present and unique)
      const firstResponse = await fetch('/api/ops/idem/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key':
            process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '',
          'X-Idempotency-Key': idempotencyKey,
        },
      });

      if (!firstResponse.ok) {
        throw new Error(`First request failed: ${firstResponse.status}`);
      }

      // Step 4: Send duplicate request (should increment present and dupes)
      const secondResponse = await fetch('/api/ops/idem/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key':
            process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '',
          'X-Idempotency-Key': idempotencyKey,
        },
      });

      if (!secondResponse.ok) {
        throw new Error(`Second request failed: ${secondResponse.status}`);
      }

      // Step 5: Wait a moment, then get updated stats
      setTimeout(async () => {
        await fetchStats();
        const afterStats = stats;
        setTestResults(prev => ({ ...prev, afterStats }));

        // Check if test passed
        if (beforeStats && afterStats) {
          const dupesIncreased =
            afterStats.window5m.dupes > beforeStats.window5m.dupes;
          const presentIncreased =
            afterStats.window5m.present >= beforeStats.window5m.present + 2;

          if (dupesIncreased && presentIncreased) {
            setTestStatus('passed');
            toast({
              title: 'Duplicate Test Passed',
              description: `Duplicates increased by ${
                afterStats.window5m.dupes - beforeStats.window5m.dupes
              }, present increased by ${
                afterStats.window5m.present - beforeStats.window5m.present
              }`,
            });
          } else {
            setTestStatus('failed');
            toast({
              title: 'Duplicate Test Failed',
              description: 'Expected metrics did not increase as expected',
              variant: 'destructive',
            });
          }
        }

        setTestRunning(false);
      }, 2000);
    } catch (err) {
      setTestStatus('failed');
      setTestRunning(false);
      toast({
        title: 'Test Error',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>
          Idempotency Operations Dashboard
        </h1>
        <p className='text-muted-foreground'>
          Monitor X-Idempotency-Key usage and detect duplicate requests
        </p>
      </div>

      {/* Controls */}
      <div className='flex gap-4 mb-6'>
        <Button
          onClick={togglePolling}
          variant={isPolling ? 'destructive' : 'default'}
        >
          {isPolling ? (
            <StopCircle className='w-4 h-4 mr-2' />
          ) : (
            <PlayCircle className='w-4 h-4 mr-2' />
          )}
          {isPolling ? 'Stop Polling' : 'Start Polling'}
        </Button>

        <Button onClick={fetchStats} disabled={loading} variant='outline'>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className='border-destructive mb-6'>
          <CardContent className='pt-6'>
            <div className='flex items-center text-destructive'>
              <XCircle className='w-5 h-5 mr-2' />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {stats && (
        <>
          {/* 5-minute window */}
          <div className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>5-Minute Window</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Present</CardTitle>
                  <Activity className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {stats.window5m.present}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Total requests with key
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Unique</CardTitle>
                  <CheckCircle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-600'>
                    {stats.window5m.unique}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    First-time keys
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Duplicates
                  </CardTitle>
                  <Repeat className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-red-600'>
                    {stats.window5m.dupes}
                  </div>
                  <p className='text-xs text-muted-foreground'>Repeated keys</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Dupe %</CardTitle>
                  <AlertTriangle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold mb-2'>
                    {getDupesBadge(stats.window5m.dupePercentage)}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Duplication rate
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 60-minute window */}
          <div className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>60-Minute Window</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Present</CardTitle>
                  <Activity className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {stats.window60m.present}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Total requests with key
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Unique</CardTitle>
                  <CheckCircle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-600'>
                    {stats.window60m.unique}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    First-time keys
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Duplicates
                  </CardTitle>
                  <Repeat className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-red-600'>
                    {stats.window60m.dupes}
                  </div>
                  <p className='text-xs text-muted-foreground'>Repeated keys</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Dupe %</CardTitle>
                  <AlertTriangle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold mb-2'>
                    {getDupesBadge(stats.window60m.dupePercentage)}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Duplication rate
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Duplicate Test Widget */}
      {process.env.NODE_ENV !== 'production' && (
        <Card>
          <CardHeader>
            <CardTitle>Duplicate Request Test</CardTitle>
            <CardDescription>
              Test idempotency behavior by sending duplicate requests with the
              same key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-4'>
                <Button
                  onClick={runDuplicateTest}
                  disabled={loading}
                  variant={testRunning ? 'destructive' : 'default'}
                >
                  {testRunning ? (
                    <>
                      <StopCircle className='w-4 h-4 mr-2' />
                      Stop Test
                    </>
                  ) : (
                    <>
                      <Repeat className='w-4 h-4 mr-2' />
                      Run Duplicate Test
                    </>
                  )}
                </Button>

                {testStatus !== 'idle' && (
                  <div className='flex items-center gap-2'>
                    {testStatus === 'testing' && (
                      <Badge className='bg-blue-100 text-blue-800'>
                        <RefreshCw className='w-3 h-3 mr-1 animate-spin' />
                        Testing...
                      </Badge>
                    )}
                    {testStatus === 'passed' && (
                      <Badge className='bg-green-100 text-green-800'>
                        <CheckCircle className='w-3 h-3 mr-1' />
                        Passed
                      </Badge>
                    )}
                    {testStatus === 'failed' && (
                      <Badge className='bg-red-100 text-red-800'>
                        <XCircle className='w-3 h-3 mr-1' />
                        Failed
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className='text-sm text-muted-foreground'>
              <p className='mb-2'>
                <strong>Test Process:</strong>
              </p>
              <ol className='list-decimal list-inside space-y-1'>
                <li>Record baseline idempotency statistics</li>
                <li>Generate unique idempotency key</li>
                <li>Send first POST request to test endpoint</li>
                <li>Send second POST with same idempotency key</li>
                <li>Verify duplicate counter increments correctly</li>
              </ol>

              {testResults.beforeStats && testResults.afterStats && (
                <div className='mt-4 p-3 bg-muted rounded-lg'>
                  <p className='font-semibold mb-2'>Test Results:</p>
                  <div className='grid grid-cols-2 gap-4 text-xs'>
                    <div>
                      <p>
                        <strong>Before:</strong> Present={' '}
                        {testResults.beforeStats.window5m.present}, Dupes={' '}
                        {testResults.beforeStats.window5m.dupes}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>After:</strong> Present={' '}
                        {testResults.afterStats.window5m.present}, Dupes={' '}
                        {testResults.afterStats.window5m.dupes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className='mt-8 text-center text-sm text-muted-foreground'>
        {stats && (
          <p>Last updated: {new Date(stats.timestamp).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
};

export default IdempotencyOpsPage;
