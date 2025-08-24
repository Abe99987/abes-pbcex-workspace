import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
                A Bank for Real Assets — Backed by Technology, Built for the People
              </h1>
            </div>

            {/* Body Content */}
            <div className="prose prose-lg mx-auto text-foreground space-y-8">
              <p className="text-lg leading-relaxed">
                PBCEx is building the world's first global commodities bank, where digital settlement is directly backed by physical assets — gold, silver, oil, copper, and rare earths. We connect providers, institutions, and customers into one seamless system, allowing people everywhere to save, trade, and redeem real assets at the speed of modern finance.
              </p>

              <p className="text-lg leading-relaxed">
                Our model is designed for resilience: real-asset custody, synthetic trading pairs, and a compliance-first architecture that scales across jurisdictions. With a global compliance system aligned to U.S. MTLs, EU MiCA, USMCA, and emerging frameworks in Asia and the Middle East, PBCEx can operate in any market, giving customers confidence that every trade, vault, and redemption meets the highest regulatory standards.
              </p>

              {/* CTA */}
              <div className="text-center pt-8">
                <Button asChild size="lg" className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold">
                  <Link to="/education">Learn More About Our Mission</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;