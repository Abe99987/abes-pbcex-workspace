import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FORM_CONFIGS } from "./auth-form-configs";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNTRIES = [
  "United States",
  "European Union", 
  "United Kingdom",
  "China",
  "Hong Kong",
  "Singapore", 
  "India",
  "Japan",
  "United Arab Emirates",
  "Saudi Arabia",
  "Nigeria",
  "South Africa"
];

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("signup");
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [advancedShippingOpen, setAdvancedShippingOpen] = useState(false);

  // Login form states
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in both email and password.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login successful!",
      description: "Welcome back to PBcex.",
    });
    
    onOpenChange(false);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    const config = FORM_CONFIGS[accountType][selectedCountry];
    const requiredFields: string[] = [];
    
    // Collect all required fields
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !formData[field.name]) {
          requiredFields.push(field.label);
        }
      });
    });

    if (requiredFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in required fields: ${requiredFields.slice(0, 3).join(", ")}${requiredFields.length > 3 ? "..." : ""}`,
        variant: "destructive",
      });
      return;
    }

    // Success handling
    toast({
      title: "Sign-up data captured",
      description: "Your registration has been submitted successfully.",
    });

    // Console log the payload
    const payload = {
      type: accountType,
      country: selectedCountry,
      fields: formData
    };
    console.log("Sign-up payload:", JSON.stringify(payload, null, 2));
    
    onOpenChange(false);
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || "";
    
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        );
      
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );
        
      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent className="z-[60]">
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="text-sm leading-relaxed">
              {field.label}
            </Label>
          </div>
        );
        
      case "file":
        return (
          <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drop file here or click to browse
            </p>
            <Input
              type="file"
              className="hidden"
              onChange={(e) => handleInputChange(field.name, e.target.files?.[0])}
            />
          </div>
        );
        
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const config = FORM_CONFIGS[accountType][selectedCountry];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Access</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Log In
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6">
            {/* Account Type Toggle */}
            <div className="flex items-center justify-center">
              <div className="bg-muted p-1 rounded-lg flex">
                <Button
                  type="button"
                  variant={accountType === "personal" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAccountType("personal")}
                  className="px-6"
                >
                  Personal
                </Button>
                <Button
                  type="button"
                  variant={accountType === "business" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setAccountType("business")}
                  className="px-6"
                >
                  Business
                </Button>
              </div>
            </div>

            {/* Country Selection */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <form onSubmit={handleSignUp} className="space-y-8">
              {/* Main Form Sections */}
              {config.sections.map((section, sectionIndex) => (
                <Card key={section.title}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        {field.type !== "checkbox" && (
                          <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                        )}
                        {renderField(field)}
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground">
                            {field.helpText}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              {/* Advanced Shipping Section */}
              <Collapsible open={advancedShippingOpen} onOpenChange={setAdvancedShippingOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Advanced Shipping Options
                    <ChevronDown className={`h-4 w-4 transition-transform ${advancedShippingOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Secure Pickup Location</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose pickup location" />
                          </SelectTrigger>
                          <SelectContent className="z-[60]">
                            <SelectItem value="fedex">FedEx Center</SelectItem>
                            <SelectItem value="ups">UPS Center</SelectItem>
                            <SelectItem value="dhl">DHL Center</SelectItem>
                            <SelectItem value="brinks">Brinks Secure Site</SelectItem>
                            <SelectItem value="warehouse">Bonded Warehouse</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Government ID required for release.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Create Account
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}