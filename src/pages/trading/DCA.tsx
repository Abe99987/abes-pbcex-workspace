import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Calendar,
  Calculator,
  Clock,
  DollarSign,
  Settings,
  TrendingUp,
  X,
  BarChart3,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { dcaStore, DCARule } from '@/lib/dcaStore';

const DCA = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'calculator' ? 'calculator' : 'setup';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Set up DCA form state
  const [cadence, setCadence] = useState<'Day' | 'Month'>('Month');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('Gold');
  const [sourceAccount, setSourceAccount] = useState<'Funding' | 'Trading'>('Funding');
  const [startDate, setStartDate] = useState('');
  const [priceGuard, setPriceGuard] = useState([5]);
  const [notes, setNotes] = useState('');

  // Calculator form state
  const [calcCadence, setCalcCadence] = useState<'Day' | 'Month'>('Month');
  const [calcAmount, setCalcAmount] = useState('');
  const [calcAsset, setCalcAsset] = useState('Gold');
  const [calcStartDate, setCalcStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [calcEndDate, setCalcEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [calcExecutionTime, setCalcExecutionTime] = useState('9:00 AM');

  // Rules state
  const [rules, setRules] = useState<DCARule[]>([]);
  const [projectionResults, setProjectionResults] = useState<any>(null);

  const assets = [
    { value: 'Gold', label: 'Gold', price: '$2,025/oz' },
    { value: 'Silver', label: 'Silver', price: '$24.50/oz' },
    { value: 'BTC', label: 'Bitcoin', price: '$45,230' },
    { value: 'ETH', label: 'Ethereum', price: '$2,650' },
    { value: 'Platinum', label: 'Platinum', price: '$980/oz' },
    { value: 'Palladium', label: 'Palladium', price: '$1,150/oz' },
  ];

  const executionTimeOptions = [
    { value: '9:00 AM', label: '9:00 AM' },
    { value: '10:00 AM', label: '10:00 AM' },
    { value: '12:00 PM', label: '12:00 PM' },
  ];

  // Load rules on mount
  useEffect(() => {
    setRules(dcaStore.getRules());
    const unsubscribe = dcaStore.subscribe(() => {
      setRules(dcaStore.getRules());
    });
    return unsubscribe;
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (activeTab === 'calculator') {
      newSearchParams.set('tab', 'calculator');
    } else {
      newSearchParams.delete('tab');
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams}`);
  }, [activeTab, searchParams]);

  const getNextExecutionDate = () => {
    const date = new Date();
    if (cadence === 'Day') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setMonth(date.getMonth() + 1, 1);
    }
    return date.toISOString().split('T')[0];
  };

  const handleSaveDCARule = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    dcaStore.addRule({
      amount: parseFloat(amount),
      cadence,
      asset,
      sourceAccount,
      createdAt: new Date(),
    });

    // Reset form
    setAmount('');
    setNotes('');
    // Keep other fields for convenience
  };

  const handleDeleteRule = (id: string) => {
    dcaStore.deleteRule(id);
  };

  const handlePreviewInCalculator = () => {
    setCalcCadence(cadence);
    setCalcAmount(amount);
    setCalcAsset(asset);
    setActiveTab('calculator');
  };

  const handleUseInSetup = () => {
    setCadence(calcCadence);
    setAmount(calcAmount);
    setAsset(calcAsset);
    setActiveTab('setup');
  };

  const validateDateRange = () => {
    const start = new Date(calcStartDate);
    const end = new Date(calcEndDate);
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    return end >= start && start >= fiveYearsAgo;
  };

  const calculateContributions = () => {
    const start = new Date(calcStartDate);
    const end = new Date(calcEndDate);
    
    if (calcCadence === 'Day') {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1; // inclusive
    } else {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return Math.max(1, months + 1); // inclusive
    }
  };

  const handleCalculateReturns = () => {
    if (!calcAmount || parseFloat(calcAmount) <= 0 || !validateDateRange()) return;

    try {
      const contributions = calculateContributions();
      const totalInvested = parseFloat(calcAmount) * contributions;
      
      // Mock projection calculation
      const mockResults = {
        totalInvested,
        estimatedUnits: totalInvested / 2000, // Mock price calc
        avgPrice: `$2,000`,
        projectedValue: totalInvested, // No market model, just invested amount
        contributions,
        horizon: `${contributions} ${calcCadence === 'Day' ? 'days' : 'months'}`,
        startDate: calcStartDate,
        endDate: calcEndDate,
      };

      setProjectionResults(mockResults);
    } catch (error) {
      console.error('Calculation error:', error);
      setProjectionResults(null);
    }
  };

  const isSetupValid = amount && parseFloat(amount) > 0;
  const isCalcValid = calcAmount && parseFloat(calcAmount) > 0 && validateDateRange();

  return (
    <Layout>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              DCA (Dollar-Cost Averaging)
            </h1>
            <p className='text-muted-foreground'>
              Automate recurring purchases
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='setup'>Set up DCA</TabsTrigger>
              <TabsTrigger value='calculator'>Calculator</TabsTrigger>
            </TabsList>

            {/* Set up DCA Tab */}
            <TabsContent value='setup' className='space-y-6 mt-6'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                <div className='lg:col-span-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Create DCA Rule</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      {/* Cadence Pills */}
                      <div className='space-y-2'>
                        <Label>Cadence</Label>
                        <div className='flex gap-2'>
                          {(['Day', 'Month'] as const).map((freq) => (
                            <Button
                              key={freq}
                              variant={cadence === freq ? 'default' : 'outline'}
                              size='sm'
                              onClick={() => setCadence(freq)}
                            >
                              {freq}
                            </Button>
                          ))}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          Executes at beginning of selected period.
                        </p>
                      </div>

                      {/* Amount USD */}
                      <div className='space-y-2'>
                        <Label htmlFor='amount'>Amount (USD)</Label>
                        <div className='relative'>
                          <DollarSign className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                          <Input
                            id='amount'
                            type='number'
                            step='0.01'
                            min='0'
                            placeholder='100.00'
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className='pl-10'
                          />
                        </div>
                      </div>

                      {/* Choose Asset */}
                      <div className='space-y-2'>
                        <Label>Choose asset</Label>
                        <Select value={asset} onValueChange={setAsset}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assets.map((a) => (
                              <SelectItem key={a.value} value={a.value}>
                                {a.label} ({a.price})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* From Account */}
                      <div className='space-y-2'>
                        <Label>From account</Label>
                        <Select value={sourceAccount} onValueChange={(value) => setSourceAccount(value as 'Funding' | 'Trading')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Funding'>Funding</SelectItem>
                            <SelectItem value='Trading'>Trading</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Optional Fields */}
                      <div className='space-y-4 border-t pt-4'>
                        <h4 className='font-medium text-sm text-muted-foreground'>Optional</h4>
                        
                        {/* Start Date */}
                        <div className='space-y-2'>
                          <Label htmlFor='start-date'>Start date</Label>
                          <Input
                            id='start-date'
                            type='date'
                            value={startDate || getNextExecutionDate()}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>

                        {/* Price Guard */}
                        <div className='space-y-2'>
                          <Label>Price guard (±%)</Label>
                          <div className='px-3'>
                            <Slider
                              value={priceGuard}
                              onValueChange={setPriceGuard}
                              max={20}
                              min={0}
                              step={1}
                              className='w-full'
                            />
                            <div className='text-xs text-muted-foreground mt-1'>
                              ±{priceGuard[0]}% from current price
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className='space-y-2'>
                          <Label htmlFor='notes'>Notes (optional)</Label>
                          <Textarea
                            id='notes'
                            placeholder='Add any notes about this DCA rule...'
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='flex gap-3'>
                        <Button
                          onClick={handleSaveDCARule}
                          disabled={!isSetupValid}
                          className='flex-1'
                        >
                          Save DCA rule
                        </Button>
                        <Button
                          variant='outline'
                          onClick={handlePreviewInCalculator}
                          disabled={!isSetupValid}
                        >
                          Preview in Calculator
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rules Panel */}
                <div className='lg:col-span-1'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Rules</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {rules.length === 0 ? (
                        <p className='text-sm text-muted-foreground text-center py-4'>
                          No active DCA rules yet
                        </p>
                      ) : (
                        rules.map((rule) => (
                          <div
                            key={rule.id}
                            className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
                          >
                            <div className='space-y-1'>
                              <div className='text-sm font-medium'>
                                ${rule.amount} / {rule.cadence} → {rule.asset}
                              </div>
                              <Badge variant='secondary' className='text-xs'>
                                From: {rule.sourceAccount}
                              </Badge>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteRule(rule.id)}
                              className='h-6 w-6 p-0'
                            >
                              <X className='w-3 h-3' />
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Calculator Tab */}
            <TabsContent value='calculator' className='space-y-6 mt-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Calculator className='w-5 h-5' />
                      DCA Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {/* Cadence */}
                    <div className='space-y-2'>
                      <Label>Cadence</Label>
                      <div className='flex gap-2'>
                        {(['Day', 'Month'] as const).map((freq) => (
                          <Button
                            key={freq}
                            variant={calcCadence === freq ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setCalcCadence(freq)}
                          >
                            {freq}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className='space-y-2'>
                      <Label htmlFor='calc-amount'>Amount (USD)</Label>
                      <div className='relative'>
                        <DollarSign className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                        <Input
                          id='calc-amount'
                          type='number'
                          step='0.01'
                          min='0'
                          placeholder='100.00'
                          value={calcAmount}
                          onChange={(e) => setCalcAmount(e.target.value)}
                          className='pl-10'
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className='space-y-2'>
                      <Label>Date Range</Label>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div>
                          <Label htmlFor='start-date' className='text-xs text-muted-foreground'>Start date</Label>
                          <Input
                            id='start-date'
                            type='date'
                            value={calcStartDate}
                            onChange={(e) => setCalcStartDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor='end-date' className='text-xs text-muted-foreground'>End date</Label>
                          <Input
                            id='end-date'
                            type='date'
                            value={calcEndDate}
                            onChange={(e) => setCalcEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                      {!validateDateRange() && (
                        <p className='text-xs text-destructive'>
                          End date must be after start date. Maximum lookback: 5 years.
                        </p>
                      )}
                    </div>

                    {/* Execution Time */}
                    <div className='space-y-2'>
                      <Label htmlFor='execution-time'>Execution time</Label>
                      <div className='space-y-1'>
                        <Select value={calcExecutionTime} onValueChange={setCalcExecutionTime}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='9:00 AM'>9:00 AM</SelectItem>
                            <SelectItem value='10:00 AM'>10:00 AM</SelectItem>
                            <SelectItem value='12:00 PM'>12:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className='text-xs text-muted-foreground'>
                          {calcCadence === 'Day' 
                            ? 'Buys execute at the start of the selected period.' 
                            : 'Executes at beginning of month.'
                          }
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          All times local to your device.
                        </p>
                      </div>
                    </div>

                    <div className='flex gap-3'>
                      <Button
                        onClick={handleCalculateReturns}
                        disabled={!isCalcValid}
                        className='flex-1'
                      >
                        Calculate Returns
                      </Button>
                      <Button
                        variant='outline'
                        onClick={handleUseInSetup}
                        disabled={!isCalcValid}
                      >
                        Use these values in Set up DCA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Projection Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <BarChart3 className='w-5 h-5' />
                      Projection Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {projectionResults ? (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='text-center p-3 bg-muted/50 rounded-lg'>
                            <div className='text-sm text-muted-foreground'>Invested</div>
                            <div className='text-lg font-semibold'>
                              ${projectionResults.totalInvested?.toLocaleString() || '0'}
                            </div>
                          </div>
                          <div className='text-center p-3 bg-muted/50 rounded-lg'>
                            <div className='text-sm text-muted-foreground'>Est. units</div>
                            <div className='text-lg font-semibold'>
                              {projectionResults.estimatedUnits?.toFixed(3) || '0'}
                            </div>
                          </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='text-center p-3 bg-muted/50 rounded-lg'>
                            <div className='text-sm text-muted-foreground'>Contributions</div>
                            <div className='text-lg font-semibold'>
                              {projectionResults.contributions || '0'}
                            </div>
                          </div>
                          <div className='text-center p-3 bg-muted/50 rounded-lg'>
                            <div className='text-sm text-muted-foreground'>Avg. price</div>
                            <div className='text-lg font-semibold'>
                              {projectionResults.avgPrice || '$0'}
                            </div>
                          </div>
                        </div>
                        <div className='text-center p-4 bg-primary/10 rounded-lg'>
                          <div className='text-sm text-muted-foreground mb-1'>Projected Value</div>
                          <div className='text-2xl font-bold text-primary'>
                            ${projectionResults.projectedValue?.toLocaleString() || '0'}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            Over {projectionResults.horizon || 'selected period'}
                          </div>
                        </div>
                        <div className='h-20 bg-muted/30 rounded-lg flex items-center justify-center'>
                          <div className='text-xs text-muted-foreground'>
                            [{projectionResults.contributions || '0'} contributions visualization]
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-8 text-muted-foreground'>
                        Enter values and calculate to see projections
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default DCA;
