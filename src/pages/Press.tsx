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

const Press = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    pressOrganization: "",
    role: "",
    inquiryType: "",
    website: "",
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
    if (!formData.pressOrganization.trim()) newErrors.pressOrganization = "Press organization is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.inquiryType) newErrors.inquiryType = "Type of inquiry is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 3000);
    
    console.log("Press inquiry submission:", formData);
    
    toast({
      title: "Press Inquiry Submitted!",
      description: "Thank you for your interest. Our media team will get back to you soon.",
    });
    
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      pressOrganization: "",
      role: "",
      inquiryType: "",
      website: "",
      message: ""
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Press & Media
              </h1>
              <p className="text-xl text-muted-foreground">
                Connect with our media team for interviews, features, and collaboration opportunities.
              </p>
            </div>

            <Card className="shadow-xl border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-center">Press Inquiry</CardTitle>
                <CardDescription className="text-center">
                  Tell us about your media project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <Label htmlFor="pressOrganization">Press Organization / Company *</Label>
                    <Input
                      id="pressOrganization"
                      value={formData.pressOrganization}
                      onChange={(e) => handleInputChange("pressOrganization", e.target.value)}
                      className={errors.pressOrganization ? "border-destructive" : ""}
                    />
                    {errors.pressOrganization && <p className="text-sm text-destructive mt-1">{errors.pressOrganization}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                        <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="journalist">Journalist</SelectItem>
                          <SelectItem value="influencer">Influencer</SelectItem>
                          <SelectItem value="marketing-partner">Marketing Partner</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && <p className="text-sm text-destructive mt-1">{errors.role}</p>}
                    </div>
                    <div>
                      <Label htmlFor="inquiryType">Type of Inquiry *</Label>
                      <Select value={formData.inquiryType} onValueChange={(value) => handleInputChange("inquiryType", value)}>
                        <SelectTrigger className={errors.inquiryType ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="feature-story">Feature Story</SelectItem>
                          <SelectItem value="marketing-collaboration">Marketing Collaboration</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.inquiryType && <p className="text-sm text-destructive mt-1">{errors.inquiryType}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website / Social Media</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="Optional - your website, Twitter/X, LinkedIn"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      rows={5}
                      placeholder="Tell us about your media project or collaboration idea"
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full md:w-auto min-w-[200px]"
                      size="lg"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Inquiry"}
                    </Button>
                  </div>
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

export default Press;