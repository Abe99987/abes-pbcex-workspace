import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Shield, GraduationCap, MapPin, Fingerprint, Globe } from "lucide-react";

const MobileApp = () => {
  const features = [
    {
      icon: <Smartphone className="w-8 h-8 text-gold" />,
      title: "All-in-One Access",
      description: "Wallet, trading, global payments, and franchise onboarding — everything you need in one powerful mobile application with seamless user experience."
    },
    {
      icon: <Shield className="w-8 h-8 text-silver" />,
      title: "Cross-Platform Security",
      description: "OTP + biometric login, app-level encryption, and hardware security module integration ensure your assets are protected across all devices."
    },
    {
      icon: <GraduationCap className="w-8 h-8 text-blue-500" />,
      title: "Education First",
      description: "In-app tutorials and simulated trades to onboard new users, helping them understand asset-backed banking and precious metals trading."
    },
    {
      icon: <MapPin className="w-8 h-8 text-green-500" />,
      title: "Franchise Access",
      description: "Customers can locate and connect with nearby PBCEx branches for deposits, withdrawals, and physical redemption of precious metals."
    }
  ];

  const appFeatures = [
    "Real-time portfolio tracking",
    "Push notifications for trades",
    "Biometric authentication",
    "Offline transaction preparation",
    "Multi-currency support",
    "Educational content library",
    "Branch locator with GPS",
    "QR code payments",
    "Live market data",
    "Customer support chat"
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
                <Smartphone className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Mobile App
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Take your asset-backed banking with you anywhere. Trade precious metals, make global payments, and manage your wealth from your mobile device.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {features.map((feature, index) => (
                <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* App Features */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <Globe className="w-8 h-8 text-gold" />
                  <h2 className="text-2xl font-bold">Complete Feature Set</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {appFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full"></div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="bg-gradient-to-br from-muted/20 to-muted/5 border-gold/20">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-32 h-56 mx-auto bg-gradient-to-b from-gold/10 to-silver/10 rounded-3xl border-2 border-gold/20 flex items-center justify-center">
                      <div className="text-center">
                        <Smartphone className="w-12 h-12 mx-auto mb-2 text-gold" />
                        <div className="text-xs text-muted-foreground">PBCEx Mobile</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                      <p className="text-muted-foreground text-sm">
                        Available on iOS and Android app stores
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Features */}
            <Card className="bg-gradient-to-r from-gold/5 to-silver/5 border-gold/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Bank-Grade Security</CardTitle>
                <CardDescription className="text-lg">
                  Your mobile banking experience with institutional-level protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <Fingerprint className="w-12 h-12 mx-auto mb-4 text-gold" />
                    <h3 className="font-semibold mb-2">Biometric Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Face ID, Touch ID, and fingerprint recognition for secure access
                    </p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-silver" />
                    <h3 className="font-semibold mb-2">End-to-End Encryption</h3>
                    <p className="text-sm text-muted-foreground">
                      All communications and data storage use military-grade encryption
                    </p>
                  </div>
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="font-semibold mb-2">Global Compliance</h3>
                    <p className="text-sm text-muted-foreground">
                      Meets regulatory requirements in all supported jurisdictions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MobileApp;