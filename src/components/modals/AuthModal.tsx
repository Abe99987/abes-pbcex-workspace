import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FORM_CONFIGS } from "./auth-form-configs";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNTRIES = [
  "United States",
  "European Union (EU/EEA)", 
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

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    setCodeSent(true);
    toast({
      title: "Code sent!",
      description: "Check your email for the 6-digit verification code.",
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const codeComplete = verificationCode.every(digit => digit !== "");
    
    if (!codeComplete) {
      toast({
        title: "Validation Error",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Logged in (prototype)",
      description: "Welcome back to PBcex.",
    });
    
    onOpenChange(false);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
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
      title: "Sign-up data captured (prototype)",
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
            onChange={(e) => {
              let inputValue = e.target.value;
              // Mask SSN/ITIN while typing
              if (field.name === "ssn" && inputValue) {
                inputValue = inputValue.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '***-**-$3');
              }
              handleInputChange(field.name, inputValue);
            }}
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
      <DialogContent className="max-w-xl w-full mx-4 md:mx-auto rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-center">Account Access</DialogTitle>
          <DialogClose className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-6">
            {!codeSent ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Send 6-digit code
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </div>

                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter 6-digit verification code</Label>
                  <div className="flex gap-2 justify-center">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        className="w-12 h-12 text-center text-lg font-mono"
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Log In
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </div>

                <button 
                  type="button" 
                  onClick={() => setCodeSent(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Back to email
                </button>
              </form>
            )}
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