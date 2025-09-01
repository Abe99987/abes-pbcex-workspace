import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { QrCode, Copy, Download, Share2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

const ReceiveWithQR = () => {
  const [selectedAsset, setSelectedAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [fixedAmount, setFixedAmount] = useState(false);
  const [memo, setMemo] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const { toast } = useToast();

  const assets = [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USD', name: 'US Dollar' },
    { symbol: 'XAU', name: 'Gold (XAU)' },
    { symbol: 'XAG', name: 'Silver (XAG)' },
    { symbol: 'PAXG', name: 'Pax Gold' },
  ];

  const userInfo = {
    username: '@alice_pbcex',
    displayName: 'Alice Johnson',
    userId: 'alice.johnson@pbcex.com'
  };

  const generateQR = () => {
    if (!selectedAsset) return;
    setQrGenerated(true);
  };

  const copyPaymentLink = async () => {
    const link = `https://pbcex.com/pay?to=${userInfo.username}&asset=${selectedAsset}&amount=${amount}&memo=${encodeURIComponent(memo)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied",
        description: "Payment link copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const downloadQR = () => {
    // In a real app, this would generate and download the QR code image
    toast({
      title: "QR Code Downloaded",
      description: "QR code saved to your device",
    });
  };

  const sharePayment = async () => {
    const link = `https://pbcex.com/pay?to=${userInfo.username}&asset=${selectedAsset}&amount=${amount}&memo=${encodeURIComponent(memo)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PBCEx Payment Request',
          text: `${userInfo.displayName} is requesting a payment`,
          url: link,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyPaymentLink();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Receive with QR Code</h1>
            <p className="text-muted-foreground">Display your QR code or use camera to receive payments</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settings Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>
                    Configure your payment request details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset *</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger id="asset" aria-label="Select asset">
                        <SelectValue placeholder="Choose asset to receive" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            {asset.symbol} - {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fixed-amount">Fixed Amount</Label>
                      <Switch
                        id="fixed-amount"
                        checked={fixedAmount}
                        onCheckedChange={setFixedAmount}
                      />
                    </div>
                    
                    {fixedAmount && (
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          aria-label="Payment amount"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memo">Memo (Optional)</Label>
                    <Input
                      id="memo"
                      placeholder="Payment description..."
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      aria-label="Payment memo"
                    />
                  </div>

                  <Button
                    onClick={generateQR}
                    disabled={!selectedAsset}
                    className="w-full"
                    size="lg"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Manual Payment Info</span>
                  </CardTitle>
                  <CardDescription>
                    Share these details for manual transfers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Username:</span>
                      <span className="font-medium">{userInfo.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Display Name:</span>
                      <span className="font-medium">{userInfo.displayName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-sm">{userInfo.userId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Display */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Your Payment QR Code</CardTitle>
                  <CardDescription>
                    Others can scan this code to send you payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  {qrGenerated && selectedAsset ? (
                    <>
                      {/* QR Code Placeholder */}
                      <div className="mx-auto w-64 h-64 bg-white p-4 rounded-lg border">
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <div className="grid grid-cols-10 gap-1 p-4">
                            {/* Mock QR code pattern */}
                            {Array.from({ length: 100 }, (_, i) => (
                              <div
                                key={i}
                                className={`aspect-square ${
                                  Math.random() > 0.5 ? 'bg-white' : 'bg-black'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-lg font-semibold">{userInfo.displayName}</div>
                        <div className="text-muted-foreground">{userInfo.username}</div>
                        {fixedAmount && amount && (
                          <div className="text-primary font-bold mt-2">
                            {amount} {selectedAsset}
                          </div>
                        )}
                        {memo && (
                          <div className="text-sm text-muted-foreground mt-2">
                            "{memo}"
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          onClick={copyPaymentLink}
                          className="w-full"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          onClick={downloadQR}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          onClick={sharePayment}
                          className="w-full"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-16">
                      <QrCode className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No QR Code Generated</h3>
                      <p className="text-muted-foreground">
                        Select an asset and click "Generate QR Code" to create your payment QR code
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveWithQR;