import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Mail, MessageSquare, Truck, DollarSign, ShoppingCart, CheckCircle, XCircle } from "lucide-react";

/**
 * Development Integrations Test Page
 * FOR INTERNAL TESTING ONLY - Tree-shaken out in production
 */

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const DevIntegrations = () => {
  // Email testing state
  const [emailTo, setEmailTo] = useState('dev@pbcex.com');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<ApiResponse | null>(null);

  // Verify testing state  
  const [verifyPhone, setVerifyPhone] = useState('+15555551234');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ApiResponse | null>(null);
  const [codeCheckResult, setCodeCheckResult] = useState<ApiResponse | null>(null);

  // FedEx testing state
  const [fedexLoading, setFedexLoading] = useState(false);
  const [fedexRatesResult, setFedexRatesResult] = useState<ApiResponse | null>(null);
  const [fedexLabelResult, setFedexLabelResult] = useState<ApiResponse | null>(null);

  // Price testing state
  const [priceSymbol, setPriceSymbol] = useState('PAXG');
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceResult, setPriceResult] = useState<ApiResponse | null>(null);

  // Checkout testing state
  const [checkoutSymbol, setCheckoutSymbol] = useState('PAXG');
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [checkoutSide, setCheckoutSide] = useState<'buy' | 'sell'>('buy');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutQuoteResult, setCheckoutQuoteResult] = useState<ApiResponse | null>(null);
  const [checkoutConfirmResult, setCheckoutConfirmResult] = useState<ApiResponse | null>(null);

  const apiCall = async (url: string, options?: RequestInit): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-bypass': 'true', // Skip rate limiting in dev
          ...options?.headers,
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const testEmail = async () => {
    setEmailLoading(true);
    const result = await apiCall('/email/test', {
      method: 'POST',
      body: JSON.stringify({ to: emailTo }),
    });
    setEmailResult(result);
    setEmailLoading(false);
  };

  const startVerification = async () => {
    setVerifyLoading(true);
    const result = await apiCall('/auth/verify/start', {
      method: 'POST',
      body: JSON.stringify({ phone: verifyPhone }),
    });
    setVerifyResult(result);
    setVerifyLoading(false);
  };

  const checkVerification = async () => {
    if (!verifyCode) return;
    
    setVerifyLoading(true);
    const result = await apiCall('/auth/verify/check', {
      method: 'POST',
      body: JSON.stringify({ phone: verifyPhone, code: verifyCode }),
    });
    setCodeCheckResult(result);
    setVerifyLoading(false);
  };

  const testFedexRates = async () => {
    setFedexLoading(true);
    const result = await apiCall('/fedex/rates', {
      method: 'POST',
      body: JSON.stringify({
        shipperAddress: {
          streetLines: ['1600 Amphitheatre Parkway'],
          city: 'Mountain View',
          stateOrProvinceCode: 'CA',
          postalCode: '94043',
          countryCode: 'US',
        },
        recipientAddress: {
          streetLines: ['1 Hacker Way'],
          city: 'Menlo Park',
          stateOrProvinceCode: 'CA',
          postalCode: '94025',
          countryCode: 'US',
        },
        packages: [{
          weight: { value: 5, units: 'LB' },
          dimensions: { length: 12, width: 8, height: 6, units: 'IN' },
        }],
      }),
    });
    setFedexRatesResult(result);
    setFedexLoading(false);
  };

  const testFedexLabel = async () => {
    setFedexLoading(true);
    const result = await apiCall('/fedex/ship/label', {
      method: 'POST',
      body: JSON.stringify({
        shipper: {
          address: {
            streetLines: ['1600 Amphitheatre Parkway'],
            city: 'Mountain View',
            stateOrProvinceCode: 'CA',
            postalCode: '94043',
            countryCode: 'US',
          },
          contact: {
            personName: 'Test Shipper',
            companyName: 'PBCEx Dev',
            phoneNumber: '650-555-0001',
            emailAddress: 'dev@pbcex.com',
          },
        },
        recipient: {
          address: {
            streetLines: ['1 Hacker Way'],
            city: 'Menlo Park',
            stateOrProvinceCode: 'CA',
            postalCode: '94025',
            countryCode: 'US',
          },
          contact: {
            personName: 'Test Recipient',
            companyName: 'Test Company',
            phoneNumber: '650-555-0002',
            emailAddress: 'test@example.com',
          },
        },
        packages: [{
          weight: { value: 5, units: 'LB' },
          dimensions: { length: 12, width: 8, height: 6, units: 'IN' },
          customerReference: 'DEV-TEST-001',
        }],
        serviceType: 'FEDEX_GROUND',
      }),
    });
    setFedexLabelResult(result);
    setFedexLoading(false);
  };

  const testPrice = async () => {
    setPriceLoading(true);
    const result = await apiCall(`/prices/${priceSymbol}`);
    setPriceResult(result);
    setPriceLoading(false);
  };

  const testCheckoutQuote = async () => {
    setCheckoutLoading(true);
    const result = await apiCall('/checkout/price-lock/quote', {
      method: 'POST',
      body: JSON.stringify({
        symbol: checkoutSymbol,
        quantity: checkoutQuantity,
        side: checkoutSide,
      }),
    });
    setCheckoutQuoteResult(result);
    setCheckoutLoading(false);
  };

  const confirmCheckout = async () => {
    if (!checkoutQuoteResult?.data?.id) return;
    
    setCheckoutLoading(true);
    const result = await apiCall('/checkout/confirm', {
      method: 'POST',
      body: JSON.stringify({ quoteId: checkoutQuoteResult.data.id }),
    });
    setCheckoutConfirmResult(result);
    setCheckoutLoading(false);
  };

  const ResultDisplay = ({ result, title }: { result: ApiResponse | null; title: string }) => (
    result && (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="font-medium">{title}</span>
        </div>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-48">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Integration Testing</h1>
          </div>
          <Badge variant="destructive" className="text-sm px-3 py-1">
            FOR INTERNAL TESTING ONLY
          </Badge>
          <p className="text-gray-600 mt-2">
            Development environment integration testing dashboard
          </p>
        </div>

        <Alert className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This page is only available in development mode and will be automatically excluded from production builds.
            All API calls include development bypass headers for rate limiting.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="verify">2FA Verify</TabsTrigger>
            <TabsTrigger value="fedex">FedEx</TabsTrigger>
            <TabsTrigger value="prices">Prices</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
          </TabsList>

          {/* Email Testing */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Resend Email Service
                </CardTitle>
                <CardDescription>
                  Test email functionality using Resend API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email-to">Email Address</Label>
                  <Input
                    id="email-to"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="dev@pbcex.com"
                  />
                </div>
                <Button onClick={testEmail} disabled={emailLoading}>
                  {emailLoading ? 'Sending...' : 'Send Test Email'}
                </Button>
                <ResultDisplay result={emailResult} title="Email Result" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verify Testing */}
          <TabsContent value="verify">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Twilio Verify (2FA)
                </CardTitle>
                <CardDescription>
                  Test SMS verification functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="verify-phone">Phone Number</Label>
                  <Input
                    id="verify-phone"
                    type="tel"
                    value={verifyPhone}
                    onChange={(e) => setVerifyPhone(e.target.value)}
                    placeholder="+15555551234"
                  />
                </div>
                <Button onClick={startVerification} disabled={verifyLoading}>
                  {verifyLoading ? 'Sending...' : 'Start Verification'}
                </Button>
                <ResultDisplay result={verifyResult} title="Verification Started" />
                
                <Separator />
                
                <div>
                  <Label htmlFor="verify-code">Verification Code</Label>
                  <Input
                    id="verify-code"
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="123456"
                    maxLength={8}
                  />
                </div>
                <Button onClick={checkVerification} disabled={verifyLoading || !verifyCode}>
                  Check Verification Code
                </Button>
                <ResultDisplay result={codeCheckResult} title="Code Check Result" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* FedEx Testing */}
          <TabsContent value="fedex">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  FedEx Shipping
                </CardTitle>
                <CardDescription>
                  Test FedEx rates and label generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={testFedexRates} disabled={fedexLoading}>
                    {fedexLoading ? 'Loading...' : 'Get Shipping Rates'}
                  </Button>
                  <Button onClick={testFedexLabel} disabled={fedexLoading}>
                    {fedexLoading ? 'Loading...' : 'Generate Shipping Label'}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Shipping Rates</h4>
                    <ResultDisplay result={fedexRatesResult} title="Rates Result" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Shipping Label</h4>
                    <ResultDisplay result={fedexLabelResult} title="Label Result" />
                    {fedexLabelResult?.success && fedexLabelResult.data?.labelUrl && (
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`http://localhost:3000${fedexLabelResult.data.labelUrl.replace('/Users/ebraheimsalem/Documents/GitHub/abes-pbcex-workspace/backend', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download Label
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prices Testing */}
          <TabsContent value="prices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Price Service
                </CardTitle>
                <CardDescription>
                  Test CoinGecko price feeds with Redis caching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="price-symbol">Symbol</Label>
                  <Input
                    id="price-symbol"
                    value={priceSymbol}
                    onChange={(e) => setPriceSymbol(e.target.value.toUpperCase())}
                    placeholder="PAXG"
                  />
                </div>
                <Button onClick={testPrice} disabled={priceLoading}>
                  {priceLoading ? 'Loading...' : 'Get Price'}
                </Button>
                <ResultDisplay result={priceResult} title="Price Result" />
                
                {priceResult?.success && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Price Summary</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Symbol:</strong> {priceResult.data.symbol}</p>
                      <p><strong>Price:</strong> ${priceResult.data.usd}</p>
                      <p><strong>Source:</strong> {priceResult.data.source}</p>
                      <p><strong>Last Updated:</strong> {priceResult.data.lastUpdated}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checkout Testing */}
          <TabsContent value="checkout">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Checkout Price-Lock
                </CardTitle>
                <CardDescription>
                  Test price-lock quotes and confirmations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="checkout-symbol">Symbol</Label>
                    <Input
                      id="checkout-symbol"
                      value={checkoutSymbol}
                      onChange={(e) => setCheckoutSymbol(e.target.value.toUpperCase())}
                      placeholder="PAXG"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout-quantity">Quantity</Label>
                    <Input
                      id="checkout-quantity"
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={checkoutQuantity}
                      onChange={(e) => setCheckoutQuantity(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout-side">Side</Label>
                    <select 
                      id="checkout-side"
                      className="w-full p-2 border rounded"
                      value={checkoutSide}
                      onChange={(e) => setCheckoutSide(e.target.value as 'buy' | 'sell')}
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={testCheckoutQuote} disabled={checkoutLoading}>
                    {checkoutLoading ? 'Loading...' : 'Get Price Quote'}
                  </Button>
                  <Button 
                    onClick={confirmCheckout} 
                    disabled={checkoutLoading || !checkoutQuoteResult?.data?.id}
                    variant="outline"
                  >
                    Confirm Quote
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Price Quote</h4>
                    <ResultDisplay result={checkoutQuoteResult} title="Quote Result" />
                    {checkoutQuoteResult?.success && (
                      <div className="bg-green-50 p-4 rounded-lg mt-2">
                        <div className="text-sm space-y-1">
                          <p><strong>Locked Price:</strong> ${checkoutQuoteResult.data.lockedPrice}</p>
                          <p><strong>Total Amount:</strong> ${checkoutQuoteResult.data.totalAmount}</p>
                          <p><strong>Expires:</strong> {checkoutQuoteResult.data.expiresAtISO}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Confirmation</h4>
                    <ResultDisplay result={checkoutConfirmResult} title="Confirmation Result" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DevIntegrations;
