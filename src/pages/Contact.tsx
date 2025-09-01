import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import FranchiseAndPartnershipsForm from "@/components/FranchiseAndPartnershipsForm";
import PressForm from "@/components/PressForm";
import FranchiseDemandCounter from "@/components/FranchiseDemandCounter";

const Contact = () => {

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Franchise & Partnerships Section */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Contact US
                </h2>
                <p className="text-lg text-muted-foreground">
                  Join our network or explore partnership opportunities
                </p>
              </div>
              
              {/* Direct Email Section */}
              <div className="mb-8 text-center">
                <Card className="shadow-xl border-border/50 rounded-2xl bg-gradient-to-r from-gold/10 to-gold-light/10 border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Mail className="w-5 h-5 text-gold" />
                      <span className="font-medium">Direct Email</span>
                    </div>
                    <p className="text-muted-foreground">
                      For immediate assistance, email us directly at{" "}
                      <a href="mailto:contact@pbcex.com" className="text-gold hover:underline">
                        contact@pbcex.com
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <FranchiseAndPartnershipsForm />
            </div>

            {/* Press & Media Section */}
            <div className="mt-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Press & Media
                </h2>
                <p className="text-lg text-muted-foreground">
                  Connect with our media team for interviews and collaborations
                </p>
              </div>
              <PressForm showHeader={false} />
            </div>
          </div>
        </div>
      </main>

      {/* Franchise Demand Counter */}
      <FranchiseDemandCounter />

      <Footer />
    </div>
  );
};

export default Contact;