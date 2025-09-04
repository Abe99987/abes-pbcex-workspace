import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Calendar,
  Download,
  MoreHorizontal,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { Transaction, CATEGORIES, AccountType } from '@/hooks/useSpendingData';
import TransactionDrawer from './TransactionDrawer';

interface TransactionsTableProps {
  transactions: Transaction[];
  selectedCategory: string | null;
  accountType: AccountType;
  onUpdateCategory: (id: string, categoryId: string) => void;
  onCreateRule: (transaction: Transaction) => void;
}

const TransactionsTable = ({
  transactions,
  selectedCategory,
  accountType,
  onUpdateCategory,
  onCreateRule,
}: TransactionsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [drawerTransaction, setDrawerTransaction] =
    useState<Transaction | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');

  // Filter transactions based on category selection
  const categoryFilteredTransactions = useMemo(() => {
    if (!selectedCategory) return transactions;
    return transactions.filter(tx => tx.categoryId === selectedCategory);
  }, [transactions, selectedCategory]);

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    let filtered = categoryFilteredTransactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        tx =>
          tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.memo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tab filter
    if (selectedTab !== 'all') {
      switch (selectedTab) {
        case 'fixed':
          filtered = filtered.filter(tx =>
            ['fixed-costs', 'utilities'].includes(tx.categoryId || '')
          );
          break;
        case 'subscriptions':
          filtered = filtered.filter(tx => tx.categoryId === 'subscriptions');
          break;
        case 'discretionary':
          filtered = filtered.filter(tx =>
            ['food', 'shopping', 'entertainment'].includes(tx.categoryId || '')
          );
          break;
        case 'recurring':
          filtered = filtered.filter(tx => tx.isRecurring);
          break;
        case 'misc':
          filtered = filtered.filter(
            tx => !tx.categoryId || tx.categoryId === 'misc'
          );
          break;
        case 'business':
          if (accountType === 'BUSINESS') {
            const businessCategories = CATEGORIES.filter(
              cat => cat.isBusinessOnly
            ).map(cat => cat.id);
            filtered = filtered.filter(tx =>
              businessCategories.includes(tx.categoryId || '')
            );
          }
          break;
      }
    }

    return filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [categoryFilteredTransactions, searchTerm, selectedTab, accountType]);

  const uncategorizedCount = transactions.filter(
    tx => !tx.categoryId || tx.categoryId === 'misc'
  ).length;

  const handleSelectTransaction = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, id]);
    } else {
      setSelectedTransactions(selectedTransactions.filter(txId => txId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions.map(tx => tx.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleBulkCategorize = (categoryId: string) => {
    selectedTransactions.forEach(id => {
      onUpdateCategory(id, categoryId);
    });
    setSelectedTransactions([]);
  };

  const tabs = [
    { value: 'all', label: 'All', count: filteredTransactions.length },
    { value: 'fixed', label: 'Fixed', count: 0 },
    { value: 'utilities', label: 'Utilities & Bills', count: 0 },
    { value: 'subscriptions', label: 'Subscriptions', count: 0 },
    { value: 'discretionary', label: 'Discretionary', count: 0 },
    { value: 'recurring', label: 'Recurring', count: 0 },
    ...(accountType === 'BUSINESS'
      ? [{ value: 'business', label: 'Business-Only', count: 0 }]
      : []),
    { value: 'misc', label: 'Misc (Uncategorized)', count: uncategorizedCount },
  ];

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0'>
          <CardTitle className='text-xl'>Transactions</CardTitle>

          {/* Search and Filters */}
          <div className='flex items-center space-x-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Search transactions...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 w-64'
              />
            </div>
            <Button variant='outline' size='sm'>
              <Filter className='w-4 h-4 mr-2' />
              Filter
            </Button>
            <Button variant='outline' size='sm'>
              <Download className='w-4 h-4 mr-2' />
              Export
            </Button>
          </div>
        </div>

        {/* Uncategorized Banner */}
        {uncategorizedCount > 0 && (
          <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <AlertCircle className='w-4 h-4 text-yellow-600' />
              <span className='text-sm text-yellow-800 dark:text-yellow-200'>
                {uncategorizedCount} transactions need labels
              </span>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSelectedTab('misc')}
            >
              Review
            </Button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedTransactions.length > 0 && (
          <div className='bg-accent/20 rounded-lg p-3 flex items-center justify-between'>
            <span className='text-sm font-medium'>
              {selectedTransactions.length} selected
            </span>
            <div className='flex items-center space-x-2'>
              <Select onValueChange={handleBulkCategorize}>
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='Bulk categorize' />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className='flex items-center space-x-2'>
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant='outline' size='sm'>
                Create Rule
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className='grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1'>
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant='secondary' className='ml-1 text-xs'>
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTab} className='mt-4'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left p-2'>
                      <Checkbox
                        checked={
                          selectedTransactions.length ===
                          filteredTransactions.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className='text-left p-2 font-semibold'>Date</th>
                    <th className='text-left p-2 font-semibold'>Merchant</th>
                    <th className='text-left p-2 font-semibold'>Memo</th>
                    <th className='text-right p-2 font-semibold'>Amount</th>
                    <th className='text-left p-2 font-semibold'>Category</th>
                    <th className='text-left p-2 font-semibold'>Tags</th>
                    <th className='text-left p-2 font-semibold'>Account</th>
                    <th className='text-left p-2 font-semibold'></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => {
                    const category = CATEGORIES.find(
                      c => c.id === transaction.categoryId
                    );
                    return (
                      <tr
                        key={transaction.id}
                        className='border-b hover:bg-accent/20 cursor-pointer'
                        onClick={() => setDrawerTransaction(transaction)}
                      >
                        <td className='p-2' onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedTransactions.includes(
                              transaction.id
                            )}
                            onCheckedChange={checked =>
                              handleSelectTransaction(
                                transaction.id,
                                checked as boolean
                              )
                            }
                          />
                        </td>
                        <td className='p-2 text-sm'>
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className='p-2'>
                          <div className='flex items-center space-x-2'>
                            <span className='text-lg'>
                              {category?.icon || '💳'}
                            </span>
                            <span className='font-medium'>
                              {transaction.merchant}
                            </span>
                          </div>
                        </td>
                        <td className='p-2 text-sm text-muted-foreground max-w-48 truncate'>
                          {transaction.memo}
                        </td>
                        <td
                          className={`p-2 text-right font-semibold ${
                            transaction.amount < 0
                              ? 'text-destructive'
                              : 'text-primary'
                          }`}
                        >
                          {transaction.amount < 0 ? '-' : '+'}$
                          {Math.abs(transaction.amount).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                        <td className='p-2' onClick={e => e.stopPropagation()}>
                          <Select
                            value={transaction.categoryId || ''}
                            onValueChange={value =>
                              onUpdateCategory(transaction.id, value)
                            }
                          >
                            <SelectTrigger className='w-36 h-8'>
                              <SelectValue placeholder='Category' />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <div className='flex items-center space-x-2'>
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className='p-2'>
                          <div className='flex items-center space-x-1'>
                            {transaction.tags?.map(tag => (
                              <Badge
                                key={tag}
                                variant='outline'
                                className='text-xs'
                              >
                                {tag}
                              </Badge>
                            ))}
                            {transaction.isRecurring && (
                              <Badge variant='secondary' className='text-xs'>
                                <Repeat className='w-3 h-3 mr-1' />
                                Recurring
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className='p-2 text-sm text-muted-foreground'>
                          {transaction.accountName}
                        </td>
                        <td className='p-2'>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='w-4 h-4' />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredTransactions.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  No transactions found matching your filters.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <TransactionDrawer
        transaction={drawerTransaction}
        isOpen={!!drawerTransaction}
        onClose={() => setDrawerTransaction(null)}
        onUpdateCategory={onUpdateCategory}
        onCreateRule={onCreateRule}
      />
    </Card>
  );
};

export default TransactionsTable;
