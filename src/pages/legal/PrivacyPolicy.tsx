import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const sections = [
    { id: "scope", title: "Scope of Services" },
    { id: "collection", title: "What We Collect" },
    { id: "usage", title: "How We Use Data" },
    { id: "sharing", title: "Data Sharing" },
    { id: "transfers", title: "International Transfers & Storage" },
    { id: "security", title: "Security" },
    { id: "rights", title: "Your Rights" },
    { id: "retention", title: "Data Retention" },
    { id: "children", title: "Children's Privacy" },
    { id: "contact", title: "Contact Information" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Privacy Policy
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
              <section id="scope">
                <h2 className="text-2xl font-bold mb-4">Scope of Services</h2>
                <p className="text-muted-foreground mb-4">
                  This Privacy Policy applies to all PBCEx services, including our web platform, mobile applications, 
                  and APIs. PBCEx operates a global commodities banking platform that enables users to trade, store, 
                  and redeem physical assets through digital interfaces.
                </p>
              </section>

              <section id="collection">
                <h2 className="text-2xl font-bold mb-4">What We Collect</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Account Information</h4>
                    <p>Personal identifiers, contact information, and account credentials for service provision and security.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">KYC/KYB Documentation</h4>
                    <p>Identity verification documents, business registration details, and compliance screening data as required by law.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Transactional Data</h4>
                    <p>Trading activity, wallet transactions, fulfillment requests, and payment processing information.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Device & Network Data</h4>
                    <p>IP addresses, device identifiers, browser information, and usage patterns for security and service optimization.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Cookies & Analytics</h4>
                    <p>Website usage data, performance metrics, and user preferences to improve our services.</p>
                  </div>
                </div>
              </section>

              <section id="usage">
                <h2 className="text-2xl font-bold mb-4">How We Use Data</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                    <span>Provide and maintain our trading, wallet, and fulfillment services</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                    <span>Comply with legal obligations including AML, KYC, and regulatory reporting</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                    <span>Prevent fraud, money laundering, and other illegal activities</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                    <span>Provide customer support and communications</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                    <span>Improve and develop new products and services</span>
                  </li>
                </ul>
              </section>

              <section id="sharing">
                <h2 className="text-2xl font-bold mb-4">Data Sharing</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We may share your information with:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Custodians and payment partners</strong> - for asset storage and transaction processing</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Fulfillment and logistics partners</strong> - for physical asset delivery</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>KYC and compliance providers</strong> - for identity verification and screening</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Analytics providers</strong> - minimal data for service improvement</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Legal authorities</strong> - as required by law or court order</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section id="transfers">
                <h2 className="text-2xl font-bold mb-4">International Transfers & Storage</h2>
                <p className="text-muted-foreground">
                  PBCEx operates globally and may process your data across multiple jurisdictions. We implement appropriate 
                  safeguards including Standard Contractual Clauses (SCCs) and adequacy decisions where applicable to ensure 
                  your data remains protected during cross-border transfers.
                </p>
              </section>

              <section id="security">
                <h2 className="text-2xl font-bold mb-4">Security</h2>
                <p className="text-muted-foreground">
                  We implement enterprise-grade security measures including encryption at rest and in transit, access controls, 
                  incident response procedures, and regular security audits. For detailed information about our security practices, 
                  please visit our <a href="/support/security" className="text-gold hover:underline">Security page</a>.
                </p>
              </section>

              <section id="rights">
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <div className="text-muted-foreground space-y-4">
                  <p>Depending on your jurisdiction, you may have the following rights:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Access</strong> - Request copies of your personal information</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Correction</strong> - Request correction of inaccurate information</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Deletion</strong> - Request deletion of your information (subject to legal obligations)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Portability</strong> - Request transfer of your data in a structured format</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Opt-out</strong> - Unsubscribe from marketing communications</span>
                    </li>
                  </ul>
                  <p>Additional rights may apply under CCPA/CPRA (California) and GDPR (EU/UK).</p>
                </div>
              </section>

              <section id="retention">
                <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations. 
                  Transactional records may be kept for extended periods as required by financial regulations.
                </p>
              </section>

              <section id="children">
                <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
                <p className="text-muted-foreground">
                  PBCEx services are not intended for individuals under 18 years of age (or the local age of majority). 
                  We do not knowingly collect personal information from children.
                </p>
              </section>

              <section id="contact">
                <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                <p className="text-muted-foreground">
                  For privacy-related questions or to exercise your rights, contact us at{" "}
                  <a href="mailto:privacy@pbcex.com" className="text-gold hover:underline">
                    privacy@pbcex.com
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

export default PrivacyPolicy;