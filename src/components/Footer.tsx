import { Separator } from "@/components/ui/separator";
import { Shield, Globe, Coins, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const companyLinks = [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Investors", href: "/investors" },
    { label: "Franchise", href: "/franchise" },
  ];

  const productLinks = [
    { label: "Digital Wallet", href: "/wallet" },
    { label: "Asset Trading", href: "/asset-trading" },
    { label: "Global Payments", href: "/payments" },
    { label: "Mobile App", href: "/app" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/support/help-center" },
    { label: "Security", href: "/support/security" },
    { label: "Compliance", href: "/support/compliance" },
    { label: "Contact", href: "/contact" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/legal/privacy-policy" },
    { label: "Terms of Service", href: "/legal/terms-of-service" },
    { label: "Regulatory", href: "/legal/regulatory" },
    { label: "Licenses", href: "/legal/licenses" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <span className="text-primary-foreground font-bold">PB</span>
              </div>
              <span className="text-2xl font-bold">PBCex</span>
            </div>
            <p className="text-secondary-foreground/80 mb-6 leading-relaxed">
              A Bank for the People — Backed by Real Assets, Connected to the World. 
              Secure, transparent, and innovative digital banking.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-gold" />
                <span>Licensed</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Globe className="h-4 w-4 text-silver" />
                <span>Global</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Coins className="h-4 w-4 text-gold" />
                <span>Asset-Backed</span>
              </div>
            </div>
          </div>

          {/* Links sections */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-secondary-foreground/20" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-secondary-foreground/70">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>contact@pbcex.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Licensed in Multiple Jurisdictions</span>
            </div>
          </div>
          <div className="text-sm text-secondary-foreground/70">
            © 2024 PBCex. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;