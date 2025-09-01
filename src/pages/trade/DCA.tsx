import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calculator, DollarSign, Calendar, Clock, Info, BarChart3 } from 'lucide-react';
import Navigation from '@/components/Navigation';

const DCA = () => {
  // DCA Plan state
  const [selectedAsset, setSelectedAsset] = useState('');
  const [amountPerBuy, setAmountPerBuy] = useState('');
  const [frequency, setFrequency] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endType, setEndType] = useState('never');
  const [endDate, setEndDate] = useState('');
  const [occurrences, setOccurrences] = useState('');
  const [fundingAccount, setFundingAccount] = useState('');

  // Calculator state
  const [calcAsset, setCalcAsset] = useState('');
  const [calcContribution, setCalcContribution] = useState('');
  const [calcFrequency, setCalcFrequency] = useState('');
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');
  const [backtestResults, setBacktestResults] = useState<any>(null);

  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', mockPrice: '$45,230' },
    { symbol: 'ETH', name: 'Ethereum', mockPrice: '$2,650' },
    { symbol: 'USDC', name: 'USD Coin', mockPrice: '$1.00' },
    { symbol: 'XAU', name: 'Gold (XAU)', mockPrice: '$2,025/oz' },
    { symbol: 'PAXG', name: 'Pax Gold', mockPrice: '$2,021' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const fundingAccounts = [
    { id: 'checking', name: 'Checking Account' },
    { id: 'savings', name: 'Savings Account' },
    { id: 'trading', name: 'Trading Account' },
  ];

  const isPlanValid = selectedAsset && amountPerBuy && parseFloat(amountPerBuy) > 0 && 
                    frequency && timeOfDay && startDate && fundingAccount;

  const isCalcValid = calcAsset && calcContribution && parseFloat(calcContribution) > 0 && 
                     calcFrequency && calcStartDate && calcEndDate;

  const handleCreatePlan = () => {
    if (!isPlanValid) return;
    console.log('Create DCA Plan:', {
      selectedAsset, amountPerBuy, frequency, timeOfDay, 
      startDate, endType, endDate, occurrences, fundingAccount
    });
  };

  const handleBacktest = () => {
    if (!isCalcValid) return;
    
    // Mock backtest calculation
    const mockResults = {
      totalInvested: parseFloat(calcContribution) * 52, // Mock weekly for a year
      unitsAcquired: 1.234,
      avgCost: '$42,150',
      currentValue: '$55,824',
      profit: '$13,674',
      profitPercent: 24.5
    };
    
    setBacktestResults(mockResults);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dollar-Cost Average Strategies</h1>
            <p className="text-muted-foreground">Automate asset purchases with scheduled buying</p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create DCA Plan</TabsTrigger>
              <TabsTrigger value="calculator">DCA Calculator</TabsTrigger>
            </TabsList>

            {/* Create DCA Plan */}
            <TabsContent value="create" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Create DCA Plan</span>
                      </CardTitle>
                      <CardDescription>
                        Set up automated asset purchases on a schedule
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="asset">Asset *</Label>
                          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                            <SelectTrigger id="asset" aria-label="Select asset">
                              <SelectValue placeholder="Choose asset to buy" />
                            </SelectTrigger>
                            <SelectContent>
                              {assets.map((asset) => (
                                <SelectItem key={asset.symbol} value={asset.symbol}>
                                  {asset.symbol} - {asset.name} ({asset.mockPrice})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount per Buy *</Label>
                          <div className="relative">
                            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="10.00"
                              value={amountPerBuy}
                              onChange={(e) => setAmountPerBuy(e.target.value)}
                              className="pl-10"
                              aria-label="Amount per purchase"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="frequency">Frequency *</Label>
                          <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger id="frequency" aria-label="Select frequency">
                              <SelectValue placeholder="How often?" />
                            </SelectTrigger>
                            <SelectContent>
                              {frequencies.map((freq) => (
                                <SelectItem key={freq.value} value={freq.value}>
                                  {freq.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="time">Time of Day *</Label>
                          <Input
                            id="time"
                            type="time"
                            value={timeOfDay}
                            onChange={(e) => setTimeOfDay(e.target.value)}
                            aria-label="Time of day for purchases"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date *</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          aria-label="Start date"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>End Condition</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="never"
                              name="end"
                              value="never"
                              checked={endType === 'never'}
                              onChange={(e) => setEndType(e.target.value)}
                            />
                            <Label htmlFor="never">Never (run indefinitely)</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="date"
                              name="end"
                              value="date"
                              checked={endType === 'date'}
                              onChange={(e) => setEndType(e.target.value)}
                            />
                            <Label htmlFor="date" className="mr-2">On date:</Label>
                            <Input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              disabled={endType !== 'date'}
                              className="w-auto"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="occurrences"
                              name="end"
                              value="occurrences"
                              checked={endType === 'occurrences'}
                              onChange={(e) => setEndType(e.target.value)}
                            />
                            <Label htmlFor="occurrences" className="mr-2">After</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="12"
                              value={occurrences}
                              onChange={(e) => setOccurrences(e.target.value)}
                              disabled={endType !== 'occurrences'}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">occurrences</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="funding">Funding Account *</Label>
                        <Select value={fundingAccount} onValueChange={setFundingAccount}>
                          <SelectTrigger id="funding" aria-label="Select funding account">
                            <SelectValue placeholder="Choose funding source" />
                          </SelectTrigger>
                          <SelectContent>
                            {fundingAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleCreatePlan}
                        disabled={!isPlanValid}
                        className="w-full"
                        size="lg"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Create DCA Plan
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Plan Summary */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Asset</span>
                        <span className="font-medium">{selectedAsset || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">${amountPerBuy || '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Frequency</span>
                        <span className="font-medium">{frequency || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">{timeOfDay || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Start Date</span>
                        <span className="font-medium">{startDate || 'Not set'}</span>
                      </div>

                      <Alert>
                        <Info className="w-4 h-4" />
                        <AlertDescription className="text-sm">
                          DCA helps reduce the impact of volatility by spreading purchases over time.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* DCA Calculator */}
            <TabsContent value="calculator" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5" />
                      <span>DCA Backtest Calculator</span>
                    </CardTitle>
                    <CardDescription>
                      See how your DCA strategy would have performed historically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="calc-asset">Asset</Label>
                        <Select value={calcAsset} onValueChange={setCalcAsset}>
                          <SelectTrigger id="calc-asset" aria-label="Select asset for calculation">
                            <SelectValue placeholder="Choose asset" />
                          </SelectTrigger>
                          <SelectContent>
                            {assets.map((asset) => (
                              <SelectItem key={asset.symbol} value={asset.symbol}>
                                {asset.symbol} - {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="calc-contribution">Contribution ($)</Label>
                        <Input
                          id="calc-contribution"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="100.00"
                          value={calcContribution}
                          onChange={(e) => setCalcContribution(e.target.value)}
                          aria-label="Contribution amount"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="calc-frequency">Frequency</Label>
                      <Select value={calcFrequency} onValueChange={setCalcFrequency}>
                        <SelectTrigger id="calc-frequency" aria-label="Select calculation frequency">
                          <SelectValue placeholder="How often?" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="calc-start">Start Date</Label>
                        <Input
                          id="calc-start"
                          type="date"
                          value={calcStartDate}
                          onChange={(e) => setCalcStartDate(e.target.value)}
                          aria-label="Calculation start date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="calc-end">End Date</Label>
                        <Input
                          id="calc-end"
                          type="date"
                          value={calcEndDate}
                          onChange={(e) => setCalcEndDate(e.target.value)}
                          aria-label="Calculation end date"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleBacktest}
                      disabled={!isCalcValid}
                      className="w-full"
                      size="lg"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Calculate Returns
                    </Button>
                  </CardContent>
                </Card>

                {/* Results */}
                <Card>
                  <CardHeader>
                    <CardTitle>Backtest Results</CardTitle>
                    <CardDescription>
                      Historical performance simulation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {backtestResults ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Invested</div>
                            <div className="text-2xl font-bold">${backtestResults.totalInvested.toLocaleString()}</div>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Current Value</div>
                            <div className="text-2xl font-bold text-green-600">${backtestResults.currentValue}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Units Acquired</div>
                            <div className="text-lg font-semibold">{backtestResults.unitsAcquired}</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Avg Cost</div>
                            <div className="text-lg font-semibold">{backtestResults.avgCost}</div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm text-green-600">Total Profit</div>
                          <div className="text-xl font-bold text-green-700">
                            {backtestResults.profit} ({backtestResults.profitPercent}%)
                          </div>
                        </div>

                        {/* Mock sparkline */}
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground mb-2">Value Over Time</div>
                          <div className="h-16 bg-gradient-to-r from-blue-200 to-green-200 rounded flex items-end justify-between px-2">
                            {Array.from({ length: 20 }, (_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-blue-500 rounded-t"
                                style={{ height: `${Math.random() * 100}%` }}
                              />
                            ))}
                          </div>
                        </div>

                        <Alert>
                          <Info className="w-4 h-4" />
                          <AlertDescription className="text-sm">
                            For illustration only. Past performance does not guarantee future results.
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Calculation Yet</h3>
                        <p className="text-muted-foreground">
                          Fill out the form and click "Calculate Returns" to see backtest results
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DCA;