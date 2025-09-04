import { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  Target,
  Activity,
  Banknote,
  Building2,
  TrendingDown,
  Calculator,
  FileText,
} from 'lucide-react';

// Lazy-load tab components
const RevenueTab = lazy(() => import('@/components/kpi/RevenueTab'));
const VariableCostTab = lazy(() => import('@/components/kpi/VariableCostTab'));
const FixedCostTab = lazy(() => import('@/components/kpi/FixedCostTab'));
const HeadcountTab = lazy(() => import('@/components/kpi/HeadcountTab'));
const PnLTab = lazy(() => import('@/components/kpi/PnLTab'));
const UnitEconomicsTab = lazy(
  () => import('@/components/kpi/UnitEconomicsTab')
);
const CohortsTab = lazy(() => import('@/components/kpi/CohortsTab'));
const AcquisitionTab = lazy(() => import('@/components/kpi/AcquisitionTab'));
const EngagementTab = lazy(() => import('@/components/kpi/EngagementTab'));
const TradingTab = lazy(() => import('@/components/kpi/TradingTab'));
const OpsTab = lazy(() => import('@/components/kpi/OpsTab'));
const BankMetricsTab = lazy(() => import('@/components/kpi/BankMetricsTab'));
const CustomersTab = lazy(() => import('@/components/kpi/CustomersTab'));

const AdminKPI = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('revenue');

  // KPI tabs configuration
  const kpiTabs = [
    {
      id: 'revenue',
      label: 'Revenue',
      icon: DollarSign,
      component: RevenueTab,
    },
    {
      id: 'variable-cost',
      label: 'Variable Cost',
      icon: TrendingDown,
      component: VariableCostTab,
    },
    {
      id: 'fixed-cost',
      label: 'Fixed Cost',
      icon: Building2,
      component: FixedCostTab,
    },
    {
      id: 'headcount',
      label: 'Headcount & Labor',
      icon: Users,
      component: HeadcountTab,
    },
    { id: 'pnl', label: 'P&L', icon: BarChart3, component: PnLTab },
    {
      id: 'unit-economics',
      label: 'Unit Economics',
      icon: Calculator,
      component: UnitEconomicsTab,
    },
    { id: 'cohorts', label: 'Cohorts', icon: PieChart, component: CohortsTab },
    {
      id: 'acquisition',
      label: 'Acquisition',
      icon: Target,
      component: AcquisitionTab,
    },
    {
      id: 'engagement',
      label: 'Engagement',
      icon: Activity,
      component: EngagementTab,
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: TrendingUp,
      component: TradingTab,
    },
    { id: 'ops', label: 'Ops', icon: FileText, component: OpsTab },
    {
      id: 'bank-metrics',
      label: 'Bank Metrics',
      icon: Banknote,
      component: BankMetricsTab,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      component: CustomersTab,
    },
  ];

  // Handle URL state persistence
  useEffect(() => {
    const kpiParam = searchParams.get('kpi');
    if (kpiParam && kpiTabs.some(tab => tab.id === kpiParam)) {
      setActiveTab(kpiParam);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ kpi: value });
  };

  // Active tab is controlled by Tabs; content for inactive tabs is not rendered

  return (
    <Layout
      showAdminBanner
      adminBannerType='info'
      adminBannerContent='Admin Terminal - KPI Dashboard'
    >
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>KPI Dashboard</h1>
          <p className='text-muted-foreground'>
            Comprehensive business metrics and analytics
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-6 lg:grid-cols-13 h-auto p-1'>
            {kpiTabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className='flex flex-col items-center space-y-1 p-2 text-xs'
              >
                <tab.icon className='h-4 w-4' />
                <span className='hidden sm:inline'>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {kpiTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className='mt-6'>
              <Suspense
                fallback={<div className='h-24 rounded-md bg-muted/50' />}
              >
                <tab.component />
              </Suspense>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminKPI;
