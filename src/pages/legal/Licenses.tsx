import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Award, Clock, Shield } from "lucide-react";

const Licenses = () => {
  const currentLicenses = [
    {
      type: "Business Registration",
      jurisdiction: "Delaware, USA",
      status: "Active",
      description: "Corporate entity registration for PBCEx operations"
    },
    {
      type: "Custody Partnerships",
      jurisdiction: "Multiple",
      status: "Active",
      description: "Partnerships with regulated custodians for USD/USDC/PAXG storage"
    }
  ];

  const inProgress = [
    {
      type: "Money Transmitter License (MTL)",
      jurisdiction: "California, USA",
      status: "Application Filed",
      description: "State money transmitter licensing for expanded U.S. operations"
    },
    {
      type: "Money Transmitter License (MTL)",
      jurisdiction: "New York, USA", 
      status: "Preparation",
      description: "NY BitLicense and money transmitter requirements"
    },
    {
      type: "MiCA Authorization",
      jurisdiction: "European Union",
      status: "Framework Development",
      description: "Markets in Crypto-Assets regulation compliance preparation"
    }
  ];

  const certifications = [
    {
      name: "TradingView Data License",
      description: "Licensed market data provider for trading interfaces",
      status: "Active"
    },
    {
      name: "Shipping & Insurance",
      description: "FedEx, JM Bullion, Dillon Gage fulfillment partnerships",
      status: "Active"
    },
    {
      name: "Security Audits",
      description: "Third-party security assessments and penetration testing",
      status: "Ongoing"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Licenses & Certifications
              </h1>
              <p className="text-xl text-muted-foreground">
                Our regulatory compliance and operational certifications across global markets.
              </p>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                  <Award className="w-6 h-6 text-gold" />
                  <span>Current Licenses</span>
                </h2>
                <div className="grid gap-4">
                  {currentLicenses.map((license) => (
                    <Card key={`${license.type}-${license.jurisdiction}`} className="shadow-xl border-border/50 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{license.type}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{license.jurisdiction}</p>
                            <p className="text-muted-foreground">{license.description}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            {license.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                  <Clock className="w-6 h-6 text-gold" />
                  <span>In Progress</span>
                </h2>
                <div className="grid gap-4">
                  {inProgress.map((license) => (
                    <Card key={`${license.type}-${license.jurisdiction}`} className="shadow-xl border-border/50 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{license.type}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{license.jurisdiction}</p>
                            <p className="text-muted-foreground">{license.description}</p>
                          </div>
                          <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm font-medium">
                            {license.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-gold" />
                  <span>Partners & Certifications</span>
                </h2>
                <div className="grid gap-4">
                  {certifications.map((cert) => (
                    <Card key={cert.name} className="shadow-xl border-border/50 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{cert.name}</h3>
                            <p className="text-muted-foreground">{cert.description}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {cert.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <Card className="shadow-xl border-border/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-gold" />
                    <span>Responsible Disclosure</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    We welcome security researchers to help us maintain the highest security standards. 
                    If you discover a security vulnerability, please report it responsibly.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => window.location.href = "mailto:security@pbcex.com"}>
                      Report Security Issue
                    </Button>
                    <Button variant="outline" disabled>
                      Bug Bounty Program (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Card className="shadow-xl border-border/50 rounded-2xl bg-gradient-to-r from-gold/10 to-gold-light/10 border-gold/20">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-4">Licensing Updates</h3>
                    <p className="text-muted-foreground mb-6">
                      We're continuously expanding our regulatory footprint to serve customers in new markets. 
                      Stay updated on our licensing progress and new jurisdiction launches.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button onClick={() => window.location.href = "/legal/regulatory"}>
                        View Regulatory Framework
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = "mailto:legal@pbcex.com"}
                      >
                        Contact Legal Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Licenses;