import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Shield, Clock, Info } from 'lucide-react';
import Navigation from '@/components/Navigation';

const BankTransfer = () => {
  const [activeTab, setActiveTab] = useState('transfer');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swift, setSwift] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [country, setCountry] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [purpose, setPurpose] = useState('');
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
  ];

  const purposes = [
    'Personal Transfer',
    'Business Payment',
    'Investment',
    'Property Purchase',
    'Education',
    'Medical Treatment',
    'Family Support',
    'Other',
  ];

  const countries = [
    'United States', 'United Kingdom', 'Germany', 'France', 'Japan',
    'Canada', 'Australia', 'Switzerland', 'Singapore', 'Hong Kong'
  ];

  const isTransferFormValid = beneficiaryName && accountNumber && swift && bankName && 
                              country && amount && parseFloat(amount) > 0 && currency && purpose;

  const handleContinue = () => {
    if (!isTransferFormValid) return;
    setSummaryOpen(true);
  };

  const handleConfirm = () => {
    // Stub: would make API call here
    console.log('Bank transfer:', {
      beneficiaryName, accountNumber, swift, bankName, bankAddress,
      country, amount, currency, purpose, saveAsBeneficiary
    });
    setSummaryOpen(false);
    // Reset form
    setBeneficiaryName('');
    setAccountNumber('');
    setSwift('');
    setBankName('');
    setBankAddress('');
    setAmount('');
    setPurpose('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Bank Transfers</h1>
            <p className="text-muted-foreground">Link a bank and send via SWIFT or compatible partner. KYC required.</p>
            <Badge variant="outline" className="mt-2">
              <Info className="w-3 h-3 mr-1" />
              Supports SWIFT and Wise routing (to be integrated)
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Bank Transfer</span>
                  </CardTitle>
                  <CardDescription>
                    Send money internationally via SWIFT or partner networks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="transfer">One-time Transfer</TabsTrigger>
                      <TabsTrigger value="link">Link a Bank</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transfer" className="space-y-6 mt-6">
                      {/* Beneficiary Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Beneficiary Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="beneficiary-name">Beneficiary Name *</Label>
                            <Input
                              id="beneficiary-name"
                              placeholder="Full name as on bank account"
                              value={beneficiaryName}
                              onChange={(e) => setBeneficiaryName(e.target.value)}
                              aria-label="Beneficiary full name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Select value={country} onValueChange={setCountry}>
                              <SelectTrigger id="country" aria-label="Select country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="account-number">Account Number / IBAN *</Label>
                            <Input
                              id="account-number"
                              placeholder="Account number or IBAN"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              aria-label="Account number or IBAN"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="swift">SWIFT/BIC Code *</Label>
                            <Input
                              id="swift"
                              placeholder="SWIFT or BIC code"
                              value={swift}
                              onChange={(e) => setSwift(e.target.value.toUpperCase())}
                              maxLength={11}
                              aria-label="SWIFT or BIC code"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bank-name">Bank Name *</Label>
                          <Input
                            id="bank-name"
                            placeholder="Name of the bank"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            aria-label="Bank name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bank-address">Bank Address</Label>
                          <Input
                            id="bank-address"
                            placeholder="Bank address (optional)"
                            value={bankAddress}
                            onChange={(e) => setBankAddress(e.target.value)}
                            aria-label="Bank address"
                          />
                        </div>
                      </div>

                      {/* Transfer Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Transfer Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount *</Label>
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
                          
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency *</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                              <SelectTrigger id="currency" aria-label="Select currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map((curr) => (
                                  <SelectItem key={curr.code} value={curr.code}>
                                    {curr.code} - {curr.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purpose">Purpose of Transfer *</Label>
                          <Select value={purpose} onValueChange={setPurpose}>
                            <SelectTrigger id="purpose" aria-label="Select transfer purpose">
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              {purposes.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="save-beneficiary"
                          checked={saveAsBeneficiary}
                          onCheckedChange={(checked) => setSaveAsBeneficiary(checked === true)}
                        />
                        <Label htmlFor="save-beneficiary" className="text-sm">
                          Save as beneficiary for future transfers
                        </Label>
                      </div>

                      <Alert>
                        <Shield className="w-4 h-4" />
                        <AlertDescription>
                          KYC verification required for international transfers. Processing time: 1-5 business days.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={handleContinue}
                        disabled={!isTransferFormValid}
                        className="w-full"
                        size="lg"
                      >
                        Continue
                      </Button>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-6 mt-6">
                      <div className="text-center py-12">
                        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Link Your Bank Account</h3>
                        <p className="text-muted-foreground mb-6">
                          Connect your bank account for faster future transfers and lower fees.
                        </p>
                        <Button variant="outline" size="lg">
                          <Shield className="w-4 h-4 mr-2" />
                          Connect Bank Account (Coming Soon)
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium text-sm">{beneficiaryName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{amount || '0.00'} {currency}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">TBD</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">Market Rate</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-lg font-semibold">
                    <span>Total</span>
                    <span>{amount || '0.00'} {currency}</span>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">ETA: 1-5 business days</span>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        SWIFT network fees and exchange rates apply. Final amount may vary.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bank Transfer</DialogTitle>
            <DialogDescription>
              Please review your transfer details before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beneficiary:</span>
                <span className="font-medium">{beneficiaryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium text-sm">{bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{amount} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purpose:</span>
                <span className="font-medium text-sm">{purpose}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSummaryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Submit Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankTransfer;