import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

const Investors = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    firmName: "",
    aumRange: "",
    investorType: "",
    message: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.investorType) newErrors.investorType = "Investor type is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 3000);
    
    console.log("Investor application submission:", formData);
    
    toast({
      title: "Application Submitted!",
      description: "Thank you for your interest. Our investor relations team will be in touch soon.",
    });
    
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      firmName: "",
      aumRange: "",
      investorType: "",
      message: ""
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Investor Relations
              </h1>
              <p className="text-xl text-muted-foreground">
                Join us in building the future of asset-backed digital banking.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Investor Application */}
              <Card className="shadow-xl border-border/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Investor Application</CardTitle>
                  <CardDescription>
                    Apply to participate in PBCEx funding rounds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className={errors.fullName ? "border-destructive" : ""}
                      />
                      {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="firmName">Firm/Company Name</Label>
                      <Input
                        id="firmName"
                        value={formData.firmName}
                        onChange={(e) => handleInputChange("firmName", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <Label htmlFor="aumRange">AUM/Investment Range</Label>
                      <Input
                        id="aumRange"
                        value={formData.aumRange}
                        onChange={(e) => handleInputChange("aumRange", e.target.value)}
                        placeholder="e.g., $1M-$10M, $50M+, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="investorType">Investor Type *</Label>
                      <Select value={formData.investorType} onValueChange={(value) => handleInputChange("investorType", value)}>
                        <SelectTrigger className={errors.investorType ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select investor type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vc">VC</SelectItem>
                          <SelectItem value="family-office">Family Office</SelectItem>
                          <SelectItem value="institutional">Institutional</SelectItem>
                          <SelectItem value="angel">Angel</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.investorType && <p className="text-sm text-destructive mt-1">{errors.investorType}</p>}
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        rows={4}
                        placeholder="Tell us about your investment interests and thesis"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Investor Portal */}
              <Card className="shadow-xl border-border/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Investor Portal</CardTitle>
                  <CardDescription>
                    Access live KPIs, financials, and investor updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center">
                        <ArrowRight className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                      <p className="text-muted-foreground mb-6">
                        Live dashboard with real-time metrics, financial reports, and investor communications.
                      </p>
                    </div>

                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gold rounded-full"></div>
                        <span>Real-time trading volumes and TVL</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gold rounded-full"></div>
                        <span>Monthly financial statements</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gold rounded-full"></div>
                        <span>Regulatory compliance updates</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-gold rounded-full"></div>
                        <span>Product roadmap and milestones</span>
                      </div>
                    </div>

                    <Button 
                      disabled
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      Access Portal (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Investors;