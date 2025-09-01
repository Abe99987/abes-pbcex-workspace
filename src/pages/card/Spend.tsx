import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, ArrowUpDown, Settings, Info, CheckCircle2 } from 'lucide-react';
import Navigation from '@/components/Navigation';

const CardSpend = () => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const assets = [
    {
      symbol: 'USD',
      name: 'US Dollar',
      balance: '5,420.50',
      spendEnabled: true,
      priority: 1,
      category: 'Fiat',
      description: 'Primary spending currency'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '3,200.00',
      spendEnabled: true,
      priority: 2,
      category: 'Stablecoin',
      description: 'Digital dollar alternative'
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      balance: '1,850.75',
      spendEnabled: false,
      priority: 3,
      category: 'Stablecoin',
      description: 'Stable value cryptocurrency'
    },
    {
      symbol: 'XAU',
      name: 'Gold (XAU)',
      balance: '2.45',
      spendEnabled: true,
      priority: 4,
      category: 'Precious Metal',
      description: 'Gold-backed spending'
    },
    {
      symbol: 'XAG',
      name: 'Silver (XAG)',
      balance: '150.80',
      spendEnabled: false,
      priority: 5,
      category: 'Precious Metal',
      description: 'Silver-backed spending'
    },
    {
      symbol: 'PAXG',
      name: 'Pax Gold',
      balance: '1.25',
      spendEnabled: true,
      priority: 6,
      category: 'Precious Metal',
      description: 'Tokenized gold'
    },
  ];

  const handleAssetToggle = (symbol: string) => {
    // Stub: would make API call here
    console.log('Toggle spend status for:', symbol);
  };

  const handlePriorityChange = (symbol: string) => {
    // Stub: would open priority management dialog
    console.log('Manage priority for:', symbol);
  };

  const handleContinue = () => {
    if (!selectedAsset) return;
    // Stub: would navigate to card confirmation page
    console.log('Continue with asset:', selectedAsset);
  };

  const enabledAssets = assets.filter(asset => asset.spendEnabled);
  const disabledAssets = assets.filter(asset => !asset.spendEnabled);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Spend with Visa Card</h1>
            <p className="text-muted-foreground">Choose which asset to spend from your card</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Asset Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enabled Assets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Enabled for Spending</span>
                  </CardTitle>
                  <CardDescription>
                    Assets available for card transactions (ordered by priority)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enabledAssets.length > 0 ? (
                    enabledAssets.map((asset) => (
                      <div
                        key={asset.symbol}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAsset === asset.symbol
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedAsset(asset.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold">{asset.symbol}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    #{asset.priority}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      asset.category === 'Fiat' 
                                        ? 'text-blue-600' 
                                        : asset.category === 'Stablecoin'
                                        ? 'text-green-600'
                                        : 'text-yellow-600'
                                    }
                                  >
                                    {asset.category}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">{asset.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {asset.description}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{asset.balance}</div>
                                <div className="text-sm text-muted-foreground">Available</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePriorityChange(asset.symbol);
                              }}
                              aria-label="Manage funding priority"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </Button>
                            <Switch
                              checked={asset.spendEnabled}
                              onCheckedChange={() => handleAssetToggle(asset.symbol)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No assets enabled for spending</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Disabled Assets */}
              {disabledAssets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Available Assets</CardTitle>
                    <CardDescription>
                      Enable these assets for card spending
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {disabledAssets.map((asset) => (
                      <div
                        key={asset.symbol}
                        className="p-4 border border-border rounded-lg opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{asset.symbol}</span>
                              <Badge variant="outline" className="text-xs">
                                {asset.category}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{asset.name}</div>
                            <div className="text-sm font-medium">{asset.balance} Available</div>
                          </div>
                          <Switch
                            checked={asset.spendEnabled}
                            onCheckedChange={() => handleAssetToggle(asset.symbol)}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary & Settings */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Selected Asset</span>
                    <span className="font-medium">{selectedAsset || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Available Balance</span>
                    <span className="font-medium">
                      {selectedAsset 
                        ? assets.find(a => a.symbol === selectedAsset)?.balance || '0.00'
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Card Status</span>
                    <Badge variant="secondary" className="text-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={!selectedAsset}
                    className="w-full"
                    size="lg"
                  >
                    Continue
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Spending Rules</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      Assets are charged in priority order. If the primary asset has insufficient balance, the next asset will be used.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Limit:</span>
                      <span className="font-medium">$5,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Limit:</span>
                      <span className="font-medium">$50,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Used Today:</span>
                      <span className="font-medium">$125.50</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Limits
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSpend;