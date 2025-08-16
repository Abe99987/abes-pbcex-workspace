import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Globe, Coins } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-8 pb-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-accent/20" />
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6 border-gold/30 text-gold bg-gold/5">
            <Coins className="w-4 h-4 mr-2" />
            Next-Generation Asset-Backed Banking
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            A Bank for{" "}
            <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
              Real Assets
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            The Home of Hard Commodities. Back to the Roots of Trading, Real Assets, Real Settlement, Real Utility. Lock-in Prices. Buy When the Moment is Right.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="gold" size="lg" className="group">
              Start Banking Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="premium" size="lg">
              Learn More
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-gold" />
              <span className="text-sm font-medium">Central Bank Licensed</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Globe className="h-5 w-5 text-silver" />
              <span className="text-sm font-medium">Global Reach</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Coins className="h-5 w-5 text-gold" />
              <span className="text-sm font-medium">100% Asset Backed</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gold/10 blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-silver/10 blur-xl" />
    </section>
  );
};

export default HeroSection;