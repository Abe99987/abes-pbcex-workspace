import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Coins, 
  ArrowRightLeft, 
  Package, 
  CreditCard,
  DollarSign,
  Building2,
  Globe,
  Shield,
  Users
} from "lucide-react";
import Navigation from "@/components/Navigation";
import FranchiseAndPartnershipsForm from "@/components/FranchiseAndPartnershipsForm";
import FranchiseDemandCounter from "@/components/FranchiseDemandCounter";

const Franchise = () => {

  const revenueStreams = [
    {
      icon: Coins,
      title: "Gold & Silver Spread Revenue",
      description: "Earn from buy/sell spreads on precious metals trading"
    },
    {
      icon: TrendingUp,
      title: "Asset-Backed Mortgages & Loans",
      description: "Revenue from home and vehicle mortgages, and collateralized loans backed by tokenized assets like gold, silver, or crypto"
    },
    {
      icon: ArrowRightLeft,
      title: "FX Remittance Margins",
      description: "Profit from foreign exchange and remittance services"
    },
    {
      icon: Package,
      title: "Physical Delivery Fulfillment",
      description: "Markups on delivery and packaging"
    },
    {
      icon: CreditCard,
      title: "POS and QR Payment Margins",
      description: "Transaction fees from payment processing services"
    },
    {
      icon: CreditCard,
      title: "Card Services",
      description: "Earn revenue from card transactions and service fees"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-b">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              <Building2 className="w-4 h-4 mr-2" />
              Franchise Opportunity
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent mb-6">
              Open a PBCEX Franchise
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              118 elements exist. 25 commodities make the world work. Yet we trade in 180 fiat currencies and over 10,000 cryptocurrencies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center text-lg">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                <span>Starting at <strong>$55K</strong></span>
              </div>
              <div className="flex items-center text-lg">
                <Globe className="w-5 h-5 mr-2 text-primary" />
                <span>Operate in underserved markets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Streams Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Multiple Revenue Streams
              </h2>
              <p className="text-xl text-muted-foreground">
                Generate income from various business verticals with automated compliance and logistics
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {revenueStreams.map((stream, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <stream.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{stream.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {stream.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Benefits */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="text-center">
                  <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle>Vault Support</CardTitle>
                  <CardDescription>
                    Secure storage solutions with full insurance coverage
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="text-center">
                  <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle>API Integration</CardTitle>
                  <CardDescription>
                    Automated fulfillment via Dillon Gage partnership
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <CardTitle>Full Support</CardTitle>
                  <CardDescription>
                    Complete training and ongoing operational assistance
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <FranchiseAndPartnershipsForm />
      
      {/* Franchise Demand Counter */}
      <FranchiseDemandCounter />
    </div>
  );
};

export default Franchise;