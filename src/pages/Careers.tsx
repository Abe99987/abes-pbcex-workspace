import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Careers = () => {
  const { toast } = useToast();
  const [formType, setFormType] = useState("developer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    // Common fields
    fullName: "",
    email: "",
    phone: "",
    
    // Developer specific
    linkedinGithub: "",
    roleInterested: "",
    yearsExperience: "",
    skillsStack: "",
    resume: null as File | null,
    whyJoinMessage: "",
    
    // Operations specific
    linkedinResume: "",
    operationsRole: "",
    languagesSpoken: "",
    operationsExperience: ""
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
    
    // Common required fields
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    
    // Type-specific validation
    if (formType === "developer") {
      if (!formData.roleInterested) newErrors.roleInterested = "Role is required";
    } else if (formType === "operations") {
      if (!formData.operationsRole) newErrors.operationsRole = "Role is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check honeypot
    if (honeypotRef.current?.value) {
      return; // Spam detected
    }
    
    if (!validateForm()) {
      const firstErrorField = document.querySelector('[data-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsSubmitting(true);
    
    // Rate limiting - disable for 3 seconds
    setTimeout(() => setIsSubmitting(false), 3000);
    
    const payload = {
      track: formType,
      fields: formData
    };
    
    console.log("Career application submission:", payload);
    
    toast({
      title: "Application Submitted!",
      description: "Thank you for your interest. We'll review your application and get back to you soon.",
    });
    
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      linkedinGithub: "",
      roleInterested: "",
      yearsExperience: "",
      skillsStack: "",
      resume: null,
      whyJoinMessage: "",
      linkedinResume: "",
      operationsRole: "",
      languagesSpoken: "",
      operationsExperience: ""
    });
  };

  const renderCommonFields = () => (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            data-error={!!errors.fullName}
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
            data-error={!!errors.email}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
        />
      </div>
    </div>
  );

  const renderDeveloperForm = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="linkedinGithub">LinkedIn / GitHub / Portfolio</Label>
        <Input
          id="linkedinGithub"
          value={formData.linkedinGithub}
          onChange={(e) => handleInputChange("linkedinGithub", e.target.value)}
          placeholder="Your professional profiles or portfolio"
        />
      </div>

      <div>
        <Label htmlFor="roleInterested">Role Interested In *</Label>
        <Select value={formData.roleInterested} onValueChange={(value) => handleInputChange("roleInterested", value)}>
          <SelectTrigger className={errors.roleInterested ? "border-destructive" : ""}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="backend">Backend</SelectItem>
            <SelectItem value="blockchain">Blockchain</SelectItem>
            <SelectItem value="smart-contracts">Smart Contracts</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="devops">DevOps</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.roleInterested && <p className="text-sm text-destructive mt-1">{errors.roleInterested}</p>}
      </div>

      <div>
        <Label htmlFor="yearsExperience">Years of Experience</Label>
        <Select value={formData.yearsExperience} onValueChange={(value) => handleInputChange("yearsExperience", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1">0–1</SelectItem>
            <SelectItem value="1-3">1–3</SelectItem>
            <SelectItem value="3-5">3–5</SelectItem>
            <SelectItem value="5-10">5–10</SelectItem>
            <SelectItem value="10+">10+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="skillsStack">Skills / Stack</Label>
        <Textarea
          id="skillsStack"
          value={formData.skillsStack}
          onChange={(e) => handleInputChange("skillsStack", e.target.value)}
          rows={3}
          placeholder="Technologies, frameworks, and skills you work with"
        />
      </div>

      <div>
        <Label htmlFor="resume">Resume / CV Upload</Label>
        <Input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleInputChange("resume", e.target.files?.[0] || null)}
        />
        <p className="text-sm text-muted-foreground mt-1">PDF, DOC up to 10 MB</p>
      </div>

      <div>
        <Label htmlFor="whyJoinMessage">Why do you want to join PBCEx?</Label>
        <Textarea
          id="whyJoinMessage"
          value={formData.whyJoinMessage}
          onChange={(e) => handleInputChange("whyJoinMessage", e.target.value)}
          rows={4}
          placeholder="Tell us what interests you about working with us"
        />
      </div>
    </div>
  );

  const renderOperationsForm = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="linkedinResume">LinkedIn / Resume</Label>
        <Input
          id="linkedinResume"
          value={formData.linkedinResume}
          onChange={(e) => handleInputChange("linkedinResume", e.target.value)}
          placeholder="Your LinkedIn profile or resume link"
        />
      </div>

      <div>
        <Label htmlFor="operationsRole">Role Interested In *</Label>
        <Select value={formData.operationsRole} onValueChange={(value) => handleInputChange("operationsRole", value)}>
          <SelectTrigger className={errors.operationsRole ? "border-destructive" : ""}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer-service">Customer Service Agent</SelectItem>
            <SelectItem value="teller-support">Teller Support</SelectItem>
            <SelectItem value="compliance">Compliance Analyst</SelectItem>
            <SelectItem value="community-manager">Community Manager</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.operationsRole && <p className="text-sm text-destructive mt-1">{errors.operationsRole}</p>}
      </div>

      <div>
        <Label htmlFor="languagesSpoken">Languages Spoken</Label>
        <Textarea
          id="languagesSpoken"
          value={formData.languagesSpoken}
          onChange={(e) => handleInputChange("languagesSpoken", e.target.value)}
          rows={2}
          placeholder="Languages you speak fluently"
        />
      </div>

      <div>
        <Label htmlFor="yearsExperience">Years of Experience</Label>
        <Select value={formData.yearsExperience} onValueChange={(value) => handleInputChange("yearsExperience", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1">0–1</SelectItem>
            <SelectItem value="1-3">1–3</SelectItem>
            <SelectItem value="3-5">3–5</SelectItem>
            <SelectItem value="5-10">5–10</SelectItem>
            <SelectItem value="10+">10+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="resume">Resume / CV Upload</Label>
        <Input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleInputChange("resume", e.target.files?.[0] || null)}
        />
        <p className="text-sm text-muted-foreground mt-1">PDF, DOC up to 10 MB</p>
      </div>

      <div>
        <Label htmlFor="operationsExperience">Tell us about your customer support or operational experience</Label>
        <Textarea
          id="operationsExperience"
          value={formData.operationsExperience}
          onChange={(e) => handleInputChange("operationsExperience", e.target.value)}
          rows={4}
          placeholder="Describe your relevant experience"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-20 bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Join the PBCEx Team
              </h1>
              <p className="text-xl text-muted-foreground">
                We're building the world's first global asset-backed banking platform. Apply below as a developer or operations/customer support partner.
              </p>
            </div>

            <Card className="shadow-xl border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-center">Career Application</CardTitle>
                <CardDescription className="text-center">
                  Choose your track and tell us about yourself
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Honeypot field */}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Type Selector */}
                  <Tabs value={formType} onValueChange={setFormType}>
                    <TabsList className="grid w-full grid-cols-2 h-auto">
                      <TabsTrigger value="developer" className="text-sm p-3">
                        Developer Application
                      </TabsTrigger>
                      <TabsTrigger value="operations" className="text-sm p-3">
                        Operations & Customer Support Application
                      </TabsTrigger>
                    </TabsList>

                    {/* Common Fields */}
                    <div>
                      <h3 className="font-semibold mb-4 text-lg border-b pb-2">Contact Information</h3>
                      {renderCommonFields()}
                    </div>

                    {/* Dynamic Form Content */}
                    <TabsContent value="developer" className="mt-8">
                      <div className="border-t pt-6">
                        <h3 className="font-semibold mb-4 text-lg">Developer Details</h3>
                        {renderDeveloperForm()}
                      </div>
                    </TabsContent>

                    <TabsContent value="operations" className="mt-8">
                      <div className="border-t pt-6">
                        <h3 className="font-semibold mb-4 text-lg">Operations & Support Details</h3>
                        {renderOperationsForm()}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full md:w-auto min-w-[200px]"
                      size="lg"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
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

export default Careers;