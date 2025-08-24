import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Globe, QrCode, Wifi, CreditCard, Shield } from "lucide-react";

const GlobalPayments = () => {
  const features = [
    {
      icon: <Send className="w-8 h-8 text-gold" />,
      title: "Send/Pay",
      description: "Transfer balances worldwide in gold, silver, FX, or stablecoins with instant settlement and competitive exchange rates across all major currencies."
    },
    {
      icon: <Globe className="w-8 h-8 text-silver" />,
      title: "Settlement Rails",
      description: "Integrated with FX rails, SWIFT, and eventually PBCEx Layer-2 for instant low-cost settlement with traditional banking infrastructure."
    },
    {
      icon: <QrCode className="w-8 h-8 text-blue-500" />,
      title: "QR & Offline Payments",
      description: "Pay with QR codes or cash agents; transactions sync once online, enabling payments even in areas with limited internet connectivity."
    }
  ];

  const paymentMethods = [
    { name: "Bank Transfer", fee: "0.1%", time: "1-2 days" },
    { name: "Gold Transfer", fee: "0.05%", time: "Instant" },
    { name: "QR Payment", fee: "0.2%", time: "Instant" },
    { name: "SWIFT Wire", fee: "$15", time: "2-5 days" },
    { name: "Crypto Payment", fee: "0.3%", time: "5-15 min" },
    { name: "Cash Agent", fee: "1.5%", time: "Instant" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-gold-light rounded-2xl flex items-center justify-center">
                <Send className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Global Payments
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Send money anywhere in the world using gold, silver, traditional currencies, or digital assets with competitive rates and instant settlement.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <CreditCard className="w-8 h-8 text-gold" />
                  <h2 className="text-2xl font-bold">Payment Methods</h2>
                </div>
                <Card className="bg-gradient-to-br from-muted/20 to-muted/5 border-gold/20">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {paymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <span className="font-medium">{method.name}</span>
                          <div className="text-right text-sm">
                            <div className="font-medium">{method.fee}</div>
                            <div className="text-muted-foreground">{method.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="w-8 h-8 text-silver" />
                  <h2 className="text-2xl font-bold">Secure & Compliant</h2>
                </div>
                <div className="space-y-6 text-muted-foreground">
                  <p>
                    All payments are processed through our compliant infrastructure with full AML/KYC verification. Your transactions are protected by bank-grade security and regulatory oversight across multiple jurisdictions.
                  </p>
                  <p>
                    Whether you're sending remittances to family abroad, paying for international business transactions, or settling trades, PBCEx provides the security and reliability you need.
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <div className="text-2xl font-bold text-gold">200+</div>
                      <div className="text-sm">Countries</div>
                    </div>
                    <div className="text-center p-4 bg-muted/20 rounded-lg">
                      <div className="text-2xl font-bold text-silver">24/7</div>
                      <div className="text-sm">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Capabilities */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <Card className="bg-gradient-to-br from-muted/20 to-muted/5 border-silver/20">
                <CardContent className="p-8">
                  <div className="text-center">
                    <Wifi className="w-16 h-16 mx-auto mb-4 text-silver" />
                    <h3 className="text-xl font-semibold mb-2">Works Offline</h3>
                    <p className="text-muted-foreground">
                      Create and sign transactions offline, then broadcast when connectivity returns. Perfect for remote areas or travel.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div>
                <h2 className="text-2xl font-bold mb-6">Always Connected</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Our payment system works even when you don't have internet access. Prepare transactions offline, use QR codes for local payments, or work with cash agents who can process payments on your behalf.
                  </p>
                  <p>
                    Once connectivity is restored, all transactions automatically sync with the network, ensuring your payments are processed securely and efficiently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GlobalPayments;