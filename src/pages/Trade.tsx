import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp } from 'lucide-react';

const Trade = () => {
  const { pair } = useParams();
  const navigate = useNavigate();

  const formatPair = (pairParam: string) => {
    return pairParam?.replace('-', '/') || 'Unknown';
  };

  return (
    <Layout>
      <Helmet>
        <title>Trade {formatPair(pair || '')} - PBCEx</title>
        <meta
          name='description'
          content={`Trade ${formatPair(pair || '')} with advanced charting tools and real-time market data.`}
        />
      </Helmet>

      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-8'>
          {/* Header */}
          <div className='flex items-center gap-4 mb-8'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/markets')}
              className='gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to Markets
            </Button>
            <div>
              <h1 className='text-3xl md:text-4xl font-bold text-foreground'>
                Trade {formatPair(pair || '')}
              </h1>
              <p className='text-muted-foreground'>
                Advanced trading interface coming soon
              </p>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='w-5 h-5 text-gold' />
                  Chart & Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 bg-muted/20 rounded-lg flex items-center justify-center'>
                  <p className='text-muted-foreground'>
                    Advanced charting interface coming soon
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle>Order Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 bg-muted/20 rounded-lg flex items-center justify-center'>
                  <p className='text-muted-foreground'>
                    Trading interface under development
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='mt-8 text-center'>
            <Card className='bg-card/30 border-border/50 p-6'>
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Trading Platform Coming Soon
              </h3>
              <p className='text-muted-foreground mb-4'>
                Our advanced trading platform with real-time charts, order books, and portfolio management is currently under development.
              </p>
              <Button
                variant='gold'
                onClick={() => navigate('/markets')}
                className='gap-2'
              >
                View All Markets
                <TrendingUp className='w-4 h-4' />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Trade;