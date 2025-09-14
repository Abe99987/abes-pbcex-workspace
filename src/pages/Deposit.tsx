import React, { useState } from 'react';
import { Copy, CheckCircle, Wallet, CreditCard, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import TradingNavigation from '@/components/trading/TradingNavigation';

interface CryptoNetwork {
  name: string;
  symbol: string;
  address: string;
  minDeposit: string;
  confirmations: number;
}

const cryptoNetworks: CryptoNetwork[] = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    minDeposit: '0.0001 BTC',
    confirmations: 3
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    address: '0x742d35Cc6634C0532925a3b8D491D8f7d3C9e3C2',
    minDeposit: '0.01 ETH',
    confirmations: 12
  },
  {
    name: 'USDC (Ethereum)',
    symbol: 'USDC',
    address: '0x742d35Cc6634C0532925a3b8D491D8f7d3C9e3C2',
    minDeposit: '10 USDC',
    confirmations: 12
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
    minDeposit: '0.1 SOL',
    confirmations: 32
  }
];

const Deposit = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (address: string, symbol: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success(`${symbol} deposit address copied to clipboard`);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TradingNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Deposit Funds</h1>
            <p className="text-muted-foreground">Add money to your PBCEx account</p>
          </div>

          <Tabs defaultValue="crypto" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
              <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
              <TabsTrigger value="card">Debit Card</TabsTrigger>
            </TabsList>

            <TabsContent value="crypto" className="space-y-4">
              <div className="grid gap-4">
                {cryptoNetworks.map((network) => (
                  <Card key={network.symbol}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{network.name}</CardTitle>
                        <Badge variant="secondary">{network.symbol}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Deposit Address
                        </label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="flex-1 p-3 bg-muted rounded text-sm font-mono break-all">
                            {network.address}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(network.address, network.symbol)}
                            className="shrink-0"
                          >
                            {copiedAddress === network.address ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Min Deposit:</span>
                          <div className="font-medium">{network.minDeposit}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confirmations:</span>
                          <div className="font-medium">{network.confirmations}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          <strong>Important:</strong> Only send {network.symbol} to this address. 
                          Sending other tokens may result in permanent loss.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Bank Transfer (ACH)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-2">Wire Transfer Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <span>PBCEx Banking Partner</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span>PBCEx Client Funds</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span>************1234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Routing Number:</span>
                        <span>021000021</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference:</span>
                        <span>Your PBCEx User ID</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Time:</span>
                      <span>1-3 business days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee:</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minimum:</span>
                      <span>$100</span>
                    </div>
                  </div>

                  <Button className="w-full">
                    Set Up Bank Transfer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="card" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Debit Card Deposit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-2">Instant Deposits</h4>
                    <p className="text-sm text-muted-foreground">
                      Add funds instantly using your debit card. Perfect for quick trades and purchases.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Time:</span>
                      <span>Instant</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fee:</span>
                      <span>2.9% + $0.30</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Limit:</span>
                      <span>$10,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minimum:</span>
                      <span>$10</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> Only Visa and Mastercard debit cards are accepted. 
                      Credit cards are not supported.
                    </p>
                  </div>

                  <Button className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Debit Card
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Deposit;