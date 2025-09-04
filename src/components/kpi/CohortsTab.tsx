import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Info,
  X,
} from 'lucide-react';

const CohortsTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'layers' | 'decay'>('layers');
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([
    '2024-01',
    '2024-02',
  ]);
  const [showChurnExplainer, setShowChurnExplainer] = useState(false);

  // Handle URL state persistence
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'layers' || viewParam === 'decay') {
      setView(viewParam);
    }
  }, [searchParams]);

  const handleViewChange = (newView: 'layers' | 'decay') => {
    setView(newView);
    setSearchParams({ view: newView });
  };

  // Mock cohort data
  const cohortData = {
    '2024-01': {
      name: 'January 2024',
      totalUsers: 1250,
      layers: [
        { period: 'Month 0', users: 1250, percentage: 100 },
        { period: 'Month 1', users: 980, percentage: 78.4 },
        { period: 'Month 2', users: 850, percentage: 68.0 },
        { period: 'Month 3', users: 720, percentage: 57.6 },
        { period: 'Month 4', users: 650, percentage: 52.0 },
        { period: 'Month 5', users: 580, percentage: 46.4 },
      ],
      decay: [
        { period: 'Month 0', retention: 100, churn: 0 },
        { period: 'Month 1', retention: 78.4, churn: 21.6 },
        { period: 'Month 2', retention: 68.0, churn: 32.0 },
        { period: 'Month 3', retention: 57.6, churn: 42.4 },
        { period: 'Month 4', retention: 52.0, churn: 48.0 },
        { period: 'Month 5', retention: 46.4, churn: 53.6 },
      ],
    },
    '2024-02': {
      name: 'February 2024',
      totalUsers: 1100,
      layers: [
        { period: 'Month 0', users: 1100, percentage: 100 },
        { period: 'Month 1', users: 920, percentage: 83.6 },
        { period: 'Month 2', users: 810, percentage: 73.6 },
        { period: 'Month 3', users: 720, percentage: 65.5 },
        { period: 'Month 4', users: 650, percentage: 59.1 },
        { period: 'Month 5', users: 580, percentage: 52.7 },
      ],
      decay: [
        { period: 'Month 0', retention: 100, churn: 0 },
        { period: 'Month 1', retention: 83.6, churn: 16.4 },
        { period: 'Month 2', retention: 73.6, churn: 26.4 },
        { period: 'Month 3', retention: 65.5, churn: 34.5 },
        { period: 'Month 4', retention: 59.1, churn: 40.9 },
        { period: 'Month 5', retention: 52.7, churn: 47.3 },
      ],
    },
    '2024-03': {
      name: 'March 2024',
      totalUsers: 1350,
      layers: [
        { period: 'Month 0', users: 1350, percentage: 100 },
        { period: 'Month 1', users: 1080, percentage: 80.0 },
        { period: 'Month 2', users: 945, percentage: 70.0 },
        { period: 'Month 3', users: 810, percentage: 60.0 },
        { period: 'Month 4', users: 675, percentage: 50.0 },
        { period: 'Month 5', users: 540, percentage: 40.0 },
      ],
      decay: [
        { period: 'Month 0', retention: 100, churn: 0 },
        { period: 'Month 1', retention: 80.0, churn: 20.0 },
        { period: 'Month 2', retention: 70.0, churn: 30.0 },
        { period: 'Month 3', retention: 60.0, churn: 40.0 },
        { period: 'Month 4', retention: 50.0, churn: 50.0 },
        { period: 'Month 5', retention: 40.0, churn: 60.0 },
      ],
    },
  };

  const availableCohorts = Object.keys(cohortData);

  const handleCohortToggle = (cohortId: string) => {
    setSelectedCohorts(prev =>
      prev.includes(cohortId)
        ? prev.filter(id => id !== cohortId)
        : prev.length < 3
          ? [...prev, cohortId]
          : prev
    );
  };

  const handleCSVExport = () => {
    const csvData = [
      ['Cohort', 'Period', 'Users', 'Percentage', 'Retention', 'Churn'],
      ...selectedCohorts.flatMap(cohortId => {
        const cohort = cohortData[cohortId as keyof typeof cohortData];
        return cohort.layers.map((layer, index) => [
          cohort.name,
          layer.period,
          layer.users.toString(),
          `${layer.percentage}%`,
          `${cohort.decay[index].retention}%`,
          `${cohort.decay[index].churn}%`,
        ]);
      }),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohorts-analysis-${view}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getColorForCohort = (cohortId: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    const index = selectedCohorts.indexOf(cohortId);
    return index >= 0 ? colors[index] : 'bg-gray-500';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Cohorts</h2>
          <p className='text-muted-foreground'>
            Customer cohort analysis and retention
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' size='sm' onClick={handleCSVExport}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Inspect
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={handleViewChange}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='layers'>Growth Stack Layers</TabsTrigger>
          <TabsTrigger value='decay'>Retention Slices (Decay)</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Cohort Selection */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Users className='h-5 w-5 mr-2' />
            Compare Cohorts (Max 3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {availableCohorts.map(cohortId => {
              const cohort = cohortData[cohortId as keyof typeof cohortData];
              const isSelected = selectedCohorts.includes(cohortId);
              return (
                <Button
                  key={cohortId}
                  variant={isSelected ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handleCohortToggle(cohortId)}
                  disabled={!isSelected && selectedCohorts.length >= 3}
                >
                  {cohort.name}
                  <Badge variant='secondary' className='ml-2'>
                    {cohort.totalUsers.toLocaleString()}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cohort Analysis */}
      {selectedCohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>
                {view === 'layers'
                  ? 'Growth Stack Layers'
                  : 'Retention Slices (Decay)'}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowChurnExplainer(true)}
              >
                <Info className='h-4 w-4 mr-2' />
                Churn Explainer
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {selectedCohorts.map(cohortId => {
                const cohort = cohortData[cohortId as keyof typeof cohortData];
                const data = view === 'layers' ? cohort.layers : cohort.decay;
                const colorClass = getColorForCohort(cohortId);

                return (
                  <div key={cohortId} className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <div className={`w-4 h-4 rounded ${colorClass}`}></div>
                      <h3 className='font-semibold'>{cohort.name}</h3>
                      <Badge variant='outline'>
                        {cohort.totalUsers.toLocaleString()} users
                      </Badge>
                    </div>

                    <div className='grid grid-cols-6 gap-2'>
                      {data.map((item, index) => (
                        <div key={index} className='text-center'>
                          <div className='text-xs text-muted-foreground mb-1'>
                            {item.period}
                          </div>
                          <div className='text-sm font-medium'>
                            {view === 'layers'
                              ? item.users.toLocaleString()
                              : `${item.retention}%`}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {view === 'layers'
                              ? `${item.percentage}%`
                              : `${item.churn}% churn`}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Visual bars */}
                    <div className='flex space-x-1 h-4'>
                      {data.map((item, index) => (
                        <div
                          key={index}
                          className={`${colorClass} rounded-sm transition-all duration-300`}
                          style={{
                            width: `${(item.percentage || item.retention) / 10}%`,
                            opacity: 0.7 + index * 0.05,
                          }}
                          title={`${item.period}: ${view === 'layers' ? item.users : item.retention}%`}
                        ></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Churn Explainer Modal */}
      {showChurnExplainer && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <Card className='w-full max-w-2xl mx-4'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Churn Explainer</CardTitle>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowChurnExplainer(false)}
              >
                <X className='h-4 w-4' />
              </Button>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='font-semibold mb-2'>Growth Stack Layers</h4>
                <p className='text-sm text-muted-foreground'>
                  Shows the absolute number of users remaining in each period.
                  Each layer represents users who are still active, creating a
                  "stack" effect that shows cohort health over time.
                </p>
              </div>
              <div>
                <h4 className='font-semibold mb-2'>Retention Slices (Decay)</h4>
                <p className='text-sm text-muted-foreground'>
                  Shows the percentage of users retained and the corresponding
                  churn rate. Helps identify when users typically drop off and
                  the overall retention curve.
                </p>
              </div>
              <div>
                <h4 className='font-semibold mb-2'>Key Metrics</h4>
                <ul className='text-sm text-muted-foreground space-y-1'>
                  <li>
                    • <strong>Retention:</strong> Percentage of original cohort
                    still active
                  </li>
                  <li>
                    • <strong>Churn:</strong> Percentage of original cohort that
                    has left
                  </li>
                  <li>
                    • <strong>LTV Impact:</strong> Higher retention = higher
                    lifetime value
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CohortsTab;
