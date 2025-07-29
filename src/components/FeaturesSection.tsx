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
  FileText
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Wallet,
      title: "Digital Asset Wallet",
      description: "Hold tokenized gold, silver, oil, LYD, USD, EUR, and stablecoins. All assets are spendable, freezable, and fully auditable.",
      badge: "Core Feature",
      color: "gold"
    },
    {
      icon: Globe,
      title: "Global Payments",
      description: "Send cross-border transfers using gold-backed tokens or fiat. Integration with Visa, Mastercard, and local agents.",
      badge: "Worldwide",
      color: "silver"
    },
    {
      icon: Smartphone,
      title: "Mobile Banking",
      description: "Complete banking experience on mobile. Shop, pay, send, and invest from a single app with Apple Pay, Google Pay support.",
      badge: "Mobile First",
      color: "primary"
    },
    {
      icon: Vault,
      title: "Physical Gold Storage",
      description: "Deposit physical gold at branches. Verified, sealed, and tokenized into your digital wallet for instant liquidity.",
      badge: "Secure",
      color: "gold"
    },
    {
      icon: Shield,
      title: "Regulatory Compliance",
      description: "Central bank licensed with full KYC/AML. Assets can be frozen, burned, reissued. Compatible with Shariah finance.",
      badge: "Licensed",
      color: "secondary"
    },
    {
      icon: CreditCard,
      title: "Seamless Payments",
      description: "Use Lightning Network for retail payments, QR-code scanning, and offline transaction support for low-infrastructure regions.",
      badge: "Instant",
      color: "primary"
    },
    {
      icon: TrendingUp,
      title: "Fractional Ownership",
      description: "Invest in gold and silver down to nanograms. Make precious metals accessible to everyone regardless of budget.",
      badge: "Accessible",
      color: "gold"
    },
    {
      icon: Users,
      title: "Franchise Network",
      description: "Physical branches with vault, staff, and POS systems. Local onboarding via QR code or cash deposit agents.",
      badge: "Network",
      color: "silver"
    },
    {
      icon: FileText,
      title: "Blockchain Infrastructure",
      description: "Built on Bitcoin Layer 1 for security, Stacks Layer 2 for smart contracts, with full audit trails on IPFS.",
      badge: "Transparent",
      color: "secondary"
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
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
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