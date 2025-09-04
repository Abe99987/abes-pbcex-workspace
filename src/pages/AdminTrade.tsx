import Layout from '@/components/Layout';
import AdminTradeInterface from '@/components/trading/AdminTradeInterface';
import HedgingBots from '@/components/trading/HedgingBots';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Bot } from 'lucide-react';

const AdminTrade = () => {
  return (
    <Layout
      showAdminBanner
      adminBannerType='info'
      adminBannerContent='Admin Terminal - Trading Interface'
    >
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Admin Trading Terminal</h1>
          <p className='text-muted-foreground'>
            Professional trading interface with advanced order types and hedging
            bots
          </p>
        </div>

        <Tabs defaultValue='trading' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='trading' className='flex items-center'>
              <TrendingUp className='h-4 w-4 mr-2' />
              Trading
            </TabsTrigger>
            <TabsTrigger value='bots' className='flex items-center'>
              <Bot className='h-4 w-4 mr-2' />
              Hedging Bots
            </TabsTrigger>
          </TabsList>

          <TabsContent value='trading' className='mt-6'>
            <AdminTradeInterface />
          </TabsContent>

          <TabsContent value='bots' className='mt-6'>
            <HedgingBots />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminTrade;
