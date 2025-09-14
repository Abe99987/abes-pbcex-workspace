import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Target,
  Shield,
  DollarSign,
  TrendingUp,
  Calculator,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface TutorialCard {
  title: string;
  description: string;
  icon: React.ElementType;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  topics: string[];
}

const tutorials: TutorialCard[] = [
  {
    title: 'Paper Trading',
    description: 'Learn to trade with virtual money. Practice strategies without risk and build confidence before using real funds.',
    icon: TrendingUp,
    difficulty: 'Beginner',
    estimatedTime: '15 min',
    topics: ['Virtual portfolio', 'Risk-free practice', 'Strategy testing', 'Performance tracking']
  },
  {
    title: 'Order Types',
    description: 'Master different order types including market, limit, stop-loss, and scale orders to execute your trading strategy effectively.',
    icon: Target,
    difficulty: 'Beginner',
    estimatedTime: '20 min',
    topics: ['Market orders', 'Limit orders', 'Stop-loss', 'Scale orders', 'Order execution']
  },
  {
    title: 'Risk Controls',
    description: 'Understand position sizing, diversification, and risk management tools to protect your capital and maximize returns.',
    icon: Shield,
    difficulty: 'Intermediate',
    estimatedTime: '25 min',
    topics: ['Position sizing', 'Stop-loss strategy', 'Portfolio diversification', 'Risk-reward ratios']
  },
  {
    title: 'Fees & Settlement',
    description: 'Learn about trading fees, settlement processes, and how to optimize your costs across different asset classes.',
    icon: Calculator,
    difficulty: 'Intermediate',
    estimatedTime: '18 min',
    topics: ['Trading fees', 'Settlement timing', 'Cross-asset costs', 'Fee optimization']
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-500/10 text-green-400 border-green-500/30';
    case 'Intermediate':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'Advanced':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
};

const Tutorials = () => {
  return (
    <Layout>
      <Helmet>
        <title>Trading Tutorials - PBCEx | Learn Trading Essentials</title>
        <meta
          name='description'
          content='Master trading with our comprehensive tutorials. Learn paper trading, order types, risk controls, and fee optimization for successful trading.'
        />
      </Helmet>

      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-8'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
                <BookOpen className='w-6 h-6 text-primary' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-foreground'>Trading Tutorials</h1>
                <p className='text-muted-foreground'>Master the essentials of trading with our step-by-step guides</p>
              </div>
            </div>
          </div>

          {/* Tutorial Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {tutorials.map((tutorial, index) => {
              const Icon = tutorial.icon;
              
              return (
                <Card key={index} className='bg-card/50 border-border/50 hover:bg-card/70 transition-colors'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='p-3 rounded-lg bg-primary/10 border border-primary/20'>
                        <Icon className='w-6 h-6 text-primary' />
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge className={getDifficultyColor(tutorial.difficulty)}>
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className='space-y-2'>
                      <CardTitle className='text-xl text-foreground'>{tutorial.title}</CardTitle>
                      <p className='text-muted-foreground text-sm leading-relaxed'>
                        {tutorial.description}
                      </p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className='pt-0'>
                    {/* Time Estimate */}
                    <div className='flex items-center gap-2 mb-4 text-sm text-muted-foreground'>
                      <Clock className='w-4 h-4' />
                      <span>Estimated time: {tutorial.estimatedTime}</span>
                    </div>

                    {/* Topics */}
                    <div className='mb-6'>
                      <div className='text-sm font-medium text-foreground mb-2'>What you'll learn:</div>
                      <div className='flex flex-wrap gap-1'>
                        {tutorial.topics.map((topic, topicIndex) => (
                          <Badge key={topicIndex} variant='secondary' className='text-xs bg-muted/50 text-muted-foreground'>
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className='w-full bg-primary hover:bg-primary/90 text-primary-foreground'
                      disabled
                    >
                      Read Tutorial
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Resources */}
          <Card className='mt-8 bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-foreground'>
                <AlertTriangle className='w-5 h-5 text-yellow-500' />
                Need More Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <h4 className='font-medium text-foreground mb-2'>Video Lessons</h4>
                  <p className='text-sm text-muted-foreground mb-2'>
                    Watch comprehensive video courses covering advanced trading strategies and market analysis.
                  </p>
                  <Button variant='outline' size='sm'>
                    Browse Video Library
                  </Button>
                </div>
                <div>
                  <h4 className='font-medium text-foreground mb-2'>Live Support</h4>
                  <p className='text-sm text-muted-foreground mb-2'>
                    Get personalized help from our trading experts through live chat or scheduled consultations.
                  </p>
                  <Button variant='outline' size='sm'>
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Tutorials;