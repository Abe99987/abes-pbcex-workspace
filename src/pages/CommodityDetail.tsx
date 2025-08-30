import { useParams } from 'react-router-dom';
import { useCommodityMeta } from '@/hooks/useCommodityMeta';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Package, Send, Upload, Truck, TrendingUp, TrendingDown } from 'lucide-react';
import CommoditySpecs from '@/components/shop/CommoditySpecs';
import CommodityTradeInfo from '@/components/shop/CommodityTradeInfo';
import Navigation from '@/components/Navigation';

// Mock price data - in real app this would come from API
const mockPrices: Record<string, { price: string; change: string; isPositive: boolean; icon: string }> = {
  XAU: { price: '$2,048.50', change: '+1.2%', isPositive: true, icon: '🥇' },
  XAG: { price: '$24.85', change: '+0.8%', isPositive: true, icon: '🥈' },
  XPT: { price: '$924.80', change: '+0.6%', isPositive: true, icon: '⚪' },
  XPD: { price: '$1,156.30', change: '+2.1%', isPositive: true, icon: '⚫' },
  XCU: { price: '$8,450.00', change: '+1.5%', isPositive: true, icon: '🟤' },
};

const CommodityDetail = () => {
  const { symbol } = useParams();
  
  if (!symbol) {
    return <div>Invalid commodity symbol</div>;
  }

  let meta;
  let priceData;
  
  try {
    meta = useCommodityMeta(symbol);
    priceData = mockPrices[symbol.toUpperCase()];
  } catch (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Commodity Not Found</h1>
            <p className="text-muted-foreground">The commodity '{symbol}' was not found.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!priceData) {
    priceData = { price: 'N/A', change: '0%', isPositive: true, icon: '📦' };
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{priceData.icon}</div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {meta.displayName} ({meta.symbol})
                  </h1>
                  <p className="text-muted-foreground">{meta.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary mb-1">
                  {priceData.price}
                </div>
                <Badge variant={priceData.isPositive ? 'default' : 'destructive'} className="flex items-center space-x-1">
                  {priceData.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{priceData.change}</span>
                </Badge>
                <Badge variant="secondary" className="mt-2">
                  {meta.volatilityClass}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Button variant="outline" className="h-12">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Buy
              </Button>
              <Button variant="outline" className="h-12">
                <Package className="w-5 h-5 mr-2" />
                Sell
              </Button>
              <Button variant="premium" className="h-12 bg-black text-white hover:bg-black/90">
                <Truck className="w-5 h-5 mr-2" />
                Order
              </Button>
              <Button variant="outline" className="h-12">
                <Send className="w-5 h-5 mr-2" />
                Send
              </Button>
              <Button variant="outline" className="h-12">
                <Upload className="w-5 h-5 mr-2" />
                Deposit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Advanced Orders</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 justify-start">
                Make a Limit Order
              </Button>
              <Button variant="outline" className="h-12 justify-start">
                Make a Barter Order
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Detailed Information */}
        <Tabs defaultValue="specs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="specs">Specs</TabsTrigger>
            <TabsTrigger value="trade-info">Trade Info</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="specs">
            <Card>
              <CardContent className="p-0">
                <CommoditySpecs meta={meta} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trade-info">
            <Card>
              <CardContent className="p-0">
                <CommodityTradeInfo meta={meta} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Documents</h3>
                {meta.documents.length > 0 ? (
                  <div className="space-y-2">
                    {meta.documents.map((doc, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="text-sm font-medium">{doc.title}</span>
                        <Badge variant="outline">{doc.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No documents available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Notes */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Delivery:</strong> {meta.deliverySLA.domestic} (domestic), {meta.deliverySLA.international} (international)
              </p>
              <p>
                <strong>Insurance:</strong> {meta.insuranceIncluded ? 'Fully insured' : 'Insurance optional'} via {meta.carriers.join(' or ')}
              </p>
              <p>
                <strong>Custody:</strong> {meta.custodyModel}
              </p>
              <p>
                <strong>Price Lock:</strong> Honored for {meta.priceLockWindowMins} minutes after checkout
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommodityDetail;