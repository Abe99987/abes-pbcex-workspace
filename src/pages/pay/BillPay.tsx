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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Receipt,
  Plus,
  Calendar,
  Edit,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import Navigation from '@/components/Navigation';

const BillPay = () => {
  const [activeTab, setActiveTab] = useState('payees');
  const [addPayeeOpen, setAddPayeeOpen] = useState(false);
  const [payeeName, setPayeeName] = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [payeeType, setPayeeType] = useState('');
  const [scheduleAmount, setScheduleAmount] = useState('');
  const [schedulePayee, setSchedulePayee] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('');

  const payeeTypes = [
    'Utility - Electric',
    'Utility - Gas',
    'Utility - Water',
    'Utility - Internet',
    'Phone/Mobile',
    'Credit Card',
    'Insurance',
    'Mortgage/Rent',
    'Loan Payment',
    'Subscription',
    'Other',
  ];

  const frequencies = [
    { value: 'once', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
  ];

  const mockPayees = [
    {
      id: '1',
      name: 'Pacific Gas & Electric',
      type: 'Utility - Gas',
      accountRef: '****-1234',
      lastPaid: '2024-01-15',
      amount: '$156.50',
      status: 'active',
    },
    {
      id: '2',
      name: 'Visa Credit Card',
      type: 'Credit Card',
      accountRef: '****-5678',
      lastPaid: '2024-01-10',
      amount: '$425.00',
      status: 'active',
    },
    {
      id: '3',
      name: 'AT&T Wireless',
      type: 'Phone/Mobile',
      accountRef: '****-9012',
      lastPaid: '2024-01-05',
      amount: '$85.99',
      status: 'paused',
    },
  ];

  const mockSchedules = [
    {
      id: '1',
      payeeName: 'Pacific Gas & Electric',
      amount: '$156.50',
      frequency: 'Monthly',
      nextPayment: '2024-02-15',
      enabled: true,
    },
    {
      id: '2',
      payeeName: 'Visa Credit Card',
      amount: '$425.00',
      frequency: 'Monthly',
      nextPayment: '2024-02-10',
      enabled: true,
    },
    {
      id: '3',
      payeeName: 'AT&T Wireless',
      amount: '$85.99',
      frequency: 'Monthly',
      nextPayment: '2024-02-05',
      enabled: false,
    },
  ];

  const handleAddPayee = () => {
    if (!payeeName || !accountRef || !payeeType) return;

    // Stub: would make API call here
    console.log('Add payee:', { payeeName, accountRef, payeeType });
    setAddPayeeOpen(false);
    // Reset form
    setPayeeName('');
    setAccountRef('');
    setPayeeType('');
  };

  const handleSchedulePayment = () => {
    if (!schedulePayee || !scheduleAmount || !scheduleFrequency) return;

    // Stub: would make API call here
    console.log('Schedule payment:', {
      schedulePayee,
      scheduleAmount,
      scheduleFrequency,
    });
    // Reset form
    setSchedulePayee('');
    setScheduleAmount('');
    setScheduleFrequency('');
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Bill Pay
            </h1>
            <p className='text-muted-foreground'>
              Add payees and schedule one-time or recurring bills
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Receipt className='w-5 h-5' />
                <span>Bill Payment Management</span>
              </CardTitle>
              <CardDescription>
                Manage your payees and set up automated bill payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='payees'>Payees</TabsTrigger>
                  <TabsTrigger value='schedule'>Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value='payees' className='space-y-6 mt-6'>
                  <div className='flex justify-between items-center'>
                    <h3 className='text-lg font-semibold'>Your Payees</h3>
                    <Button onClick={() => setAddPayeeOpen(true)}>
                      <Plus className='w-4 h-4 mr-2' />
                      Add Payee
                    </Button>
                  </div>

                  <div className='space-y-4'>
                    {mockPayees.map(payee => (
                      <div
                        key={payee.id}
                        className='p-4 border border-border rounded-lg'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-3'>
                              <div>
                                <div className='font-semibold'>
                                  {payee.name}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  {payee.type} • Account: {payee.accountRef}
                                </div>
                                <div className='text-xs text-muted-foreground mt-1'>
                                  Last paid: {payee.lastPaid} • {payee.amount}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center space-x-3'>
                            <Badge
                              variant={
                                payee.status === 'active'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {payee.status}
                            </Badge>
                            <Button
                              variant='ghost'
                              size='sm'
                              aria-label='Edit payee'
                            >
                              <Edit className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              aria-label='Delete payee'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {mockPayees.length === 0 && (
                    <div className='text-center py-12'>
                      <Receipt className='w-16 h-16 mx-auto text-muted-foreground mb-4' />
                      <h3 className='text-lg font-semibold mb-2'>
                        No Payees Added
                      </h3>
                      <p className='text-muted-foreground mb-4'>
                        Add your first payee to start scheduling bill payments
                      </p>
                      <Button onClick={() => setAddPayeeOpen(true)}>
                        <Plus className='w-4 h-4 mr-2' />
                        Add First Payee
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value='schedule' className='space-y-6 mt-6'>
                  {/* Schedule New Payment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg'>
                        Schedule New Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='schedule-payee'>Payee</Label>
                          <Select
                            value={schedulePayee}
                            onValueChange={setSchedulePayee}
                          >
                            <SelectTrigger
                              id='schedule-payee'
                              aria-label='Select payee'
                            >
                              <SelectValue placeholder='Choose payee' />
                            </SelectTrigger>
                            <SelectContent>
                              {mockPayees.map(payee => (
                                <SelectItem key={payee.id} value={payee.id}>
                                  {payee.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='schedule-amount'>Amount</Label>
                          <Input
                            id='schedule-amount'
                            type='number'
                            step='0.01'
                            min='0'
                            placeholder='0.00'
                            value={scheduleAmount}
                            onChange={e => setScheduleAmount(e.target.value)}
                            aria-label='Payment amount'
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='schedule-frequency'>Frequency</Label>
                          <Select
                            value={scheduleFrequency}
                            onValueChange={setScheduleFrequency}
                          >
                            <SelectTrigger
                              id='schedule-frequency'
                              aria-label='Select frequency'
                            >
                              <SelectValue placeholder='Choose frequency' />
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
                      </div>

                      <Button
                        onClick={handleSchedulePayment}
                        disabled={
                          !schedulePayee ||
                          !scheduleAmount ||
                          !scheduleFrequency
                        }
                        className='w-full'
                      >
                        <Calendar className='w-4 h-4 mr-2' />
                        Schedule Payment
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Schedules */}
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Scheduled Payments
                    </h3>
                    <div className='space-y-4'>
                      {mockSchedules.map(schedule => (
                        <div
                          key={schedule.id}
                          className='p-4 border border-border rounded-lg'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center space-x-3'>
                                <div>
                                  <div className='font-semibold'>
                                    {schedule.payeeName}
                                  </div>
                                  <div className='text-sm text-muted-foreground'>
                                    {schedule.amount} • {schedule.frequency}
                                  </div>
                                  <div className='text-xs text-muted-foreground mt-1'>
                                    Next payment: {schedule.nextPayment}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center space-x-3'>
                              {schedule.enabled && (
                                <Badge
                                  variant='default'
                                  className='text-green-600'
                                >
                                  <CheckCircle2 className='w-3 h-3 mr-1' />
                                  Active
                                </Badge>
                              )}
                              <Switch
                                checked={schedule.enabled}
                                onCheckedChange={() => {
                                  // Stub: toggle schedule
                                  console.log('Toggle schedule:', schedule.id);
                                }}
                              />
                              <Button
                                variant='ghost'
                                size='sm'
                                aria-label='Edit schedule'
                              >
                                <Edit className='w-4 h-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Payee Dialog */}
      <Dialog open={addPayeeOpen} onOpenChange={setAddPayeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Payee</DialogTitle>
            <DialogDescription>
              Add a new payee for bill payments
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='payee-name'>Payee Name</Label>
              <Input
                id='payee-name'
                placeholder='Company or person name'
                value={payeeName}
                onChange={e => setPayeeName(e.target.value)}
                aria-label='Payee name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='account-ref'>Account/Reference Number</Label>
              <Input
                id='account-ref'
                placeholder='Account or reference number'
                value={accountRef}
                onChange={e => setAccountRef(e.target.value)}
                aria-label='Account reference number'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='payee-type'>Type</Label>
              <Select value={payeeType} onValueChange={setPayeeType}>
                <SelectTrigger id='payee-type' aria-label='Select payee type'>
                  <SelectValue placeholder='Select payee type' />
                </SelectTrigger>
                <SelectContent>
                  {payeeTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAddPayeeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPayee}
              disabled={!payeeName || !accountRef || !payeeType}
            >
              Add Payee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillPay;
