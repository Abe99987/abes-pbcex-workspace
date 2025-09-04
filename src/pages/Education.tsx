import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Play,
  Lock,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Wallet,
  Activity,
  Target,
  Shield,
  Calculator,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Education = () => {
  const courses = [
    {
      id: 1,
      title: 'So You Want to Start Trading?',
      subtitle: 'What is value, how is it established, and what is overvalued.',
      description:
        "Complete beginner's guide to getting started with trading and investments",
      icon: TrendingUp,
      duration: '17 min',
      difficulty: 'Beginner',
    },
    {
      id: 2,
      title: 'How to Use an Exchange',
      subtitle: 'Learn deposits, order types, and spot vs. leverage.',
      description:
        'Navigate trading platforms and understand different order mechanisms',
      icon: DollarSign,
      duration: '9 min',
      difficulty: 'Beginner',
    },
    {
      id: 3,
      title: 'Intro to TradingView',
      subtitle: 'How to use TradingView and read exchange charts.',
      description:
        'Master the most popular charting platform used by professionals',
      icon: Activity,
      duration: '12 min',
      difficulty: 'Intermediate',
    },
    {
      id: 4,
      title: 'Market Structure & Candles',
      subtitle: 'Learn wicks, trends, BOS/CHoCH, and ranges.',
      description:
        'Technical analysis fundamentals and price action interpretation',
      icon: BarChart3,
      duration: '23 min',
      difficulty: 'Intermediate',
    },
    {
      id: 5,
      title: 'Indicators & Fibs',
      subtitle: 'Build your chart with Fibs, RSI, MACD, and more.',
      description: 'Advanced technical indicators and Fibonacci analysis tools',
      icon: Target,
      duration: '27 min',
      difficulty: 'Intermediate',
    },
    {
      id: 6,
      title: 'Risk Management',
      subtitle: 'Stop loss, risk/reward, and laddered entries.',
      description:
        'Essential risk management strategies for successful trading',
      icon: Shield,
      duration: '12 min',
      difficulty: 'Intermediate',
    },
    {
      id: 7,
      title: 'Trading Checklist',
      subtitle: 'Follow rules, probabilities, and test your trades.',
      description: 'Systematic approach to trade evaluation and execution',
      icon: BookOpen,
      duration: '22 min',
      difficulty: 'Advanced',
    },
    {
      id: 8,
      title: 'Portfolio Management',
      subtitle: 'Structure your risk, balance, and profit-taking.',
      description:
        'Advanced portfolio construction and profit optimization strategies',
      icon: PieChart,
      duration: '14 min',
      difficulty: 'Advanced',
    },
    {
      id: 9,
      title: 'Pay Your Taxes',
      subtitle: 'Export reports and stay compliant.',
      description: 'Tax reporting requirements and compliance for traders',
      icon: Calculator,
      duration: '3 min',
      difficulty: 'Beginner',
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      {/* Hero Section */}
      <section className='relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-b'>
        <div className='container mx-auto px-4 py-20'>
          <div className='max-w-4xl mx-auto text-center'>
            <Badge variant='secondary' className='mb-6'>
              <BookOpen className='w-4 h-4 mr-2' />
              Educational Content
            </Badge>
            <h1 className='text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent mb-6'>
              PBCEX Classes
            </h1>
            <p className='text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed'>
              Learn how to buy, store, and trade real-world assets and cryptos —
              with confidence.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center text-muted-foreground'>
              <div className='flex items-center'>
                <Play className='w-5 h-5 mr-2' />
                <span>9 comprehensive courses</span>
              </div>
              <div className='flex items-center'>
                <Target className='w-5 h-5 mr-2' />
                <span>Beginner to Advanced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid Section */}
      <section className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl md:text-4xl font-bold mb-4'>
                Trading & Investment Curriculum
              </h2>
              <p className='text-xl text-muted-foreground'>
                From complete beginner to advanced trading strategies
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {courses.map(course => (
                <Card
                  key={course.id}
                  className='group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 relative overflow-hidden'
                >
                  <CardHeader className='pb-4'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                        <course.icon className='w-6 h-6 text-primary' />
                      </div>
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className='text-lg leading-tight'>
                      {course.title}
                    </CardTitle>
                    {course.subtitle && (
                      <CardDescription className='text-sm font-medium text-primary'>
                        {course.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <p className='text-sm text-muted-foreground mb-6'>
                      {course.description}
                    </p>

                    <div className='flex items-center justify-between mb-4'>
                      <span className='text-sm text-muted-foreground flex items-center'>
                        <Activity className='w-4 h-4 mr-1' />
                        {course.duration}
                      </span>
                      <Badge variant='outline' className='text-xs'>
                        Coming Soon
                      </Badge>
                    </div>

                    <Button
                      variant='outline'
                      className='w-full group-hover:bg-primary/5 transition-colors'
                      disabled
                    >
                      <Lock className='w-4 h-4 mr-2' />
                      Course Locked
                    </Button>
                  </CardContent>

                  {/* Course Number Overlay */}
                  <div className='absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                    <span className='text-sm font-bold text-primary'>
                      {course.id}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <div className='text-center mt-16'>
              <Card className='max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20'>
                <CardHeader>
                  <CardTitle className='text-2xl'>
                    Get Notified When Courses Launch
                  </CardTitle>
                  <CardDescription className='text-base'>
                    Be the first to access our comprehensive trading education
                    program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size='lg' className='w-full sm:w-auto'>
                    Join Waitlist
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Education;
