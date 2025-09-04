import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Navigation from '@/components/Navigation';
import { Clock, Package, TrendingUp, Users } from 'lucide-react';

// Mock data
const mockPosts = [
  {
    id: 1,
    provider: 'MetalTech Industries',
    commodity: 'Silver',
    targetQty: '100 tons',
    minContrib: '≥ 1 ton, increments of 0.5 ton',
    acceptedAssets: ['PAXG', 'XAG-s', 'USD', 'USDC'],
    basePrice: 'Spot + 2.5%',
    volumeDiscount: 'Up to 8% for large orders',
    cutoffTime: '2024-01-15 16:00 UTC',
    directFill: true,
    freightTerms: 'FOB Houston',
    committed: 67.5,
    target: 100,
    participants: 12,
    status: 'Active',
  },
  {
    id: 2,
    provider: 'Global Copper Co.',
    commodity: 'Copper',
    targetQty: '250 tons',
    minContrib: '≥ 5 tons, increments of 1 ton',
    acceptedAssets: ['XCU-s', 'USD', 'USDC'],
    basePrice: 'Spot + 1.8%',
    volumeDiscount: 'Up to 5% for large orders',
    cutoffTime: '2024-01-20 12:00 UTC',
    directFill: false,
    freightTerms: 'CIF Shanghai',
    committed: 125,
    target: 250,
    participants: 8,
    status: 'Active',
  },
];

const LargeLimit = () => {
  const [animatedProgress, setAnimatedProgress] = useState<{
    [key: number]: number;
  }>({});

  useEffect(() => {
    // Animate progress bars
    const timer = setTimeout(() => {
      const newProgress: { [key: number]: number } = {};
      mockPosts.forEach(post => {
        newProgress[post.id] = (post.committed / post.target) * 100;
      });
      setAnimatedProgress(newProgress);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <div className='max-w-6xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Large-Limit Offers
          </h1>
          <p className='text-muted-foreground'>
            Join wholesale commodity offers with volume discounts. Groupon-style
            purchasing for metals and materials.
          </p>
        </div>

        {/* Demo Banner */}
        <div className='mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
          <div className='flex items-center gap-2 text-blue-700 dark:text-blue-300'>
            <Package className='h-5 w-5' />
            <span className='font-medium'>Preview Mode</span>
          </div>
          <p className='text-sm text-blue-600 dark:text-blue-400 mt-1'>
            This is a preview of the Large-Limit marketplace. Backend
            integration required for full functionality.
          </p>
        </div>

        <div className='grid gap-6'>
          {mockPosts.map(post => (
            <Card key={post.id} className='overflow-hidden'>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      {post.commodity} - {post.targetQty}
                      <Badge
                        variant={
                          post.status === 'Active' ? 'default' : 'secondary'
                        }
                      >
                        {post.status}
                      </Badge>
                      {post.directFill && (
                        <Badge variant='outline' className='text-green-600'>
                          Direct Fill
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>by {post.provider}</CardDescription>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Clock className='h-4 w-4' />
                    <span>Ends {post.cutoffTime}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                  <div>
                    <Label className='text-xs font-medium text-muted-foreground'>
                      MIN CONTRIBUTION
                    </Label>
                    <p className='text-sm font-medium'>{post.minContrib}</p>
                  </div>

                  <div>
                    <Label className='text-xs font-medium text-muted-foreground'>
                      BASE PRICE
                    </Label>
                    <p className='text-sm font-medium'>{post.basePrice}</p>
                  </div>

                  <div>
                    <Label className='text-xs font-medium text-muted-foreground'>
                      VOLUME DISCOUNT
                    </Label>
                    <p className='text-sm font-medium text-green-600'>
                      {post.volumeDiscount}
                    </p>
                  </div>

                  <div>
                    <Label className='text-xs font-medium text-muted-foreground'>
                      FREIGHT TERMS
                    </Label>
                    <p className='text-sm font-medium'>{post.freightTerms}</p>
                  </div>
                </div>

                {/* Provider Accepts */}
                <div className='mb-4'>
                  <Label className='text-xs font-medium text-muted-foreground'>
                    PROVIDER ACCEPTS:
                  </Label>
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {post.acceptedAssets.map(asset => (
                      <Badge
                        key={asset}
                        variant='secondary'
                        className='text-xs'
                      >
                        {asset}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className='mb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <Label className='text-xs font-medium text-muted-foreground'>
                      COMMITTED / TARGET
                    </Label>
                    <div className='flex items-center gap-4 text-sm'>
                      <div className='flex items-center gap-1'>
                        <Users className='h-3 w-3' />
                        <span>{post.participants} participants</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <TrendingUp className='h-3 w-3' />
                        <span>
                          {post.committed} / {post.target} tons
                        </span>
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={animatedProgress[post.id] || 0}
                    className='h-2'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    {((post.committed / post.target) * 100).toFixed(1)}% funded
                  </p>
                </div>

                {/* Join Button */}
                <div className='flex items-center justify-between'>
                  <p className='text-xs text-muted-foreground'>
                    Allocations may be pro-rated. Final discount tier is based
                    on total committed at cutoff.
                  </p>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            disabled
                            className='opacity-50 cursor-not-allowed'
                          >
                            Join This Offer
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Backend required. This is a preview.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {mockPosts.length === 0 && (
          <Card className='text-center py-12'>
            <CardContent>
              <Package className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                No Large-Limit Offers
              </h3>
              <p className='text-muted-foreground'>
                There are currently no active large-limit offers. Check back
                later or contact providers directly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer Note */}
        <div className='mt-8 p-4 bg-muted/30 rounded-lg'>
          <p className='text-xs text-muted-foreground text-center'>
            Fulfilled by JM Bullion / Dillon Gage. Insured & tracked.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper component for labels
const Label = ({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={className} {...props}>
    {children}
  </label>
);

export default LargeLimit;
