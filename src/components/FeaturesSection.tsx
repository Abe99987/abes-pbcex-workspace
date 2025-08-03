import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Globe, 
  Shield, 
  Smartphone, 
  Vault, 
  CreditCard,
  TrendingUp,
  Users,
  QrCode,
  Banknote,
  Coins,
  Store
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Wallet,
      title: "Real-Asset Wallet",
      description: "Store and spend digital gold, silver, oil, LYD, USD, and EUR. Every token is auditable, redeemable, and backed 1:1 by real-world assets.",
      badge: "Core Feature",
      color: "gold"
    },
    {
      icon: Globe,
      title: "Global Banking",
      description: "Access banking-grade services anywhere: send, receive, exchange, and spend in gold, USD, LYD, or stablecoins — instantly and globally.",
      badge: "Worldwide",
      color: "primary"
    },
    {
      icon: Smartphone,
      title: "Bank, Trade, Spend — One App",
      description: "One mobile experience for tokenized assets, QR payments, real-time trading, physical redemptions, and branch onboarding.",
      badge: "All-in-One",
      color: "primary"
    },
    {
      icon: Coins,
      title: "Spendable Gold — Buy & Use Any Amount",
      description: "Buy just $10 worth of gold, or even less — no need to purchase a full ounce. Trade any amount, anytime. Spend tokenized gold directly with your PBCex Visa card.",
      badge: "Fractional",
      color: "gold"
    },
    {
      icon: Vault,
      title: "Gold, Silver, & Metals Fulfillment",
      description: "Redeem your digital gold and silver for physical delivery. Choose insured shipping or in-person branch pickup. Fully verified and sealed.",
      badge: "Physical",
      color: "silver"
    },
    {
      icon: TrendingUp,
      title: "Borrow Against Gold & Oil",
      description: "Access instant liquidity without selling your assets. Freeze tokenized gold, silver, or oil as collateral and receive USD-backed stablecoins or fiat.",
      badge: "Collateral",
      color: "gold"
    },
    {
      icon: Store,
      title: "Most Profitable Franchise Model",
      description: "Open a PBCex branch for as little as $55K. Earn from gold spreads, remittance fees, token minting, and physical delivery fulfillment.",
      badge: "Business",
      color: "secondary"
    },
    {
      icon: Shield,
      title: "Regulated & Transparent",
      description: "Designed for Shariah, U.S., and international compliance. All tokens can be frozen, audited, and burned under regulatory oversight.",
      badge: "Compliant",
      color: "secondary"
    },
    {
      icon: QrCode,
      title: "QR & Offline Payments",
      description: "Works even with limited internet. Pay with QR codes, cash agents, or offline gold transactions that sync once online.",
      badge: "Resilient",
      color: "primary"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'gold':
        return 'border-gold/20 hover:border-gold/40 hover:shadow-[0_10px_30px_-10px_hsl(var(--gold)/0.2)]';
      case 'silver':
        return 'border-silver/20 hover:border-silver/40 hover:shadow-[0_10px_30px_-10px_hsl(var(--silver)/0.2)]';
      default:
        return 'border-border/50 hover:border-primary/30 hover:shadow-lg';
    }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Complete Financial Ecosystem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From buying your first gram of gold to managing international transfers, 
            PBCex provides all the tools you need for asset-backed banking.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`transition-all duration-300 ${getColorClasses(feature.color)} group cursor-pointer`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;