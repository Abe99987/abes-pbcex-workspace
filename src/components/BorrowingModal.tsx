import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Coins,
  Lock,
  Unlock,
  AlertTriangle,
  TrendingUp,
  Calculator,
  Shield,
  Clock,
  DollarSign,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BorrowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    name: string;
    price: string;
    symbol: string;
    icon: string;
  };
}

interface LoanData {
  id: string;
  collateralAmount: number;
  borrowedAmount: number;
  ltvRatio: number;
  apr: number;
  loanType: string;
  startDate: Date;
  totalOwed: number;
  status: 'active' | 'warning' | 'liquidation';
}

const BorrowingModal = ({ isOpen, onClose, asset }: BorrowingModalProps) => {
  const [currentView, setCurrentView] = useState<
    'setup' | 'confirmation' | 'dashboard'
  >('setup');
  const [ltvRatio, setLtvRatio] = useState([25]);
  const [loanType, setLoanType] = useState('monthly');
  const [repayAmount, setRepayAmount] = useState('');
  const [activeLoan, setActiveLoan] = useState<LoanData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  // Mock user gold balance
  const totalGoldBalance = 15.75; // grams
  const availableGoldBalance = activeLoan
    ? totalGoldBalance - activeLoan.collateralAmount
    : totalGoldBalance;
  const lockedGoldBalance = activeLoan ? activeLoan.collateralAmount : 0;

  // Real-time gold price per gram
  const goldPricePerGram = 75.5;

  // Calculate loan values
  const maxLtvPercent = 50;
  const currentLtvPercent = ltvRatio[0];
  const collateralAmount =
    ((currentLtvPercent / 100) * maxLtvPercent * availableGoldBalance) / 50; // Adjusted calculation
  const maxLoanAmount =
    availableGoldBalance * goldPricePerGram * (maxLtvPercent / 100);
  const loanAmount =
    collateralAmount * goldPricePerGram * (currentLtvPercent / 100) * 2;

  // APR calculation based on loan type and LTV
  const calculateAPR = () => {
    if (loanType === 'islamic') return 0; // No interest for Islamic mode
    const baseAPR = 9;
    const ltvPremium = (currentLtvPercent / 100) * 3; // Higher LTV = higher rate
    return Math.min(baseAPR + ltvPremium, 12);
  };

  const currentAPR = calculateAPR();

  // Load existing loan on open
  useEffect(() => {
    if (isOpen) {
      // Mock existing loan data
      const mockLoan = {
        id: 'loan-001',
        collateralAmount: 5.25,
        borrowedAmount: 325.5,
        ltvRatio: 35,
        apr: 10.5,
        loanType: 'monthly',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        totalOwed: 340.75,
        status: 'active' as const,
      };

      // Check if user has existing loan (mock condition)
      const hasExistingLoan = Math.random() > 0.5; // 50% chance for demo
      if (hasExistingLoan) {
        setActiveLoan(mockLoan);
        setCurrentView('dashboard');
      } else {
        setActiveLoan(null);
        setCurrentView('setup');
      }
    }
  }, [isOpen]);

  const handleConfirmLoan = async () => {
    setIsConfirming(true);

    // Simulate loan processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newLoan: LoanData = {
      id: `loan-${Date.now()}`,
      collateralAmount: collateralAmount,
      borrowedAmount: loanAmount,
      ltvRatio: currentLtvPercent,
      apr: currentAPR,
      loanType: loanType,
      startDate: new Date(),
      totalOwed: loanAmount * (1 + currentAPR / 100 / 12), // Monthly interest
      status: 'active',
    };

    setActiveLoan(newLoan);
    setCurrentView('dashboard');

    toast({
      title: 'Loan Approved!',
      description: `$${loanAmount.toFixed(2)} has been deposited to your wallet. ${collateralAmount.toFixed(3)}g gold is now locked as collateral.`,
    });

    setIsConfirming(false);
  };

  const handleRepayment = async () => {
    if (!activeLoan || !repayAmount) return;

    setIsConfirming(true);

    // Simulate repayment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const repayValue = parseFloat(repayAmount);
    const remainingOwed = Math.max(0, activeLoan.totalOwed - repayValue);
    const paidOffPercentage = repayValue / activeLoan.totalOwed;
    const goldToUnlock = activeLoan.collateralAmount * paidOffPercentage;

    if (remainingOwed === 0) {
      // Loan fully paid off
      setActiveLoan(null);
      setCurrentView('setup');
      toast({
        title: 'Loan Paid Off!',
        description: `${activeLoan.collateralAmount.toFixed(3)}g of gold has been unlocked and returned to your wallet.`,
      });
    } else {
      // Partial repayment
      const updatedLoan = {
        ...activeLoan,
        totalOwed: remainingOwed,
        collateralAmount: activeLoan.collateralAmount - goldToUnlock,
        ltvRatio:
          (remainingOwed /
            ((activeLoan.collateralAmount - goldToUnlock) * goldPricePerGram)) *
          100,
      };
      setActiveLoan(updatedLoan);
      toast({
        title: 'Payment Processed!',
        description: `${goldToUnlock.toFixed(3)}g of gold unlocked. Remaining balance: $${remainingOwed.toFixed(2)}`,
      });
    }

    setRepayAmount('');
    setIsConfirming(false);
  };

  const loanTypes = [
    {
      id: 'monthly',
      name: 'Monthly Profit Sharing',
      description: 'Fixed monthly payments with profit sharing',
      icon: '📅',
    },
    {
      id: 'balloon',
      name: 'Pay at End',
      description: 'Single payment at loan maturity',
      icon: '🎈',
    },
    {
      id: 'islamic',
      name: 'Islamic/Halal Mode',
      description: 'Sharia-compliant financing with no Riba',
      icon: '☪️',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span className='text-2xl'>{asset.icon}</span>
            Finance With Gold
            <Badge variant='secondary' className='ml-auto'>
              Asset-Based Financing
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={currentView}
          onValueChange={(value: string) =>
            setCurrentView(value as 'setup' | 'confirmation' | 'dashboard')
          }
        >
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='setup' disabled={!!activeLoan}>
              Setup
            </TabsTrigger>
            <TabsTrigger
              value='confirmation'
              disabled={!activeLoan && currentView !== 'confirmation'}
            >
              Confirm
            </TabsTrigger>
            <TabsTrigger value='dashboard' disabled={!activeLoan}>
              Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Loan Setup */}
          <TabsContent value='setup' className='space-y-6'>
            {/* Balance Display */}
            <Card className='bg-gradient-to-r from-gold/10 to-gold-light/10 border-gold/20'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-sm text-muted-foreground'>
                    Available Gold Balance
                  </span>
                  <div className='text-right'>
                    <div className='font-bold text-lg'>
                      {availableGoldBalance.toFixed(3)}g
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      ${(availableGoldBalance * goldPricePerGram).toFixed(2)}{' '}
                      value
                    </div>
                  </div>
                </div>
                {lockedGoldBalance > 0 && (
                  <div className='flex items-center gap-2 text-sm text-amber-600'>
                    <Lock className='w-4 h-4' />
                    {lockedGoldBalance.toFixed(3)}g locked as collateral
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LTV Slider */}
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label>Loan-to-Value Ratio</Label>
                <Badge variant='outline'>{currentLtvPercent}% LTV</Badge>
              </div>
              <Slider
                value={ltvRatio}
                onValueChange={setLtvRatio}
                max={maxLtvPercent}
                min={5}
                step={5}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>Conservative (5%)</span>
                <span>Maximum (50%)</span>
              </div>
            </div>

            {/* Loan Calculation Display */}
            <Card className='bg-muted/30'>
              <CardContent className='p-4 space-y-3'>
                <div className='flex justify-between text-sm'>
                  <span>Collateral Amount:</span>
                  <span className='font-medium'>
                    {collateralAmount.toFixed(3)}g gold
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Loan Amount:</span>
                  <span className='font-medium text-primary'>
                    ${loanAmount.toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Current Gold Price:</span>
                  <span>${goldPricePerGram.toFixed(2)}/gram</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Calculated APR:</span>
                  <span
                    className={`font-medium ${loanType === 'islamic' ? 'text-green-600' : ''}`}
                  >
                    {loanType === 'islamic'
                      ? '0% (No Riba)'
                      : `${currentAPR.toFixed(1)}%`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Loan Type Selection */}
            <div className='space-y-3'>
              <Label>Select Financing Type</Label>
              <RadioGroup value={loanType} onValueChange={setLoanType}>
                {loanTypes.map(type => (
                  <div
                    key={type.id}
                    className='flex items-center space-x-3 p-4 border rounded-lg'
                  >
                    <RadioGroupItem value={type.id} id={type.id} />
                    <div className='text-2xl'>{type.icon}</div>
                    <div className='flex-1'>
                      <Label htmlFor={type.id} className='font-medium'>
                        {type.name}
                      </Label>
                      <div className='text-sm text-muted-foreground'>
                        {type.description}
                      </div>
                    </div>
                    {type.id === 'islamic' && (
                      <Badge variant='secondary' className='text-xs'>
                        Halal
                      </Badge>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Key Benefits */}
            <Card className='border-l-4 border-l-primary'>
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  <Shield className='w-5 h-5 text-primary mt-0.5' />
                  <div className='text-sm'>
                    <strong>Asset-Based Financing Benefits:</strong>
                    <br />
                    • No credit checks required
                    <br />
                    • Instant cash using your own assets
                    <br />
                    • Your gold remains yours - just temporarily locked
                    <br />• Repay anytime to unlock your collateral
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setCurrentView('confirmation')}
              disabled={
                !collateralAmount ||
                collateralAmount <= 0 ||
                collateralAmount > availableGoldBalance
              }
              className='w-full'
              size='lg'
            >
              Continue to Confirmation
            </Button>
          </TabsContent>

          {/* Confirmation */}
          <TabsContent value='confirmation' className='space-y-6'>
            <Card className='bg-primary/5 border-primary/20'>
              <CardContent className='p-6'>
                <div className='text-center mb-4'>
                  <Calculator className='w-12 h-12 mx-auto mb-3 text-primary' />
                  <h3 className='font-bold text-lg'>Loan Summary</h3>
                </div>

                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span>Gold Collateral:</span>
                    <span className='font-medium'>
                      {collateralAmount.toFixed(3)}g
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Loan Amount:</span>
                    <span className='font-medium text-primary'>
                      ${loanAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>LTV Ratio:</span>
                    <span>{currentLtvPercent}%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Financing Type:</span>
                    <span>{loanTypes.find(t => t.id === loanType)?.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>APR:</span>
                    <span
                      className={loanType === 'islamic' ? 'text-green-600' : ''}
                    >
                      {loanType === 'islamic'
                        ? '0% (No Riba)'
                        : `${currentAPR.toFixed(1)}%`}
                    </span>
                  </div>
                  <Separator />
                  <div className='flex justify-between font-medium'>
                    <span>You will receive:</span>
                    <span className='text-primary'>
                      ${loanAmount.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-l-4 border-l-amber-500'>
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5' />
                  <div className='text-sm'>
                    <strong>Important Notice:</strong>
                    <br />
                    By confirming this loan, {collateralAmount.toFixed(3)}g of
                    your gold will be locked as collateral. This gold cannot be
                    traded or withdrawn until the loan is repaid.
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => setCurrentView('setup')}
                className='flex-1'
              >
                Back to Setup
              </Button>
              <Button
                onClick={handleConfirmLoan}
                disabled={isConfirming}
                className='flex-1'
                size='lg'
              >
                {isConfirming ? 'Processing...' : 'Confirm Loan'}
              </Button>
            </div>
          </TabsContent>

          {/* Loan Dashboard */}
          <TabsContent value='dashboard' className='space-y-6'>
            {activeLoan && (
              <>
                {/* Loan Status Overview */}
                <Card
                  className={`${
                    activeLoan.status === 'warning'
                      ? 'border-amber-500 bg-amber-50'
                      : activeLoan.status === 'liquidation'
                        ? 'border-red-500 bg-red-50'
                        : 'border-green-500 bg-green-50'
                  }`}
                >
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <h3 className='font-bold'>
                          Active Loan #{activeLoan.id.slice(-3)}
                        </h3>
                        <div className='text-sm text-muted-foreground'>
                          Started {activeLoan.startDate.toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant={
                          activeLoan.status === 'warning'
                            ? 'destructive'
                            : activeLoan.status === 'liquidation'
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        {activeLoan.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-muted-foreground'>
                          Collateral Locked:
                        </span>
                        <div className='font-medium flex items-center gap-1'>
                          <Lock className='w-3 h-3' />
                          {activeLoan.collateralAmount.toFixed(3)}g gold
                        </div>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>
                          Amount Borrowed:
                        </span>
                        <div className='font-medium'>
                          ${activeLoan.borrowedAmount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>
                          Current LTV:
                        </span>
                        <div className='font-medium'>
                          {activeLoan.ltvRatio.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className='text-muted-foreground'>
                          Total Owed:
                        </span>
                        <div className='font-medium text-primary'>
                          ${activeLoan.totalOwed.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* LTV Progress Bar */}
                    <div className='mt-4'>
                      <div className='flex justify-between text-xs mb-1'>
                        <span>Current LTV</span>
                        <span>{activeLoan.ltvRatio.toFixed(1)}% / 50% max</span>
                      </div>
                      <Progress
                        value={activeLoan.ltvRatio}
                        max={50}
                        className={`h-2 ${activeLoan.ltvRatio > 45 ? 'text-red-500' : ''}`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Gold Balance Visualization */}
                <Card>
                  <CardContent className='p-4'>
                    <h4 className='font-medium mb-3'>Gold Balance Breakdown</h4>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between p-3 bg-green-50 rounded border border-green-200'>
                        <div className='flex items-center gap-2'>
                          <Unlock className='w-4 h-4 text-green-600' />
                          <span className='text-sm'>Available Gold</span>
                        </div>
                        <span className='font-medium'>
                          {availableGoldBalance.toFixed(3)}g
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 bg-amber-50 rounded border border-amber-200'>
                        <div className='flex items-center gap-2'>
                          <Lock className='w-4 h-4 text-amber-600' />
                          <span className='text-sm'>Locked as Collateral</span>
                        </div>
                        <span className='font-medium'>
                          {activeLoan.collateralAmount.toFixed(3)}g
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Repayment Section */}
                <Card>
                  <CardContent className='p-4'>
                    <h4 className='font-medium mb-3'>Make a Payment</h4>
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='repayAmount'>
                          Payment Amount (USD)
                        </Label>
                        <Input
                          id='repayAmount'
                          type='number'
                          placeholder='0.00'
                          value={repayAmount}
                          onChange={e => setRepayAmount(e.target.value)}
                          max={activeLoan.totalOwed}
                          step='0.01'
                        />
                        <div className='text-xs text-muted-foreground mt-1'>
                          Maximum: ${activeLoan.totalOwed.toFixed(2)}
                        </div>
                      </div>

                      {repayAmount && parseFloat(repayAmount) > 0 && (
                        <Card className='bg-muted/30'>
                          <CardContent className='p-3'>
                            <div className='text-sm space-y-1'>
                              <div className='flex justify-between'>
                                <span>Payment Amount:</span>
                                <span>
                                  ${parseFloat(repayAmount).toFixed(2)}
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span>Gold to Unlock:</span>
                                <span>
                                  {(
                                    activeLoan.collateralAmount *
                                    (parseFloat(repayAmount) /
                                      activeLoan.totalOwed)
                                  ).toFixed(3)}
                                  g
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span>Remaining Balance:</span>
                                <span>
                                  $
                                  {Math.max(
                                    0,
                                    activeLoan.totalOwed -
                                      parseFloat(repayAmount)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          onClick={() =>
                            setRepayAmount(
                              (activeLoan.totalOwed / 4).toFixed(2)
                            )
                          }
                          className='flex-1'
                          size='sm'
                        >
                          25%
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() =>
                            setRepayAmount(
                              (activeLoan.totalOwed / 2).toFixed(2)
                            )
                          }
                          className='flex-1'
                          size='sm'
                        >
                          50%
                        </Button>
                        <Button
                          variant='outline'
                          onClick={() =>
                            setRepayAmount(activeLoan.totalOwed.toFixed(2))
                          }
                          className='flex-1'
                          size='sm'
                        >
                          Pay Off
                        </Button>
                      </div>

                      <Button
                        onClick={handleRepayment}
                        disabled={
                          !repayAmount ||
                          parseFloat(repayAmount) <= 0 ||
                          parseFloat(repayAmount) > activeLoan.totalOwed ||
                          isConfirming
                        }
                        className='w-full'
                        size='lg'
                      >
                        {isConfirming
                          ? 'Processing Payment...'
                          : 'Make Payment'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Add Collateral Option */}
                {activeLoan.ltvRatio > 40 && (
                  <Card className='border-amber-500 bg-amber-50'>
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        <AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5' />
                        <div>
                          <div className='font-medium text-amber-800'>
                            High LTV Warning
                          </div>
                          <div className='text-sm text-amber-700 mb-3'>
                            Your loan-to-value ratio is approaching the maximum.
                            Consider adding more gold collateral or making a
                            payment.
                          </div>
                          <Button
                            size='sm'
                            variant='outline'
                            className='border-amber-600 text-amber-700 hover:bg-amber-100'
                          >
                            <Plus className='w-3 h-3 mr-1' />
                            Add Gold Collateral
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Helpful Tips */}
                <Card className='border-l-4 border-l-blue-500'>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Shield className='w-5 h-5 text-blue-500 mt-0.5 cursor-help' />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              This is not a bank loan — it's backed by your own
                              assets
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className='text-sm'>
                        <strong>Asset-Backed Financing:</strong>
                        <br />
                        • Your gold is safely stored and insured
                        <br />
                        • No impact on credit score
                        <br />
                        • Repay anytime to unlock your collateral
                        <br />• All transactions are blockchain-verified
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BorrowingModal;
