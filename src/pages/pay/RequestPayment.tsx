import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QrCode, Copy, Mail, Share2, Calendar, DollarSign, Clock, Users, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

const RequestPayment = () => {
  const [collectFrom, setCollectFrom] = useState('pbcex');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [requireMemo, setRequireMemo] = useState(false);
  const [allowPartials, setAllowPartials] = useState(false);
  const [expiration, setExpiration] = useState('');
  const [requestGenerated, setRequestGenerated] = useState(false);
  const { toast } = useToast();

  const assets = [
    { symbol: 'USD', name: 'US Dollar' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'XAU', name: 'Gold (XAU)' },
    { symbol: 'XAG', name: 'Silver (XAG)' },
    { symbol: 'PAXG', name: 'Pax Gold' },
  ];

  const expirationOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'never', label: 'Never' },
  ];

  const isPbcExFormValid = collectFrom === 'pbcex' && recipientAccount.trim() && recipientName.trim() && asset && amount && parseFloat(amount) > 0;
  const isExternalFormValid = collectFrom === 'external' && recipientEmail.trim() && asset && amount && parseFloat(amount) > 0;
  const isFormValid = isPbcExFormValid || isExternalFormValid;

  const generateRequest = () => {
    if (!isFormValid) return;
    setRequestGenerated(true);
  };

  const copyPaymentLink = async () => {
    const link = `https://pbcex.com/pay?request=req_${Date.now()}&asset=${asset}&amount=${amount}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied",
        description: "Payment request link copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const shareRequest = async () => {
    const link = `https://pbcex.com/pay?request=req_${Date.now()}&asset=${asset}&amount=${amount}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PBCEx Payment Request',
          text: `Payment request for ${amount} ${asset}`,
          url: link,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyPaymentLink();
    }
  };

  const sendByEmail = () => {
    const subject = encodeURIComponent(`Payment Request - ${amount} ${asset}`);
    const body = encodeURIComponent(`
Hi,

I'm requesting a payment of ${amount} ${asset} through PBCEx.

${memo ? `Note: ${memo}` : ''}

Please use the following link to complete the payment:
https://pbcex.com/pay?request=req_${Date.now()}&asset=${asset}&amount=${amount}

Thank you!
    `);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const downloadQR = () => {
    // In a real app, this would generate and download the QR code
    toast({
      title: "QR Code Downloaded",
      description: "Payment request QR code saved to your device",
    });
  };

  const resetForm = () => {
    setRequestGenerated(false);
    setCollectFrom('pbcex');
    setRecipientAccount('');
    setRecipientName('');
    setRecipientEmail('');
    setAsset('');
    setAmount('');
    setMemo('');
    setRequireMemo(false);
    setAllowPartials(false);
    setExpiration('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Request a Payment</h1>
            <p className="text-muted-foreground">Generate a link or QR to request money</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Request Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Payment Request Details</span>
                  </CardTitle>
                  <CardDescription>
                    Configure your payment request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Collect From Choice */}
                  <div className="space-y-3">
                    <Label>Collect From *</Label>
                    <RadioGroup value={collectFrom} onValueChange={setCollectFrom}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pbcex" id="pbcex" />
                        <Label htmlFor="pbcex" className="flex items-center space-x-2 cursor-pointer">
                          <Users className="w-4 h-4" />
                          <span>PBCEx User</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="external" id="external" />
                        <Label htmlFor="external" className="flex items-center space-x-2 cursor-pointer">
                          <Link className="w-4 h-4" />
                          <span>External via Link/Email</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* PBCEx User Fields */}
                  {collectFrom === 'pbcex' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient-account">Recipient Account Number *</Label>
                        <Input
                          id="recipient-account"
                          placeholder="PBCEx account number"
                          value={recipientAccount}
                          onChange={(e) => setRecipientAccount(e.target.value)}
                          aria-label="Recipient account number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient-name">Recipient Name *</Label>
                        <Input
                          id="recipient-name"
                          placeholder="Full name"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          aria-label="Recipient name"
                        />
                      </div>
                    </div>
                  )}

                  {/* External Fields */}
                  {collectFrom === 'external' && (
                    <div className="space-y-2">
                      <Label htmlFor="recipient-email">Email *</Label>
                      <Input
                        id="recipient-email"
                        type="email"
                        placeholder="payer@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        aria-label="Recipient email"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset">Asset *</Label>
                      <Select value={asset} onValueChange={setAsset}>
                        <SelectTrigger id="asset" aria-label="Select asset">
                          <SelectValue placeholder="Choose asset" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.map((a) => (
                            <SelectItem key={a.symbol} value={a.symbol}>
                              {a.symbol} - {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                        aria-label="Request amount"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memo">Description/Memo</Label>
                    <Textarea
                      id="memo"
                      placeholder="What is this payment for?"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      rows={3}
                      aria-label="Payment description"
                    />
                  </div>

                  <div className="space-y-4">
                    {collectFrom === 'pbcex' && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="require-memo">Require memo from payer</Label>
                        <Switch
                          id="require-memo"
                          checked={requireMemo}
                          onCheckedChange={setRequireMemo}
                        />
                      </div>
                    )}

                    {collectFrom === 'external' && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allow-partials">Allow partial payments</Label>
                        <Switch
                          id="allow-partials"
                          checked={allowPartials}
                          onCheckedChange={setAllowPartials}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiration</Label>
                    <Select value={expiration} onValueChange={setExpiration}>
                      <SelectTrigger id="expiration" aria-label="Select expiration">
                        <SelectValue placeholder="When should this expire?" />
                      </SelectTrigger>
                      <SelectContent>
                        {expirationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={generateRequest}
                    disabled={!isFormValid}
                    className="w-full"
                    size="lg"
                  >
                    {collectFrom === 'pbcex' ? 'Create Request' : 'Generate Payment Link'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Generated Request */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Your Payment Request</CardTitle>
                  <CardDescription>
                    {collectFrom === 'pbcex' 
                      ? 'Internal request created for PBCEx user'
                      : 'Share this link with people who need to pay you'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {requestGenerated && isFormValid ? (
                    <>
                      {collectFrom === 'pbcex' ? (
                        /* PBCEx User Success */
                        <div className="text-center space-y-4">
                          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-green-600 mb-2">
                              <Users className="w-8 h-8 mx-auto" />
                            </div>
                            <div className="text-lg font-semibold text-green-800">Request Created</div>
                            <div className="text-green-700">Request ID: REQ-{Date.now()}</div>
                          </div>
                          
                          <div className="p-4 bg-muted rounded-lg space-y-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {amount} {asset}
                              </div>
                              <div className="text-muted-foreground">from {recipientName}</div>
                              <div className="text-sm text-muted-foreground">Account: {recipientAccount}</div>
                            </div>
                            
                            {memo && (
                              <div className="text-center text-sm border-t border-border pt-3">
                                <span className="text-muted-foreground">For: </span>
                                <span>{memo}</span>
                              </div>
                            )}
                          </div>

                          {/* Mini QR for sharing */}
                          <div className="text-center">
                            <div className="mx-auto w-32 h-32 bg-white p-2 rounded-lg border">
                              <div className="w-full h-full bg-black flex items-center justify-center">
                                <div className="grid grid-cols-6 gap-px p-1">
                                  {Array.from({ length: 36 }, (_, i) => (
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
                            <p className="text-xs text-muted-foreground mt-2">Shareable QR</p>
                          </div>
                        </div>
                      ) : (
                        /* External Link Success */
                        <>
                          {/* QR Code Placeholder */}
                          <div className="text-center">
                            <div className="mx-auto w-48 h-48 bg-white p-4 rounded-lg border">
                              <div className="w-full h-full bg-black flex items-center justify-center">
                                <div className="grid grid-cols-8 gap-1 p-2">
                                  {/* Mock QR code pattern */}
                                  {Array.from({ length: 64 }, (_, i) => (
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
                          </div>

                          {/* Request Summary */}
                          <div className="p-4 bg-muted rounded-lg space-y-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {amount} {asset}
                              </div>
                              <div className="text-muted-foreground">Payment Request</div>
                              <div className="text-sm text-muted-foreground">to {recipientEmail}</div>
                            </div>
                            
                            {memo && (
                              <div className="text-center text-sm border-t border-border pt-3">
                                <span className="text-muted-foreground">For: </span>
                                <span>{memo}</span>
                              </div>
                            )}

                            <div className="flex justify-center space-x-4 text-xs text-muted-foreground border-t border-border pt-3">
                              {allowPartials && (
                                <Badge variant="outline" className="text-xs">
                                  Partials OK
                                </Badge>
                              )}
                              {expiration && expiration !== 'never' && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Expires in {expirationOptions.find(e => e.value === expiration)?.label}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Share Actions */}
                          <div className="grid grid-cols-2 gap-3">
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
                              <QrCode className="w-4 h-4 mr-2" />
                              Download QR
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              onClick={sendByEmail}
                              className="w-full"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </Button>
                            <Button
                              variant="outline"
                              onClick={shareRequest}
                              className="w-full"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </>
                      )}

                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetForm}
                        >
                          Create New Request
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Request Generated</h3>
                      <p className="text-muted-foreground">
                        Fill out the form and click "Generate Payment Request" to create your request
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

export default RequestPayment;