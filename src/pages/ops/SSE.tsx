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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SSEStats {
  activeByChannel: Record<string, number>;
  lastHeartbeatMaxAgeSec: number;
  opensLast5m: number;
  closesLast5m: number;
  sampleConnIds: Record<string, string[]>;
  totalActive: number;
  healthStatus: 'ok' | 'warn' | 'stale';
  timestamp: string;
}

const SSEOpsPage: React.FC = () => {
  const [stats, setStats] = useState<SSEStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [leakTestRunning, setLeakTestRunning] = useState(false);
  const [leakTestStatus, setLeakTestStatus] = useState<
    'idle' | 'testing' | 'passed' | 'failed'
  >('idle');
  const [testEventSource, setTestEventSource] = useState<EventSource | null>(
    null
  );

  const pollingRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Fetch SSE stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ops/sse/stats', {
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
      console.error('Failed to fetch SSE stats:', err);
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

  // Cleanup test EventSource on unmount
  useEffect(() => {
    return () => {
      if (testEventSource) {
        testEventSource.close();
        setTestEventSource(null);
      }
    };
  }, [testEventSource]);

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return (
          <Badge className='bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Healthy
          </Badge>
        );
      case 'warn':
        return (
          <Badge className='bg-yellow-100 text-yellow-800'>
            <AlertTriangle className='w-3 h-3 mr-1' />
            Warning
          </Badge>
        );
      case 'stale':
        return (
          <Badge className='bg-red-100 text-red-800'>
            <XCircle className='w-3 h-3 mr-1' />
            Stale
          </Badge>
        );
      default:
        return <Badge variant='secondary'>Unknown</Badge>;
    }
  };

  const runLeakTest = async () => {
    if (leakTestRunning) {
      // Stop test
      if (testEventSource) {
        testEventSource.close();
        setTestEventSource(null);
      }
      setLeakTestRunning(false);
      setLeakTestStatus('idle');
      return;
    }

    setLeakTestRunning(true);
    setLeakTestStatus('testing');

    try {
      // Step 1: Get baseline connection count
      await fetchStats();
      const baselineConnections = stats?.totalActive || 0;

      // Step 2: Open a test EventSource connection
      const eventSource = new EventSource('/api/prices/stream?symbols=XAU,BTC');
      setTestEventSource(eventSource);

      eventSource.onopen = () => {
        toast({
          title: 'Test Connection Opened',
          description: 'EventSource connected to prices stream',
        });
      };

      eventSource.onerror = error => {
        console.warn('EventSource error during leak test:', error);
      };

      // Step 3: Wait a moment, then check connection count increased
      setTimeout(async () => {
        await fetchStats();
        const afterOpenCount = stats?.totalActive || 0;

        if (afterOpenCount > baselineConnections) {
          // Step 4: Navigate away simulation (close connection)
          eventSource.close();
          setTestEventSource(null);

          // Step 5: Wait a moment, then verify connection cleaned up
          setTimeout(async () => {
            await fetchStats();
            const afterCloseCount = stats?.totalActive || 0;

            if (afterCloseCount <= baselineConnections) {
              setLeakTestStatus('passed');
              toast({
                title: 'Leak Test Passed',
                description: 'Connection properly cleaned up after close',
              });
            } else {
              setLeakTestStatus('failed');
              toast({
                title: 'Leak Test Failed',
                description: `Connection leaked: ${afterCloseCount} vs baseline ${baselineConnections}`,
                variant: 'destructive',
              });
            }
            setLeakTestRunning(false);
          }, 2000);
        } else {
          setLeakTestStatus('failed');
          setLeakTestRunning(false);
          toast({
            title: 'Leak Test Failed',
            description: 'Connection count did not increase as expected',
            variant: 'destructive',
          });
        }
      }, 2000);
    } catch (err) {
      setLeakTestStatus('failed');
      setLeakTestRunning(false);
      toast({
        title: 'Leak Test Error',
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
        <h1 className='text-3xl font-bold mb-2'>SSE Operations Dashboard</h1>
        <p className='text-muted-foreground'>
          Monitor server-sent event connections and detect potential leaks
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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {/* Overall Health */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Overall Health
              </CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold mb-2'>
                {getHealthBadge(stats.healthStatus)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Max heartbeat age: {stats.lastHeartbeatMaxAgeSec}s
              </p>
            </CardContent>
          </Card>

          {/* Total Active Connections */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Connections
              </CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalActive}</div>
              <p className='text-xs text-muted-foreground'>
                Across {Object.keys(stats.activeByChannel).length} channels
              </p>
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Recent Activity
              </CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                +{stats.opensLast5m} / -{stats.closesLast5m}
              </div>
              <p className='text-xs text-muted-foreground'>
                Opens / Closes (last 5m)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Channel Details */}
      {stats && Object.keys(stats.activeByChannel).length > 0 && (
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Connections by Channel</CardTitle>
            <CardDescription>
              Active connections grouped by channel type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {Object.entries(stats.activeByChannel).map(([channel, count]) => (
                <div
                  key={channel}
                  className='flex items-center justify-between'
                >
                  <div>
                    <div className='font-medium'>{channel}</div>
                    <div className='text-sm text-muted-foreground'>
                      Sample IDs:{' '}
                      {stats.sampleConnIds[channel]?.join(', ') || 'None'}
                    </div>
                  </div>
                  <Badge variant='outline'>{count} active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leak Test Widget */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Leak Test</CardTitle>
          <CardDescription>
            Test if connections are properly cleaned up after disconnection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-4'>
              <Button
                onClick={runLeakTest}
                disabled={loading}
                variant={leakTestRunning ? 'destructive' : 'default'}
              >
                {leakTestRunning ? (
                  <>
                    <StopCircle className='w-4 h-4 mr-2' />
                    Stop Test
                  </>
                ) : (
                  <>
                    <PlayCircle className='w-4 h-4 mr-2' />
                    Run Leak Test
                  </>
                )}
              </Button>

              {leakTestStatus !== 'idle' && (
                <div className='flex items-center gap-2'>
                  {leakTestStatus === 'testing' && (
                    <Badge className='bg-blue-100 text-blue-800'>
                      <RefreshCw className='w-3 h-3 mr-1 animate-spin' />
                      Testing...
                    </Badge>
                  )}
                  {leakTestStatus === 'passed' && (
                    <Badge className='bg-green-100 text-green-800'>
                      <CheckCircle className='w-3 h-3 mr-1' />
                      Passed
                    </Badge>
                  )}
                  {leakTestStatus === 'failed' && (
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
              <li>Record baseline connection count</li>
              <li>Open test EventSource connection to prices stream</li>
              <li>Verify connection count increased</li>
              <li>Close connection and wait for cleanup</li>
              <li>Verify connection count returned to baseline</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className='mt-8 text-center text-sm text-muted-foreground'>
        {stats && (
          <p>Last updated: {new Date(stats.timestamp).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
};

export default SSEOpsPage;
