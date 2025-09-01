import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Repeat, Plus, Edit, Trash2, Calendar, Clock, CheckCircle2, Pause } from 'lucide-react';
import Navigation from '@/components/Navigation';

const RecurringTransfers = () => {
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [failoverRule, setFailoverRule] = useState('skip');

  const accounts = [
    { id: 'funding', name: 'Funding Account', type: 'internal' },
    { id: 'trading', name: 'Trading Account', type: 'internal' },
    { id: 'savings', name: 'Savings Account', type: 'internal' },
  ];

  const beneficiaries = [
    { id: 'ben1', name: 'Alice Johnson', type: 'internal', email: 'alice@pbcex.com' },
    { id: 'ben2', name: 'John Smith', type: 'internal', email: 'john@pbcex.com' },
    { id: 'ben3', name: 'Bank of America', type: 'external', details: '****-1234' },
  ];

  const assets = [
    { symbol: 'USD', name: 'US Dollar' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'XAU', name: 'Gold (XAU)' },
    { symbol: 'PAXG', name: 'Pax Gold' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
  ];

  const mockRules = [
    {
      id: '1',
      name: 'Weekly Savings',
      fromAccount: 'Funding Account',
      toAccount: 'Savings Account',
      asset: 'USD',
      amount: '500.00',
      frequency: 'Weekly',
      nextRun: '2024-02-05',
      enabled: true,
      failoverRule: 'skip'
    },
    {
      id: '2',
      name: 'Monthly Gold Purchase',
      fromAccount: 'Funding Account',
      toAccount: 'Trading Account',
      asset: 'XAU',
      amount: '0.25',
      frequency: 'Monthly',
      nextRun: '2024-02-01',
      enabled: true,
      failoverRule: 'retry'
    },
    {
      id: '3',
      name: 'Alice Payment',
      fromAccount: 'Funding Account',
      toAccount: 'Alice Johnson',
      asset: 'USDC',
      amount: '1000.00',
      frequency: 'Monthly',
      nextRun: '2024-02-15',
      enabled: false,
      failoverRule: 'skip'
    }
  ];

  const isFormValid = fromAccount && toAccount && asset && amount &&
                     parseFloat(amount) > 0 && frequency && startDate;

  const handleCreateRule = () => {
    if (!isFormValid) return;
    
    // Stub: would make API call here
    console.log('Create recurring rule:', {
      fromAccount, toAccount, asset, amount, frequency,
      startDate, endDate, failoverRule
    });
    
    setCreateRuleOpen(false);
    // Reset form
    setFromAccount('');
    setToAccount('');
    setAsset('');
    setAmount('');
    setFrequency('');
    setStartDate('');
    setEndDate('');
    setFailoverRule('skip');
  };

  const toggleRule = (ruleId: string) => {
    // Stub: would make API call here
    console.log('Toggle rule:', ruleId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Recurring Transfers</h1>
            <p className="text-muted-foreground">Automate transfers on a schedule</p>
          </div>

          {/* Create New Rule Button */}
          <div className="mb-6">
            <Button onClick={() => setCreateRuleOpen(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Recurring Rule
            </Button>
          </div>

          {/* Existing Rules */}
          <div className="space-y-6">
            {mockRules.length > 0 ? (
              mockRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{rule.name}</h3>
                              <Badge
                                variant={rule.enabled ? 'default' : 'secondary'}
                                className={rule.enabled ? 'text-green-600' : ''}
                              >
                                {rule.enabled ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <Pause className="w-3 h-3 mr-1" />
                                    Paused
                                  </>
                                )}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">From:</span> {rule.fromAccount}
                              </div>
                              <div>
                                <span className="text-muted-foreground">To:</span> {rule.toAccount}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Amount:</span> {rule.amount} {rule.asset}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Frequency:</span> {rule.frequency}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Next Run:</span> {rule.nextRun}
                              </div>
                              <div>
                                <span className="text-muted-foreground">On Failure:</span> {rule.failoverRule}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <Button variant="ghost" size="sm" aria-label="Edit rule">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Delete rule">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Repeat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recurring Rules</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first recurring transfer rule to automate regular payments
                  </p>
                  <Button onClick={() => setCreateRuleOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Rule Dialog */}
      <Dialog open={createRuleOpen} onOpenChange={setCreateRuleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Recurring Transfer Rule</DialogTitle>
            <DialogDescription>
              Set up automated transfers on a schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-account">From Account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount}>
                  <SelectTrigger id="from-account" aria-label="Select source account">
                    <SelectValue placeholder="Choose source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-account">To Account/Beneficiary</Label>
                <Select value={toAccount} onValueChange={setToAccount}>
                  <SelectTrigger id="to-account" aria-label="Select destination">
                    <SelectValue placeholder="Choose destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <optgroup label="Internal Accounts">
                      {accounts.map((account) => (
                        <SelectItem key={`int-${account.id}`} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                    <optgroup label="Beneficiaries">
                      {beneficiaries.map((ben) => (
                        <SelectItem key={ben.id} value={ben.id}>
                          {ben.name} {ben.type === 'internal' ? `(${ben.email})` : `(${ben.details})`}
                        </SelectItem>
                      ))}
                    </optgroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Asset and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset</Label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger id="asset" aria-label="Select asset">
                    <SelectValue placeholder="Choose asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((a) => (
                      <SelectItem key={a.symbol} value={a.symbol}>
                        {a.symbol} - {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label="Transfer amount"
                />
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
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

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="Start date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="End date"
                />
              </div>
            </div>

            {/* Failover Rule */}
            <div className="space-y-2">
              <Label htmlFor="failover">If Transfer Fails</Label>
              <Select value={failoverRule} onValueChange={setFailoverRule}>
                <SelectTrigger id="failover" aria-label="Select failover behavior">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip this occurrence</SelectItem>
                  <SelectItem value="retry">Retry next day</SelectItem>
                  <SelectItem value="pause">Pause the rule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRule}
              disabled={!isFormValid}
            >
              <Repeat className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringTransfers;
