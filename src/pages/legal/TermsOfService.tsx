import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const TermsOfService = () => {
  const sections = [
    { id: "eligibility", title: "Eligibility & Account Requirements" },
    { id: "services", title: "Services & Account Types" },
    { id: "risks", title: "Risk Disclosures" },
    { id: "fulfillment", title: "Fulfillment & Trading Rules" },
    { id: "fees", title: "Fees & Charges" },
    { id: "prohibited", title: "Prohibited Activities" },
    { id: "arbitration", title: "Arbitration & Dispute Resolution" },
    { id: "suspension", title: "Account Suspension & Termination" },
    { id: "intellectual", title: "Intellectual Property" },
    { id: "liability", title: "Limitation of Liability" },
    { id: "updates", title: "Updates to Terms" },
    { id: "contact", title: "Legal Contact" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Terms of Service
              </h1>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            <Card className="shadow-xl border-border/50 rounded-2xl mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Table of Contents</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="text-gold hover:underline text-sm"
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <section id="eligibility">
                <h2 className="text-2xl font-bold mb-4">Eligibility & Account Requirements</h2>
                <div className="text-muted-foreground space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>You must be at least 18 years old (or local age of majority) to use PBCEx services</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>One account per person or legal entity</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Completion of KYC (Know Your Customer) verification is required</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Business accounts must complete KYB (Know Your Business) verification</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>You must comply with all applicable local laws and regulations</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section id="services">
                <h2 className="text-2xl font-bold mb-4">Services & Account Types</h2>
                <div className="text-muted-foreground space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Account Structure</h4>
                    <p>PBCEx operates with two distinct account types:</p>
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span><strong>Funding Account:</strong> Holds real assets and USD/USDC/PAXG for withdrawals and redemptions</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                        <span><strong>Trading Account:</strong> Contains synthetic tokens (XAU-s, XAG-s, etc.) for fast trading</span>
                      </li>
                    </ul>
                    <p className="mt-2">Synthetics remain platform-internal and withdrawals are processed from the Funding account only.</p>
                  </div>
                </div>
              </section>

              <section id="risks">
                <h2 className="text-2xl font-bold mb-4">Risk Disclosures</h2>
                <div className="text-muted-foreground space-y-4">
                  <p><strong>Important:</strong> Trading commodities and digital assets involves significant risks:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Market Risk:</strong> Commodity prices can be highly volatile</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Liquidity Risk:</strong> You may not be able to sell assets when desired</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Custody Risk:</strong> Risk of loss associated with third-party custodians</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Regulatory Risk:</strong> Changes in laws may affect service availability</span>
                    </li>
                  </ul>
                  <p className="font-semibold">You should not invest more than you can afford to lose.</p>
                </div>
              </section>

              <section id="fulfillment">
                <h2 className="text-2xl font-bold mb-4">Fulfillment & Trading Rules</h2>
                <div className="text-muted-foreground space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Physical redemption requests include a 10-minute price lock period</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Shipping and insurance costs apply to physical deliveries</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Minimum order sizes may apply for physical fulfillment</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Trading halts may occur during extreme market conditions</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section id="fees">
                <h2 className="text-2xl font-bold mb-4">Fees & Charges</h2>
                <div className="text-muted-foreground space-y-4">
                  <p>PBCEx charges fees for various services including:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Trading spreads and transaction fees</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Physical fulfillment and shipping costs</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Wire transfer and payment processing fees</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Account maintenance fees (if applicable)</span>
                    </li>
                  </ul>
                  <p>Current fee schedule is available on our platform and may be updated with notice.</p>
                </div>
              </section>

              <section id="prohibited">
                <h2 className="text-2xl font-bold mb-4">Prohibited Activities</h2>
                <div className="text-muted-foreground space-y-4">
                  <p>The following activities are strictly prohibited:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Money laundering or financing terrorism</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Market manipulation or insider trading</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Using our services for illegal purposes</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Circumventing security measures or KYC requirements</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Creating multiple accounts or sharing account access</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section id="arbitration">
                <h2 className="text-2xl font-bold mb-4">Arbitration & Dispute Resolution</h2>
                <div className="text-muted-foreground space-y-4">
                  <p><strong>For U.S. Users:</strong></p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Most disputes will be resolved through binding arbitration</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Class action lawsuits are waived</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Small claims court disputes are excluded from arbitration</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>30-day opt-out window available after account creation</span>
                    </li>
                  </ul>
                  <p>Venue: Delaware, USA. Governing Law: Delaware State Law.</p>
                </div>
              </section>

              <section id="suspension">
                <h2 className="text-2xl font-bold mb-4">Account Suspension & Termination</h2>
                <div className="text-muted-foreground space-y-4">
                  <p>PBCEx reserves the right to:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Suspend or terminate accounts for violations of these terms</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Freeze synthetic tokens and burn compromised balances for security</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Require additional verification before processing withdrawals</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span>Comply with legal orders and regulatory requirements</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section id="intellectual">
                <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All PBCEx trademarks, logos, and content are our intellectual property. You may not use our 
                  intellectual property without written permission.
                </p>
              </section>

              <section id="liability">
                <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  PBCEx's liability is limited to the maximum extent permitted by law. We are not liable for 
                  indirect, incidental, or consequential damages. Our total liability shall not exceed the 
                  fees paid by you in the 12 months preceding the claim.
                </p>
              </section>

              <section id="updates">
                <h2 className="text-2xl font-bold mb-4">Updates to Terms</h2>
                <p className="text-muted-foreground">
                  We may update these terms from time to time. Material changes will be communicated through 
                  email or platform notifications. Continued use constitutes acceptance of updated terms.
                </p>
              </section>

              <section id="contact">
                <h2 className="text-2xl font-bold mb-4">Legal Contact</h2>
                <p className="text-muted-foreground">
                  For legal notices and correspondence, contact us at{" "}
                  <a href="mailto:legal@pbcex.com" className="text-gold hover:underline">
                    legal@pbcex.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;