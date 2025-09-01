import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, ArrowUpDown, Settings, Info, CheckCircle2, User } from 'lucide-react';
import Navigation from '@/components/Navigation';

const CardSpend = () => {
  const [selectedCard, setSelectedCard] = useState('card1');
  const [fundingAsset, setFundingAsset] = useState('');
  const [availableAssets, setAvailableAssets] = useState<Record<string, boolean>>({
    USD: true,
    USDC: true,
    USDT: false,
    XAU: true,
    XAG: false,
    PAXG: true,
  });

  const cards = [
    {
      id: 'card1',
      holder: 'John Doe',
      lastFour: '0234',
      type: 'Personal',
      status: 'Active',
    },
    {
      id: 'card2',
      holder: 'ACME Plumbing',
      lastFour: '5498',
      type: 'Business',
      status: 'Active',
    },
  ];

  const assets = [
    {
      symbol: 'USD',
      name: 'US Dollar',
      balance: '5,420.50',
      category: 'Fiat',
      description: 'Primary spending currency'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '3,200.00',
      category: 'Stablecoin',
      description: 'Digital dollar alternative'
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      balance: '1,850.75',
      category: 'Stablecoin',
      description: 'Stable value cryptocurrency'
    },
    {
      symbol: 'XAU',
      name: 'Gold (XAU)',
      balance: '2.45',
      category: 'Precious Metal',
      description: 'Gold-backed spending'
    },
    {
      symbol: 'XAG',
      name: 'Silver (XAG)',
      balance: '150.80',
      category: 'Precious Metal',
      description: 'Silver-backed spending'
    },
    {
      symbol: 'PAXG',
      name: 'Pax Gold',
      balance: '1.25',
      category: 'Precious Metal',
      description: 'Tokenized gold'
    },
  ];

  const handleAssetToggle = (symbol: string) => {
    setAvailableAssets(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
    // If we disable the currently selected funding asset, clear it
    if (fundingAsset === symbol && !availableAssets[symbol]) {
      setFundingAsset('');
    }
  };

  const handleContinue = () => {
    if (!selectedCard || !fundingAsset) return;
    // Stub: would navigate to card confirmation page
    console.log('Continue with card:', selectedCard, 'funding asset:', fundingAsset);
  };

  const enabledAssets = assets.filter(asset => availableAssets[asset.symbol]);
  const selectedCardData = cards.find(card => card.id === selectedCard);
  const selectedAssetData = assets.find(asset => asset.symbol === fundingAsset);

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
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Select Card</span>
                  </CardTitle>
                  <CardDescription>
                    Choose which card to configure spending for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCard === card.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedCard(card.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{card.holder}</div>
                              <div className="text-sm text-muted-foreground">
                                Card ending ••{card.lastFour}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {card.type}
                            </Badge>
                            <Badge variant="secondary" className="text-green-600">
                              {card.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Funding Asset Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Funding Asset</CardTitle>
                  <CardDescription>
                    Select exactly one asset to fund transactions (priority order applies if multiple enabled)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={fundingAsset} onValueChange={setFundingAsset}>
                    <div className="space-y-3">
                      {enabledAssets.map((asset) => (
                        <div key={asset.symbol} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <RadioGroupItem value={asset.symbol} id={asset.symbol} />
                          <Label htmlFor={asset.symbol} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold">{asset.symbol}</span>
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
                                <div className="text-xs text-muted-foreground">{asset.description}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{asset.balance}</div>
                                <div className="text-sm text-muted-foreground">Available</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  
                  {enabledAssets.length === 0 && (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No assets enabled for spending</p>
                      <p className="text-sm text-muted-foreground">Enable assets below to use them for funding</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Assets */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Assets</CardTitle>
                  <CardDescription>
                    Toggle which assets can be used for card spending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assets.map((asset) => (
                    <div
                      key={asset.symbol}
                      className={`p-4 border rounded-lg transition-opacity ${
                        availableAssets[asset.symbol] ? 'border-border' : 'border-border opacity-60'
                      }`}
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
                          checked={availableAssets[asset.symbol]}
                          onCheckedChange={() => handleAssetToggle(asset.symbol)}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Summary & Settings */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Selected Card</span>
                    <span className="font-medium text-sm">
                      {selectedCardData ? `••${selectedCardData.lastFour}` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Funding Asset</span>
                    <span className="font-medium">{fundingAsset || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Available Balance</span>
                    <span className="font-medium">
                      {selectedAssetData?.balance || '0.00'}
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
                    disabled={!selectedCard || !fundingAsset}
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
                      If the selected funding asset has insufficient balance, the transaction will be declined.
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