import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Repeat,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Pause,
  Users,
  Mail,
  Building2,
  Search,
  Copy,
  GripVertical,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';

const RecurringTransfers = () => {
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [failoverRule, setFailoverRule] = useState('skip');

  // Mock funding sources with priority order and enabled state
  const [fundingSources, setFundingSources] = useState([
    {
      id: 'usd',
      name: 'USD',
      type: 'fiat',
      balance: '$12,345.67',
      enabled: true,
      priority: 1,
    },
    {
      id: 'usdc',
      name: 'USDC',
      type: 'crypto',
      balance: '8,750.00 USDC',
      enabled: true,
      priority: 2,
    },
    {
      id: 'xau',
      name: 'Gold (XAU)',
      type: 'precious-metal',
      balance: '5.25 oz',
      enabled: false,
      priority: 3,
    },
    {
      id: 'xag',
      name: 'Silver (XAG)',
      type: 'precious-metal',
      balance: '150.00 oz',
      enabled: true,
      priority: 4,
    },
    {
      id: 'funding',
      name: 'Funding Account',
      type: 'account',
      balance: '$25,000.00',
      enabled: true,
      priority: 5,
    },
    {
      id: 'trading',
      name: 'Trading Account',
      type: 'account',
      balance: '$15,500.00',
      enabled: false,
      priority: 6,
    },
  ]);

  const accounts = [
    { id: 'funding', name: 'Funding Account', type: 'internal' },
    { id: 'trading', name: 'Trading Account', type: 'internal' },
    { id: 'savings', name: 'Savings Account', type: 'internal' },
  ];

  const beneficiaries = [
    {
      id: 'ben1',
      name: 'Alice Johnson',
      type: 'internal',
      email: 'alice@pbcex.com',
    },
    {
      id: 'ben2',
      name: 'John Smith',
      type: 'internal',
      email: 'john@pbcex.com',
    },
    {
      id: 'ben3',
      name: 'Bank of America',
      type: 'external',
      details: '****-1234',
    },
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
      destinationType: 'pbcex-user',
      asset: 'USD',
      amount: '500.00',
      frequency: 'Weekly',
      nextRun: '2024-02-05',
      enabled: true,
      failoverRule: 'skip',
    },
    {
      id: '2',
      name: 'Monthly Gold Purchase',
      fromAccount: 'Funding Account',
      toAccount: 'Trading Account',
      destinationType: 'pbcex-user',
      asset: 'XAU',
      amount: '0.25',
      frequency: 'Monthly',
      nextRun: '2024-02-01',
      enabled: true,
      failoverRule: 'retry',
    },
    {
      id: '3',
      name: 'Alice Payment',
      fromAccount: 'Funding Account',
      toAccount: 'Alice Johnson',
      destinationType: 'pbcex-user',
      asset: 'USDC',
      amount: '1000.00',
      frequency: 'Monthly',
      nextRun: '2024-02-15',
      enabled: false,
      failoverRule: 'skip',
    },
    {
      id: '4',
      name: 'Contractor Payment Links',
      fromAccount: 'Funding Account',
      toAccount: 'contractor@example.com',
      destinationType: 'payment-link',
      asset: 'USD',
      amount: '2500.00',
      frequency: 'Biweekly',
      nextRun: '2024-02-10',
      enabled: true,
      failoverRule: 'pause',
    },
    {
      id: '5',
      name: 'Rent Payment',
      fromAccount: 'Funding Account',
      toAccount: 'Bank of America',
      destinationType: 'bank-swift',
      asset: 'USD',
      amount: '3200.00',
      frequency: 'Monthly',
      nextRun: '2024-02-01',
      enabled: true,
      failoverRule: 'retry',
    },
  ];

  // Example outgoing transfers for the first tab
  const exampleTransfers = [
    {
      id: 'ex1',
      name: 'Daily DCA Bitcoin',
      description: 'Auto-purchase $25 BTC daily',
      status: 'Active',
      nextRun: '2024-02-02 09:00',
    },
    {
      id: 'ex2',
      name: 'Weekly Team Payments',
      description: 'Send payment links to 5 contractors',
      status: 'Active',
      nextRun: '2024-02-05 10:00',
    },
  ];

  // Helper functions
  const toggleFundingSource = (sourceId: string) => {
    setFundingSources(prev =>
      prev.map(source =>
        source.id === sourceId
          ? { ...source, enabled: !source.enabled }
          : source
      )
    );
  };

  const filterRulesBySearch = (rules: any[]) => {
    if (!searchQuery) return rules;
    return rules.filter(
      rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.toAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rule.enabled ? 'active' : 'paused').includes(searchQuery.toLowerCase())
    );
  };

  const groupRulesByDestination = (rules: any[]) => {
    return {
      'pbcex-user': rules.filter(rule => rule.destinationType === 'pbcex-user'),
      'payment-link': rules.filter(
        rule => rule.destinationType === 'payment-link'
      ),
      'bank-swift': rules.filter(rule => rule.destinationType === 'bank-swift'),
    };
  };

  const isFormValid =
    fromAccount &&
    toAccount &&
    asset &&
    amount &&
    parseFloat(amount) > 0 &&
    frequency &&
    startDate;

  const handleCreateRule = () => {
    if (!isFormValid) return;

    // Stub: would make API call here
    console.log('Create recurring rule:', {
      fromAccount,
      toAccount,
      asset,
      amount,
      frequency,
      startDate,
      endDate,
      failoverRule,
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
    <div className='min-h-screen bg-background'>
      <Navigation />
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Recurring Transfers
            </h1>
            <p className='text-muted-foreground'>
              Automate transfers on a schedule
            </p>

            {/* DCA Banner */}
            <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-medium text-blue-900'>
                    Looking to auto-buy assets?
                  </h3>
                  <p className='text-sm text-blue-700'>
                    Try Dollar-Cost Averaging for automated asset purchases
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => (window.location.href = '/trade/dca')}
                  className='border-blue-300 text-blue-700 hover:bg-blue-100'
                >
                  Try DCA
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue='outgoing' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='outgoing'>Outgoing Transfers</TabsTrigger>
              <TabsTrigger value='rules'>My Rules</TabsTrigger>
            </TabsList>

            <TabsContent value='outgoing' className='space-y-6 mt-6'>
              {/* Create New Rule Button */}
              <div className='mb-6'>
                <Button onClick={() => setCreateRuleOpen(true)} size='lg'>
                  <Plus className='w-4 h-4 mr-2' />
                  Add Outgoing Transfer
                </Button>
              </div>

              {/* Example Outgoing Transfers */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>
                  Active Outgoing Transfers
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {exampleTransfers.map(transfer => (
                    <Card
                      key={transfer.id}
                      className='border-l-4 border-l-green-500'
                    >
                      <CardContent className='p-4'>
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <h4 className='font-semibold text-base mb-1'>
                              {transfer.name}
                            </h4>
                            <p className='text-sm text-muted-foreground mb-2'>
                              {transfer.description}
                            </p>
                            <div className='flex items-center space-x-4 text-xs text-muted-foreground'>
                              <div className='flex items-center'>
                                <Clock className='w-3 h-3 mr-1' />
                                Next: {transfer.nextRun}
                              </div>
                            </div>
                          </div>
                          <Badge className='bg-green-100 text-green-800 text-xs'>
                            {transfer.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Transfer Types */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Create New Transfer</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <Card
                    className='cursor-pointer hover:shadow-md transition-shadow'
                    onClick={() => setCreateRuleOpen(true)}
                  >
                    <CardContent className='p-6 text-center'>
                      <Users className='w-8 h-8 mx-auto mb-3 text-primary' />
                      <h3 className='font-semibold mb-2'>To PBCEx User</h3>
                      <p className='text-sm text-muted-foreground'>
                        Account Number + Name + Asset + Amount + Schedule
                      </p>
                    </CardContent>
                  </Card>

                  <Card className='cursor-pointer hover:shadow-md transition-shadow opacity-50'>
                    <CardContent className='p-6 text-center'>
                      <Mail className='w-8 h-8 mx-auto mb-3 text-muted-foreground' />
                      <h3 className='font-semibold mb-2'>Payment Link</h3>
                      <p className='text-sm text-muted-foreground'>
                        Generate + schedule sending link emails (Coming Soon)
                      </p>
                    </CardContent>
                  </Card>

                  <Card className='cursor-pointer hover:shadow-md transition-shadow opacity-50'>
                    <CardContent className='p-6 text-center'>
                      <Building2 className='w-8 h-8 mx-auto mb-3 text-muted-foreground' />
                      <h3 className='font-semibold mb-2'>Bank/SWIFT</h3>
                      <p className='text-sm text-muted-foreground'>
                        Beneficiary + SWIFT + IBAN + Schedule (Coming Soon)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value='rules' className='space-y-6 mt-6'>
              <TooltipProvider>
                {/* Action Button */}
                <div className='flex justify-between items-center'>
                  <Button onClick={() => setCreateRuleOpen(true)} size='lg'>
                    <Plus className='w-4 h-4 mr-2' />
                    Add Recurring Rule
                  </Button>
                </div>

                {/* Search Bar */}
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                  <Input
                    placeholder='Search by destination name, asset, or status...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10'
                    aria-label='Search recurring rules'
                  />
                </div>

                {/* Funding Sources & Pull Priorities */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>
                      Funding Sources & Pull Priorities
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Drag to reorder priority
                    </p>
                  </div>

                  {fundingSources.length > 0 ? (
                    <div className='space-y-2'>
                      {fundingSources
                        .sort((a, b) => a.priority - b.priority)
                        .map((source, index) => (
                          <Card key={source.id} className='p-4'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-3'>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <GripVertical className='w-4 h-4 text-muted-foreground cursor-grab hover:cursor-grabbing' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Drag to set priority</p>
                                  </TooltipContent>
                                </Tooltip>

                                <div className='flex items-center space-x-2'>
                                  <Badge variant='outline' className='text-xs'>
                                    #{index + 1}
                                  </Badge>
                                  <span className='font-medium'>
                                    {source.name}
                                  </span>
                                </div>

                                <span className='text-sm text-muted-foreground'>
                                  {source.balance}
                                </span>
                              </div>

                              <Tooltip>
                                <TooltipTrigger>
                                  <Switch
                                    checked={source.enabled}
                                    onCheckedChange={() =>
                                      toggleFundingSource(source.id)
                                    }
                                    aria-label={`${source.enabled ? 'Disable' : 'Enable'} ${source.name} as funding source`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Toggle to allow this source for pulls</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className='text-center py-8'>
                        <Building2 className='w-12 h-12 mx-auto text-muted-foreground mb-3' />
                        <p className='text-muted-foreground'>
                          No funding sources configured
                        </p>
                        <Button variant='ghost' size='sm' className='mt-2'>
                          Add First Source
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* My Recurring Rules */}
                <div className='space-y-6'>
                  <h3 className='text-lg font-semibold'>My Recurring Rules</h3>

                  {(() => {
                    const filteredRules = filterRulesBySearch(mockRules);
                    const groupedRules = groupRulesByDestination(filteredRules);

                    return (
                      <div className='space-y-6'>
                        {/* To PBCEx Users */}
                        <div className='space-y-3'>
                          <h4 className='font-medium text-base flex items-center'>
                            <Users className='w-4 h-4 mr-2 text-primary' />
                            To PBCEx Users
                          </h4>
                          {groupedRules['pbcex-user'].length > 0 ? (
                            <div className='space-y-3'>
                              {groupedRules['pbcex-user'].map(rule => (
                                <Card key={rule.id}>
                                  <CardContent className='p-4'>
                                    <div className='flex items-center justify-between'>
                                      <div className='flex-1'>
                                        <div className='flex items-center space-x-2 mb-2'>
                                          <h5 className='font-semibold'>
                                            {rule.name}
                                          </h5>
                                          <Badge
                                            variant={
                                              rule.enabled
                                                ? 'default'
                                                : 'secondary'
                                            }
                                            className={
                                              rule.enabled
                                                ? 'bg-green-100 text-green-800'
                                                : ''
                                            }
                                          >
                                            {rule.enabled ? (
                                              <>
                                                <CheckCircle2 className='w-3 h-3 mr-1' />
                                                Active
                                              </>
                                            ) : (
                                              <>
                                                <Pause className='w-3 h-3 mr-1' />
                                                Paused
                                              </>
                                            )}
                                          </Badge>
                                        </div>

                                        <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground'>
                                          <div>To: {rule.toAccount}</div>
                                          <div>
                                            Amount: {rule.amount} {rule.asset}
                                          </div>
                                          <div>Next: {rule.nextRun}</div>
                                        </div>
                                      </div>

                                      <div className='flex items-center space-x-2 ml-4'>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Switch
                                              checked={rule.enabled}
                                              onCheckedChange={() =>
                                                toggleRule(rule.id)
                                              }
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Enable/disable rule</p>
                                          </TooltipContent>
                                        </Tooltip>

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Edit rule'
                                        >
                                          <Edit className='w-3 h-3' />
                                        </Button>

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Duplicate rule'
                                        >
                                          <Copy className='w-3 h-3' />
                                        </Button>

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Delete rule'
                                        >
                                          <Trash2 className='w-3 h-3' />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Card>
                              <CardContent className='text-center py-8'>
                                <Users className='w-12 h-12 mx-auto text-muted-foreground mb-3' />
                                <p className='text-muted-foreground'>
                                  No rules for PBCEx users
                                </p>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='mt-2'
                                  onClick={() => setCreateRuleOpen(true)}
                                >
                                  Add First Rule
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        {/* Payment Links / Email */}
                        <div className='space-y-3'>
                          <h4 className='font-medium text-base flex items-center'>
                            <Mail className='w-4 h-4 mr-2 text-primary' />
                            Payment Links / Email
                          </h4>
                          {groupedRules['payment-link'].length > 0 ? (
                            <div className='space-y-3'>
                              {groupedRules['payment-link'].map(rule => (
                                <Card key={rule.id}>
                                  <CardContent className='p-4'>
                                    <div className='flex items-center justify-between'>
                                      <div className='flex-1'>
                                        <div className='flex items-center space-x-2 mb-2'>
                                          <h5 className='font-semibold'>
                                            {rule.name}
                                          </h5>
                                          <Badge
                                            variant={
                                              rule.enabled
                                                ? 'default'
                                                : 'secondary'
                                            }
                                            className={
                                              rule.enabled
                                                ? 'bg-green-100 text-green-800'
                                                : ''
                                            }
                                          >
                                            {rule.enabled ? (
                                              <>
                                                <CheckCircle2 className='w-3 h-3 mr-1' />
                                                Active
                                              </>
                                            ) : (
                                              <>
                                                <Pause className='w-3 h-3 mr-1' />
                                                Paused
                                              </>
                                            )}
                                          </Badge>
                                        </div>

                                        <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground'>
                                          <div>To: {rule.toAccount}</div>
                                          <div>
                                            Amount: {rule.amount} {rule.asset}
                                          </div>
                                          <div>Next: {rule.nextRun}</div>
                                        </div>
                                      </div>

                                      <div className='flex items-center space-x-2 ml-4'>
                                        <Switch
                                          checked={rule.enabled}
                                          onCheckedChange={() =>
                                            toggleRule(rule.id)
                                          }
                                          aria-label='Enable/disable rule'
                                        />

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Edit rule'
                                        >
                                          <Edit className='w-3 h-3' />
                                        </Button>

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Duplicate rule'
                                        >
                                          <Copy className='w-3 h-3' />
                                        </Button>

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Delete rule'
                                        >
                                          <Trash2 className='w-3 h-3' />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Card>
                              <CardContent className='text-center py-8'>
                                <Mail className='w-12 h-12 mx-auto text-muted-foreground mb-3' />
                                <p className='text-muted-foreground'>
                                  No payment link rules configured
                                </p>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='mt-2'
                                  onClick={() => setCreateRuleOpen(true)}
                                >
                                  Add First Rule
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        {/* Bank / SWIFT */}
                        <div className='space-y-3'>
                          <h4 className='font-medium text-base flex items-center'>
                            <Building2 className='w-4 h-4 mr-2 text-primary' />
                            Bank / SWIFT
                          </h4>
                          {groupedRules['bank-swift'].length > 0 ? (
                            <div className='space-y-3'>
                              {groupedRules['bank-swift'].map(rule => (
                                <Card key={rule.id}>
                                  <CardContent className='p-4'>
                                    <div className='flex items-center justify-between'>
                                      <div className='flex-1'>
                                        <div className='flex items-center space-x-2 mb-2'>
                                          <h5 className='font-semibold'>
                                            {rule.name}
                                          </h5>
                                          <Badge
                                            variant={
                                              rule.enabled
                                                ? 'default'
                                                : 'secondary'
                                            }
                                            className={
                                              rule.enabled
                                                ? 'bg-green-100 text-green-800'
                                                : ''
                                            }
                                          >
                                            {rule.enabled ? (
                                              <>
                                                <CheckCircle2 className='w-3 h-3 mr-1' />
                                                Active
                                              </>
                                            ) : (
                                              <>
                                                <Pause className='w-3 h-3 mr-1' />
                                                Paused
                                              </>
                                            )}
                                          </Badge>
                                        </div>

                                        <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground'>
                                          <div>To: {rule.toAccount}</div>
                                          <div>
                                            Amount: {rule.amount} {rule.asset}
                                          </div>
                                          <div>Next: {rule.nextRun}</div>
                                        </div>
                                      </div>

                                      <div className='flex items-center space-x-2 ml-4'>
                                        <Switch
                                          checked={rule.enabled}
                                          onCheckedChange={() =>
                                            toggleRule(rule.id)
                                          }
                                          aria-label='Enable/disable rule'
                                        />

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Edit rule'
                                        >
                                          <Edit className='w-3 h-3' />
                                        </Button>

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Duplicate rule'
                                        >
                                          <Copy className='w-3 h-3' />
                                        </Button>

                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          aria-label='Delete rule'
                                        >
                                          <Trash2 className='w-3 h-3' />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <Card>
                              <CardContent className='text-center py-8'>
                                <Building2 className='w-12 h-12 mx-auto text-muted-foreground mb-3' />
                                <p className='text-muted-foreground'>
                                  No bank/SWIFT rules configured
                                </p>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='mt-2'
                                  onClick={() => setCreateRuleOpen(true)}
                                >
                                  Add First Rule
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </TooltipProvider>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Rule Dialog */}
      <Dialog open={createRuleOpen} onOpenChange={setCreateRuleOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Recurring Transfer Rule</DialogTitle>
            <DialogDescription>
              Set up automated transfers on a schedule
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6'>
            {/* Accounts */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='from-account'>From Account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount}>
                  <SelectTrigger
                    id='from-account'
                    aria-label='Select source account'
                  >
                    <SelectValue placeholder='Choose source account' />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='to-account'>To Account/Beneficiary</Label>
                <Select value={toAccount} onValueChange={setToAccount}>
                  <SelectTrigger
                    id='to-account'
                    aria-label='Select destination'
                  >
                    <SelectValue placeholder='Choose destination' />
                  </SelectTrigger>
                  <SelectContent>
                    <optgroup label='Internal Accounts'>
                      {accounts.map(account => (
                        <SelectItem
                          key={`int-${account.id}`}
                          value={account.id}
                        >
                          {account.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                    <optgroup label='Beneficiaries'>
                      {beneficiaries.map(ben => (
                        <SelectItem key={ben.id} value={ben.id}>
                          {ben.name}{' '}
                          {ben.type === 'internal'
                            ? `(${ben.email})`
                            : `(${ben.details})`}
                        </SelectItem>
                      ))}
                    </optgroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Asset and Amount */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='asset'>Asset</Label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger id='asset' aria-label='Select asset'>
                    <SelectValue placeholder='Choose asset' />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(a => (
                      <SelectItem key={a.symbol} value={a.symbol}>
                        {a.symbol} - {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='amount'>Amount</Label>
                <Input
                  id='amount'
                  type='number'
                  step='0.01'
                  min='0'
                  placeholder='0.00'
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  aria-label='Transfer amount'
                />
              </div>
            </div>

            {/* Frequency */}
            <div className='space-y-2'>
              <Label htmlFor='frequency'>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id='frequency' aria-label='Select frequency'>
                  <SelectValue placeholder='How often?' />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='start-date'>Start Date</Label>
                <Input
                  id='start-date'
                  type='date'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  aria-label='Start date'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='end-date'>End Date (Optional)</Label>
                <Input
                  id='end-date'
                  type='date'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  aria-label='End date'
                />
              </div>
            </div>

            {/* Failover Rule */}
            <div className='space-y-2'>
              <Label htmlFor='failover'>If Transfer Fails</Label>
              <Select value={failoverRule} onValueChange={setFailoverRule}>
                <SelectTrigger
                  id='failover'
                  aria-label='Select failover behavior'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='skip'>Skip this occurrence</SelectItem>
                  <SelectItem value='retry'>Retry next day</SelectItem>
                  <SelectItem value='pause'>Pause the rule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateRuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={!isFormValid}>
              <Repeat className='w-4 h-4 mr-2' />
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringTransfers;
