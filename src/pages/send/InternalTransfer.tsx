import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

const InternalTransfer = () => {
  const [recipient, setRecipient] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const assets = [
    { symbol: 'USD', name: 'US Dollar', balance: '5,420.50' },
    { symbol: 'XAU', name: 'Gold (XAU)', balance: '2.45' },
    { symbol: 'XAG', name: 'Silver (XAG)', balance: '150.80' },
    { symbol: 'USDC', name: 'USD Coin', balance: '3,200.00' },
    { symbol: 'PAXG', name: 'Pax Gold', balance: '1.25' },
  ];

  const isFormValid = recipient.trim() && asset && amount && parseFloat(amount) > 0;

  const handleSendNow = () => {
    if (!isFormValid) return;
    setConfirmationOpen(true);
  };

  const handleConfirm = () => {
    // Stub: would make API call here
    console.log('Internal transfer:', { recipient, asset, amount, memo });
    setConfirmationOpen(false);
    // Reset form
    setRecipient('');
    setAsset('');
    setAmount('');
    setMemo('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Send to PBCEx User</h1>
            <p className="text-muted-foreground">Instant internal transfer to another PBCEx user. No fee.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Transfer Details</span>
                  </CardTitle>
                  <CardDescription>
                    Send instantly to any PBCEx user using their email, phone, or username.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient *</Label>
                    <Input
                      id="recipient"
                      placeholder="Email, phone number, or username"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      aria-label="Recipient email, phone or username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset *</Label>
                    <Select value={asset} onValueChange={setAsset}>
                      <SelectTrigger id="asset" aria-label="Select asset to send">
                        <SelectValue placeholder="Choose asset to send" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map((a) => (
                          <SelectItem key={a.symbol} value={a.symbol}>
                            {a.symbol} - {a.name} (Balance: {a.balance})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        aria-label="Amount to send"
                      />
                      {asset && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 text-xs"
                          onClick={() => {
                            const selectedAsset = assets.find(a => a.symbol === asset);
                            if (selectedAsset) {
                              setAmount(selectedAsset.balance.replace(',', ''));
                            }
                          }}
                        >
                          MAX
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memo">Memo (Optional)</Label>
                    <Textarea
                      id="memo"
                      placeholder="Add a note for the recipient..."
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      rows={3}
                      aria-label="Optional memo"
                    />
                  </div>

                  <Button
                    onClick={handleSendNow}
                    disabled={!isFormValid}
                    className="w-full"
                    size="lg"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Send Now
                  </Button>
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
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">{recipient || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Asset</span>
                    <span className="font-medium">{asset || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Fee</span>
                    <Badge variant="secondary" className="text-green-600">
                      FREE
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 text-lg font-semibold">
                    <span>Total</span>
                    <span>{amount || '0.00'} {asset}</span>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 inline mr-2 text-green-600" />
                      Internal transfers are free and instant
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transfer</DialogTitle>
            <DialogDescription>
              Please review your transfer details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium">{recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{amount} {asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee:</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>
              {memo && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground">Memo:</span>
                  <p className="text-sm mt-1">{memo}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalTransfer;