import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BookOpen,
  User,
  Wallet,
  TrendingUp,
  PieChart,
  Package,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
}

interface Tutorial {
  title: string;
  description: string;
  icon: React.ElementType;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  steps: TutorialStep[];
}

const tutorials: Tutorial[] = [
  {
    title: 'Sign Up & Account Access',
    description: 'Get started with PBCEx by creating your account and completing KYC verification.',
    icon: User,
    difficulty: 'Beginner',
    estimatedTime: '10 min',
    steps: [
      {
        title: 'Create Your Account',
        content: 'Visit PBCEx and click "Sign Up". Enter your email address and create a secure password with at least 8 characters, including uppercase, lowercase, and numbers.'
      },
      {
        title: 'Verify Your Email',
        content: 'Check your email inbox for a verification link from PBCEx. Click the link to verify your email address and activate your account.'
      },
      {
        title: 'Complete KYC Verification',
        content: 'Upload a government-issued ID and proof of address. Take a clear selfie for identity verification. This process typically takes 24-48 hours for approval.'
      },
      {
        title: 'Set Up Security',
        content: 'Enable two-factor authentication (2FA) using Google Authenticator or SMS. Create security questions and set up account recovery options.'
      },
      {
        title: 'Access Your Dashboard',
        content: 'Once verified, log in to access your PBCEx dashboard. Explore your account overview, balances, and available features.'
      }
    ]
  },
  {
    title: 'Deposit & Withdraw',
    description: 'Learn how to fund your account and withdraw assets securely.',
    icon: Wallet,
    difficulty: 'Beginner',
    estimatedTime: '15 min',
    steps: [
      {
        title: 'Choose Deposit Method',
        content: 'Navigate to "Deposit" in your dashboard. Select from bank transfer, credit/debit card, or cryptocurrency deposit options.'
      },
      {
        title: 'Bank Transfer Setup',
        content: 'For bank transfers, add your bank account details securely. Note the provided reference number for your transfer to ensure proper crediting.'
      },
      {
        title: 'Cryptocurrency Deposits',
        content: 'For crypto deposits, select your desired cryptocurrency and copy the provided deposit address. Always verify the address before sending.'
      },
      {
        title: 'Withdrawal Process',
        content: 'To withdraw, go to "Withdraw" and select your preferred method. Enter the amount and destination details. Confirm with 2FA.'
      },
      {
        title: 'Transaction Monitoring',
        content: 'Track all deposits and withdrawals in your transaction history. Deposits typically process within 1-3 business days, withdrawals within 24 hours.'
      }
    ]
  },
  {
    title: 'Place a Trade (Spot, Coin-to-Coin, Scale)',
    description: 'Master different trading methods including spot trading, coin-to-coin swaps, and scale orders.',
    icon: TrendingUp,
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
    steps: [
      {
        title: 'Navigate to Trading',
        content: 'Access the "Trade" menu and choose between Spot (USDC), Coin-to-Coin, or set up DCA. Each method serves different trading strategies.'
      },
      {
        title: 'Spot Trading Basics',
        content: 'In Spot trading, select your trading pair (e.g., BTC/USDC). Choose between Market orders (instant execution) or Limit orders (specific price).'
      },
      {
        title: 'Coin-to-Coin Trading',
        content: 'For direct crypto swaps, select your source and target cryptocurrencies. Choose what asset to settle in using the "Settle in" dropdown.'
      },
      {
        title: 'Scale Orders',
        content: 'Scale orders let you buy/sell at multiple price levels. Set your price range, number of orders, and total amount to spread across the range.'
      },
      {
        title: 'Order Management',
        content: 'Monitor your open orders in the "Orders" tab. Cancel or modify orders as needed. Check your trading history and performance metrics.'
      }
    ]
  },
  {
    title: 'My Spending (categorize, budgets, auto-invest)',
    description: 'Set up spending analysis, create budgets, and automate your investments.',
    icon: PieChart,
    difficulty: 'Intermediate',
    estimatedTime: '18 min',
    steps: [
      {
        title: 'Access Spending Dashboard',
        content: 'Navigate to "My Account" → "My Spending" to view your spending analysis dashboard with charts and categorization.'
      },
      {
        title: 'Categorize Transactions',
        content: 'Review your transactions and add tags for better categorization. Click the "+" button in the Tags column to add custom tags.'
      },
      {
        title: 'Set Savings Goals',
        content: 'Use the Savings Rate gauge to set monthly savings targets. Choose from 15%, 25%, 30%, or set a custom percentage goal.'
      },
      {
        title: 'Auto-Invest Setup',
        content: 'In the "Auto-invest your savings" section, set up recurring investments. Choose amount, frequency (daily/monthly), and target asset.'
      },
      {
        title: 'Monitor Performance',
        content: 'Track your spending trends and savings rate over time. Adjust your auto-invest rules and budgets based on your financial goals.'
      }
    ]
  },
  {
    title: 'Buy Physical Metals (Shop & order flow)',
    description: 'Purchase physical gold, silver, platinum, palladium, and copper with secure delivery.',
    icon: Package,
    difficulty: 'Beginner',
    estimatedTime: '12 min',
    steps: [
      {
        title: 'Browse Metal Options',
        content: 'Visit the "Shop" section to explore physical metals. Compare prices for gold, silver, platinum, palladium, and copper products.'
      },
      {
        title: 'Select Your Metal',
        content: 'Choose your preferred metal and product type (coins, bars, rounds). Review live pricing, minimum order quantities, and product specifications.'
      },
      {
        title: 'Place Your Order',
        content: 'Enter your desired quantity and review the total cost including shipping and insurance. Confirm your shipping address and contact details.'
      },
      {
        title: 'Payment & Confirmation',
        content: 'Complete payment using your PBCEx balance or linked payment method. Receive order confirmation with tracking information.'
      },
      {
        title: 'Delivery & Storage',
        content: 'Track your shipment through insured delivery services. Upon delivery, verify your products and consider secure storage options.'
      }
    ]
  },
  {
    title: 'Security & 2FA',
    description: 'Secure your account with two-factor authentication and advanced security features.',
    icon: Shield,
    difficulty: 'Beginner',
    estimatedTime: '8 min',
    steps: [
      {
        title: 'Enable 2FA',
        content: 'Go to "Security" settings and enable two-factor authentication. Download Google Authenticator or Authy app on your mobile device.'
      },
      {
        title: 'Set Up Authenticator',
        content: 'Scan the QR code with your authenticator app or enter the provided secret key manually. Save your backup codes in a secure location.'
      },
      {
        title: 'Test 2FA Setup',
        content: 'Verify your 2FA setup by entering a code from your authenticator app. This ensures everything is working correctly before you need it.'
      },
      {
        title: 'Additional Security',
        content: 'Set up security questions, enable login notifications, and review your active sessions regularly. Consider using a hardware security key for additional protection.'
      },
      {
        title: 'Security Best Practices',
        content: 'Use a unique, strong password, keep your recovery codes safe, never share your 2FA codes, and log out of public devices after use.'
      }
    ]
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

const MarketsTutorials = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTutorial = () => {
    setSelectedTutorial(null);
    setCurrentStep(0);
  };

  return (
    <Layout>
      <Helmet>
        <title>Tutorials - PBCEx | Step-by-Step Trading Guides</title>
        <meta
          name='description'
          content='Learn trading essentials with our interactive tutorials. Master account setup, deposits, trading, spending analysis, physical metals, and security.'
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
                <h1 className='text-3xl font-bold text-foreground'>Tutorials</h1>
                <p className='text-muted-foreground'>Click-through guides to get started</p>
              </div>
            </div>
          </div>

          {/* Tutorial Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {tutorials.map((tutorial, index) => {
              const Icon = tutorial.icon;
              
              return (
                <Card key={index} className='bg-card/50 border-border/50 hover:bg-card/70 transition-colors'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='p-3 rounded-lg bg-primary/10 border border-primary/20'>
                        <Icon className='w-6 h-6 text-primary' />
                      </div>
                      <Badge className={getDifficultyColor(tutorial.difficulty)}>
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                    
                    <div className='space-y-2'>
                      <CardTitle className='text-lg text-foreground'>{tutorial.title}</CardTitle>
                      <p className='text-muted-foreground text-sm leading-relaxed'>
                        {tutorial.description}
                      </p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className='pt-0'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='text-sm text-muted-foreground'>
                        {tutorial.estimatedTime} • {tutorial.steps.length} steps
                      </div>
                    </div>

                    <Button 
                      className='w-full bg-primary hover:bg-primary/90 text-primary-foreground'
                      onClick={() => setSelectedTutorial(tutorial)}
                    >
                      Start Tutorial
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tutorial Dialog */}
      <Dialog open={!!selectedTutorial} onOpenChange={() => closeTutorial()}>
        <DialogContent className='max-w-2xl bg-card border-border'>
          {selectedTutorial && (
            <>
              <DialogHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
                    <selectedTutorial.icon className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <DialogTitle className='text-xl font-semibold text-foreground'>
                      {selectedTutorial.title}
                    </DialogTitle>
                    <div className='text-sm text-muted-foreground'>
                      Step {currentStep + 1} of {selectedTutorial.steps.length}
                    </div>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={closeTutorial}
                  className='h-8 w-8 p-0'
                >
                  <X className='h-4 w-4' />
                </Button>
              </DialogHeader>

              <div className='space-y-6'>
                {/* Progress Bar */}
                <div className='w-full bg-muted rounded-full h-2'>
                  <div 
                    className='bg-primary h-2 rounded-full transition-all duration-300'
                    style={{ width: `${((currentStep + 1) / selectedTutorial.steps.length) * 100}%` }}
                  />
                </div>

                {/* Step Content */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-foreground'>
                    {selectedTutorial.steps[currentStep].title}
                  </h3>
                  <p className='text-muted-foreground leading-relaxed'>
                    {selectedTutorial.steps[currentStep].content}
                  </p>
                </div>

                {/* Navigation */}
                <div className='flex items-center justify-between pt-4'>
                  <Button
                    variant='outline'
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className='flex items-center gap-2'
                  >
                    <ChevronLeft className='w-4 h-4' />
                    Previous
                  </Button>

                  {currentStep < selectedTutorial.steps.length - 1 ? (
                    <Button
                      onClick={nextStep}
                      className='flex items-center gap-2 bg-primary hover:bg-primary/90'
                    >
                      Next
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  ) : (
                    <Button
                      onClick={closeTutorial}
                      className='bg-green-600 hover:bg-green-700 text-white'
                    >
                      Complete Tutorial
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MarketsTutorials;