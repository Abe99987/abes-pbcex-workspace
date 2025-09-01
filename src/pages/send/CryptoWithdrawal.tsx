import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, QrCode, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Navigation from '@/components/Navigation';

const CryptoWithdrawal = () => {
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [whitelistOnly, setWhitelistOnly] = useState(false);

  const assets = [
    { symbol: 'PAXG', name: 'Pax Gold', balance: '1.25', networks: ['ETH', 'BSC'] },
    { symbol: 'USDC', name: 'USD Coin', balance: '3,200.00', networks: ['ETH', 'TRON', 'BSC', 'POLYGON'] },
    { symbol: 'ETH', name: 'Ethereum', balance: '0.85', networks: ['ETH'] },
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.021', networks: ['BTC'] },
  ];

  const networks = [
    { id: 'ETH', name: 'Ethereum (ERC-20)', fee: '~$15', time: '5-15 min' },
    { id: 'TRON', name: 'Tron (TRC-20)', fee: '~$1', time: '1-3 min' },
    { id: 'BSC', name: 'BNB Smart Chain (BEP-20)', fee: '~$0.50', time: '1-3 min' },
    { id: 'POLYGON', name: 'Polygon (MATIC)', fee: '~$0.01', time: '1-2 min' },
    { id: 'BTC', name: 'Bitcoin Network', fee: '~$5-25', time: '30-60 min' },
  ];

  const selectedAssetData = assets.find(a => a.symbol === selectedAsset);
  const availableNetworks = selectedAssetData ? networks.filter(n => selectedAssetData.networks.includes(n.id)) : [];
  const selectedNetworkData = networks.find(n => n.id === selectedNetwork);

  const isFormValid = selectedAsset && selectedNetwork && address.length > 10 && amount && parseFloat(amount) > 0;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text);
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  const handleWithdraw = () => {
    // Stub: would make API call here
    console.log('Crypto withdrawal:', { selectedAsset, selectedNetwork, address, amount, whitelistOnly });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Crypto Withdrawal</h1>
            <p className="text-muted-foreground">Withdraw to an external crypto address. Choose network/chain.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="w-5 h-5" />
                    <span>Withdrawal Details</span>
                  </CardTitle>
                  <CardDescription>
                    Complete all fields to withdraw your crypto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Asset Selection */}
                  <div className="space-y-3">
                    <Label>Select Asset *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {assets.map((asset) => (
                        <div
                          key={asset.symbol}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAsset === asset.symbol
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => {
                            setSelectedAsset(asset.symbol);
                            setSelectedNetwork(''); // Reset network when asset changes
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{asset.symbol}</div>
                              <div className="text-sm text-muted-foreground">{asset.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{asset.balance}</div>
                              <div className="text-sm text-muted-foreground">Available</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Network Selection */}
                  {selectedAsset && (
                    <div className="space-y-3">
                      <Label>Select Network *</Label>
                      <div className="space-y-3">
                        {availableNetworks.map((network) => (
                          <div
                            key={network.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedNetwork === network.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedNetwork(network.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{network.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Fee: {network.fee} • Time: {network.time}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-green-600">
                                Online
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address Input */}
                  {selectedNetwork && (
                    <div className="space-y-2">
                      <Label htmlFor="address">Destination Address *</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="address"
                          placeholder={`Enter ${selectedNetwork} address`}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="flex-1"
                          aria-label="Destination crypto address"
                        />
                        <Button variant="outline" size="icon" onClick={handlePaste} aria-label="Paste address">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" aria-label="Scan QR code">
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Make sure this is a valid {selectedNetworkData?.name} address. 
                        {selectedNetwork === 'BTC' && ' Bitcoin addresses start with 1, 3, or bc1.'}
                        {selectedNetwork === 'ETH' && ' Ethereum addresses start with 0x.'}
                      </p>
                    </div>
                  )}

                  {/* Amount Input */}
                  {selectedAsset && selectedNetwork && (
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
                          aria-label="Withdrawal amount"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 text-xs"
                          onClick={() => {
                            if (selectedAssetData) {
                              setAmount(selectedAssetData.balance.replace(',', ''));
                            }
                          }}
                        >
                          MAX
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Network fee will be deducted: {selectedNetworkData?.fee || 'N/A'}
                      </p>
                    </div>
                  )}

                  {/* Additional Options */}
                  {selectedAsset && selectedNetwork && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="whitelist"
                          checked={whitelistOnly}
                          onCheckedChange={setWhitelistOnly}
                        />
                        <Label htmlFor="whitelist" className="text-sm">
                          Only allow whitelisted addresses (Optional)
                        </Label>
                      </div>

                      <Alert>
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          Double-check the address. Crypto transactions are irreversible.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Button onClick={handleWithdraw} disabled={!isFormValid} className="w-full" size="lg">
                    Withdraw {selectedAsset || 'Assets'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Asset</span>
                    <span className="font-medium">{selectedAsset || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium text-sm">{selectedNetworkData?.name || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="font-medium">{selectedNetworkData?.fee || 'TBD'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-lg font-semibold">
                    <span>You'll Receive</span>
                    <span>~{amount || '0.00'}</span>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Network Status: Online
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        ETA: {selectedNetworkData?.time || 'Variable'} after confirmation
                      </p>
                    </div>
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        Withdrawals are irreversible. Verify all details before proceeding.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoWithdrawal;