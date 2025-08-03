import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingDown, DollarSign, Coins, ArrowRight } from "lucide-react";

const EducationSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-muted/30 to-accent/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Understanding Asset-Backed Money
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn why gold and silver have been trusted stores of value for thousands of years, 
            and how modern technology makes them accessible to everyone.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left side - Educational content */}
          <div className="space-y-8">
            <Card className="border-gold/20 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-gold" />
                  <span>The 1971 Gold Standard Removal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  In 1971, the US removed the gold standard, allowing unlimited money printing. 
                  Since then, the dollar has lost over 85% of its purchasing power while gold 
                  has maintained its value across millennia.
                </p>
              </CardContent>
            </Card>

            <Card className="border-silver/20 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                  <span>Inflation's Hidden Tax</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Inflation silently erodes your savings. What cost $1 in 1971 now costs over $6. 
                  Asset-backed money protects your wealth from this invisible tax on your 
                  financial future.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Coins className="h-6 w-6 text-gold" />
                  <span>Tokenization Revolution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Our blockchain technology allows you to own fractions of physical gold and silver, 
                  making precious metals as liquid as cash while maintaining their intrinsic value 
                  and inflation protection.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Value proposition */}
          <div className="flex flex-col justify-center">
            <div className="bg-gradient-to-br from-gold/10 to-gold-light/10 rounded-2xl p-8 border border-gold/20">
              <div className="text-center mb-8">
                <BookOpen className="h-12 w-12 text-gold mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Why Choose Asset-Backed Banking?
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Inflation Protection</h4>
                    <p className="text-muted-foreground text-sm">
                      Gold has maintained purchasing power for over 5,000 years
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-silver mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Global Acceptance</h4>
                    <p className="text-muted-foreground text-sm">
                      Precious metals are recognized worldwide as stores of value
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Financial Sovereignty</h4>
                    <p className="text-muted-foreground text-sm">
                      Own real assets, not promises from central banks
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-gold-light mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Modern Liquidity</h4>
                    <p className="text-muted-foreground text-sm">
                      Spend your gold as easily as digital cash with our platform
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gold/20">
                <Button variant="gold" className="w-full group">
                  Start Your Financial Education
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationSection;