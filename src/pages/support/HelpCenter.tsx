import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Mail, Phone, HelpCircle, Shield, CreditCard, Settings, FileText } from "lucide-react";

const HelpCenter = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    attachment: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.topic) newErrors.topic = "Topic is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
    
    const payload = {
      ...formData,
      attachment: formData.attachment?.name || null,
      page: "help_center"
    };
    
    console.log("Help Center form submission:", payload);
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      topic: "",
      message: "",
      attachment: null
    });
  };

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat (24/7)",
      description: "Get instant help from our support team",
      action: "Start Chat",
      onClick: () => alert("Chat widget would open here")
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@pbcex.com",
      action: "Send Email",
      onClick: () => window.location.href = "mailto:support@pbcex.com"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+1 (XXX) XXX-XXXX",
      action: "Call Now",
      onClick: () => alert("Phone support coming soon")
    }
  ];

  const quickLinks = [
    { icon: CreditCard, title: "Deposit/Withdrawals", description: "Add funds or withdraw to your bank" },
    { icon: Settings, title: "Account & KYC", description: "Verify identity and manage settings" },
    { icon: FileText, title: "Fulfillment/Realization", description: "Physical asset delivery and redemption" },
    { icon: Shield, title: "Security and Scams", description: "Keep your account safe" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Help Center
              </h1>
              <p className="text-xl text-muted-foreground">
                We're here 24/7 to help with your wallet, trading, and fulfillment questions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {contactOptions.map((option) => (
                <Card key={option.title} className="shadow-xl border-border/50 rounded-2xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center">
                      <option.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{option.title}</h3>
                    <p className="text-muted-foreground mb-4">{option.description}</p>
                    <Button onClick={option.onClick} className="w-full">
                      {option.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Quick Links</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {quickLinks.map((link) => (
                  <Card key={link.title} className="border-border/50 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <link.icon className="w-8 h-8 mx-auto mb-2 text-gold" />
                      <h4 className="font-medium mb-1">{link.title}</h4>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="shadow-xl border-border/50 rounded-2xl max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5" />
                  <span>Still need help?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Optional"
                    />
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
                    <Label htmlFor="topic">Topic *</Label>
                    <Select value={formData.topic} onValueChange={(value) => handleInputChange("topic", value)}>
                      <SelectTrigger className={errors.topic ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account-kyc">Account/KYC</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="fulfillment">Fulfillment</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic}</p>}
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      rows={4}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="attachment">Attachment</Label>
                    <Input
                      id="attachment"
                      type="file"
                      onChange={(e) => handleInputChange("attachment", e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpCenter;