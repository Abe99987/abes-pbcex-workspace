import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Download,
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
} from 'lucide-react';
import CRSBadge from '@/components/CRSBadge';

const CustomersTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  // CRS Scoring Function
  const calculateCRSScore = (customer: any) => {
    const weights = {
      funding: 20,
      trading: 25,
      payments: 15,
      engagement: 15,
      tenure: 10,
      support: 10,
      balances: 5,
      referrals: 5,
    };

    let score = 0;
    score += (customer.fundingScore / 100) * weights.funding;
    score += (customer.tradingScore / 100) * weights.trading;
    score += (customer.paymentsScore / 100) * weights.payments;
    score += (customer.engagementScore / 100) * weights.engagement;
    score += (customer.tenureScore / 100) * weights.tenure;
    score += (customer.supportScore / 100) * weights.support;
    score += (customer.balancesScore / 100) * weights.balances;
    score += (customer.referralsScore / 100) * weights.referrals;

    return Math.round(score);
  };

  const getTierFromScore = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
  };

  // Mock customer data
  const customers = [
    {
      id: 1,
      email: 'john.doe@example.com',
      name: 'John Doe',
      fundingScore: 95,
      tradingScore: 88,
      paymentsScore: 92,
      engagementScore: 85,
      tenureScore: 90,
      supportScore: 88,
      balancesScore: 95,
      referralsScore: 80,
      ddStatus: 'Verified',
      notional30d: 125000,
      remittanceCount: 15,
      dau: 0.85,
      mau: 0.92,
      kycLevel: 'Enhanced',
      riskFlags: [],
    },
    {
      id: 2,
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      fundingScore: 78,
      tradingScore: 82,
      paymentsScore: 75,
      engagementScore: 88,
      tenureScore: 70,
      supportScore: 85,
      balancesScore: 80,
      referralsScore: 60,
      ddStatus: 'Pending',
      notional30d: 85000,
      remittanceCount: 8,
      dau: 0.72,
      mau: 0.85,
      kycLevel: 'Standard',
      riskFlags: ['High Volume'],
    },
    {
      id: 3,
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
      fundingScore: 65,
      tradingScore: 70,
      paymentsScore: 68,
      engagementScore: 72,
      tenureScore: 60,
      supportScore: 75,
      balancesScore: 70,
      referralsScore: 45,
      ddStatus: 'Verified',
      notional30d: 45000,
      remittanceCount: 5,
      dau: 0.58,
      mau: 0.68,
      kycLevel: 'Basic',
      riskFlags: [],
    },
  ].map(customer => ({
    ...customer,
    score: calculateCRSScore(customer),
    tier: getTierFromScore(calculateCRSScore(customer)),
  }));

  // Tier distribution
  const tierDistribution = customers.reduce(
    (acc, customer) => {
      acc[customer.tier] = (acc[customer.tier] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === null || customer.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const handleCSVExport = () => {
    const csvData = [
      [
        'Email',
        'Name',
        'Tier',
        'Score',
        'DD Status',
        '30d Notional',
        'Remittance Count',
        'DAU',
        'MAU',
        'KYC Level',
        'Risk Flags',
      ],
      ...filteredCustomers.map(customer => [
        customer.email,
        customer.name,
        `Tier ${customer.tier}`,
        customer.score.toString(),
        customer.ddStatus,
        customer.notional30d.toString(),
        customer.remittanceCount.toString(),
        customer.dau.toFixed(2),
        customer.mau.toFixed(2),
        customer.kycLevel,
        customer.riskFlags.join('; '),
      ]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-ranking-system.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Customer Ranking System</h2>
          <p className='text-muted-foreground'>
            Deterministic customer scoring and tier management
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' size='sm' onClick={handleCSVExport}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Inspect
          </Button>
        </div>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Users className='h-5 w-5 mr-2' />
            Tier Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-5 gap-4'>
            {[5, 4, 3, 2, 1].map(tier => {
              const count = tierDistribution[tier] || 0;
              const percentage = (count / customers.length) * 100;
              return (
                <div key={tier} className='text-center'>
                  <div className='text-2xl font-bold'>
                    <CRSBadge
                      tier={tier}
                      score={
                        tier === 5
                          ? 95
                          : tier === 4
                            ? 80
                            : tier === 3
                              ? 60
                              : tier === 2
                                ? 40
                                : 20
                      }
                    />
                  </div>
                  <div className='text-sm text-muted-foreground mt-2'>
                    {count} customers
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-32 bg-muted/50 rounded-lg flex items-center justify-center'>
            <div className='text-center'>
              <TrendingUp className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
              <p className='text-muted-foreground'>Average CRS Score Trend</p>
              <p className='text-xs text-muted-foreground mt-1'>
                Monthly progression
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Filter className='h-5 w-5 mr-2' />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex space-x-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search customers...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='flex space-x-2'>
              <Button
                variant={selectedTier === null ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedTier(null)}
              >
                All Tiers
              </Button>
              {[5, 4, 3, 2, 1].map(tier => (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setSelectedTier(tier)}
                >
                  Tier {tier}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left p-2'>Email</th>
                  <th className='text-left p-2'>Tier</th>
                  <th className='text-left p-2'>Score</th>
                  <th className='text-left p-2'>DD Status</th>
                  <th className='text-left p-2'>30d Notional</th>
                  <th className='text-left p-2'>Remittance</th>
                  <th className='text-left p-2'>DAU/MAU</th>
                  <th className='text-left p-2'>KYC</th>
                  <th className='text-left p-2'>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className='border-b hover:bg-muted/50'>
                    <td className='p-2'>
                      <div>
                        <div className='font-medium'>{customer.email}</div>
                        <div className='text-sm text-muted-foreground'>
                          {customer.name}
                        </div>
                      </div>
                    </td>
                    <td className='p-2'>
                      <CRSBadge tier={customer.tier} score={customer.score} />
                    </td>
                    <td className='p-2'>
                      <div className='font-medium'>{customer.score}</div>
                      <div className='text-xs text-muted-foreground'>
                        {customer.score >= 90
                          ? 'Excellent'
                          : customer.score >= 70
                            ? 'Good'
                            : customer.score >= 50
                              ? 'Average'
                              : customer.score >= 30
                                ? 'Below Average'
                                : 'Poor'}
                      </div>
                    </td>
                    <td className='p-2'>
                      <Badge
                        variant={
                          customer.ddStatus === 'Verified'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {customer.ddStatus}
                      </Badge>
                    </td>
                    <td className='p-2'>
                      <div className='font-medium'>
                        ${customer.notional30d.toLocaleString()}
                      </div>
                    </td>
                    <td className='p-2'>
                      <div className='font-medium'>
                        {customer.remittanceCount}
                      </div>
                    </td>
                    <td className='p-2'>
                      <div className='text-sm'>
                        <div>DAU: {(customer.dau * 100).toFixed(0)}%</div>
                        <div>MAU: {(customer.mau * 100).toFixed(0)}%</div>
                      </div>
                    </td>
                    <td className='p-2'>
                      <Badge variant='outline'>{customer.kycLevel}</Badge>
                    </td>
                    <td className='p-2'>
                      {customer.riskFlags.length > 0 ? (
                        <Badge variant='destructive'>
                          {customer.riskFlags.join(', ')}
                        </Badge>
                      ) : (
                        <Badge variant='outline'>None</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown Tooltip Example */}
      <Card>
        <CardHeader>
          <CardTitle>CRS Scoring Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div>
              <div className='font-medium'>Funding/DD (20%)</div>
              <div className='text-muted-foreground'>
                Direct deposit setup, verification
              </div>
            </div>
            <div>
              <div className='font-medium'>Trading (25%)</div>
              <div className='text-muted-foreground'>
                Volume, frequency, profitability
              </div>
            </div>
            <div>
              <div className='font-medium'>Payments (15%)</div>
              <div className='text-muted-foreground'>
                Remittance usage, frequency
              </div>
            </div>
            <div>
              <div className='font-medium'>Engagement (15%)</div>
              <div className='text-muted-foreground'>
                DAU/MAU, feature usage
              </div>
            </div>
            <div>
              <div className='font-medium'>Tenure & KYC (10%)</div>
              <div className='text-muted-foreground'>
                Account age, verification level
              </div>
            </div>
            <div>
              <div className='font-medium'>Support (10%)</div>
              <div className='text-muted-foreground'>
                Compliance, issue resolution
              </div>
            </div>
            <div>
              <div className='font-medium'>Balances (5%)</div>
              <div className='text-muted-foreground'>
                Account balance levels
              </div>
            </div>
            <div>
              <div className='font-medium'>Referrals (5%)</div>
              <div className='text-muted-foreground'>
                Successful referrals made
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersTab;
