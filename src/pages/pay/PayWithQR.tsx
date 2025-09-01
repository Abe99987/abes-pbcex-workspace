import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, Camera, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import Navigation from '@/components/Navigation';

const PayWithQR = () => {
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [scannedData, setScannedData] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockQRData = {
    payee: 'Alice Johnson (@alice_pbcex)',
    asset: 'USDC',
    amount: '25.00',
    memo: 'Coffee payment',
    expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setCameraPermission('granted');
      // In a real app, you'd start the QR scanner here
      setTimeout(() => {
        setScannedData(mockQRData); // Mock successful scan
      }, 2000);
    } catch (error) {
      setCameraPermission('denied');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock QR code processing
      setTimeout(() => {
        setScannedData(mockQRData);
      }, 1000);
    }
  };

  const handleManualCode = () => {
    if (manualCode.trim()) {
      // Mock manual code processing
      setScannedData(mockQRData);
    }
  };

  const handleApprovePayment = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmPayment = () => {
    // Stub: would make API call here
    console.log('QR payment confirmed:', scannedData);
    setConfirmationOpen(false);
    setScannedData(null);
    setManualCode('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Pay with QR Code</h1>
            <p className="text-muted-foreground">Scan a QR code to make a payment</p>
          </div>

          {!scannedData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>Scan Payment QR Code</span>
                </CardTitle>
                <CardDescription>
                  Use your camera to scan a QR code or upload an image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Camera Scanner */}
                <div className="text-center space-y-4">
                  {cameraPermission === 'prompt' && (
                    <div className="p-8 border-2 border-dashed border-border rounded-lg">
                      <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">Camera Scanner</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Allow camera access to scan QR codes
                      </p>
                      <Button onClick={requestCameraPermission}>
                        <Camera className="w-4 h-4 mr-2" />
                        Enable Camera
                      </Button>
                    </div>
                  )}

                  {cameraPermission === 'granted' && (
                    <div className="p-8 border-2 border-primary rounded-lg bg-primary/5">
                      <div className="animate-pulse">
                        <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
                        <p className="text-primary font-medium">Camera active - Point at QR code</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Position the QR code within the viewfinder
                        </p>
                      </div>
                    </div>
                  )}

                  {cameraPermission === 'denied' && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Camera access denied. Please use the upload option below or enable camera permissions in your browser settings.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Upload Option */}
                <div className="text-center">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-background text-muted-foreground">or</span>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div className="p-6 border border-border rounded-lg">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Upload QR Image</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select an image file containing a QR code
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      aria-label="Upload QR code image"
                    />
                  </div>
                </div>

                {/* Manual Entry */}
                <div className="text-center">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-background text-muted-foreground">or</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="manual-code">Enter Code Manually</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="manual-code"
                      placeholder="Paste or type payment code"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="flex-1"
                      aria-label="Manual payment code"
                    />
                    <Button
                      onClick={handleManualCode}
                      disabled={!manualCode.trim()}
                    >
                      Process
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Payment Summary */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Payment Details</span>
                </CardTitle>
                <CardDescription>
                  Review the payment information before confirming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pay to:</span>
                    <span className="font-medium">{scannedData.payee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      {scannedData.amount} {scannedData.asset}
                    </span>
                  </div>
                  {scannedData.memo && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Memo:</span>
                      <span className="font-medium">{scannedData.memo}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="text-sm text-orange-600">
                      {scannedData.expires.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="w-4 h-4" />
                  <AlertDescription>
                    Payment details verified. This transaction will be processed instantly.
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScannedData(null);
                      setManualCode('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApprovePayment}
                    className="flex-1"
                    size="lg"
                  >
                    Approve & Pay
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this payment?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {scannedData?.amount} {scannedData?.asset}
                </div>
                <div className="text-muted-foreground">to {scannedData?.payee}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayWithQR;