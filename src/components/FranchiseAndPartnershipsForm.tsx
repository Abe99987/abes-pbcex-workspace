import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const countries = [
  "United States", "European Union (EU/EEA)", "United Kingdom", "China", "Hong Kong", 
  "Singapore", "India", "Japan", "United Arab Emirates", "Saudi Arabia", "Nigeria", "South Africa"
];

const commodities = [
  "Gold", "Silver", "Platinum", "Palladium", "Copper", "Lithium", "Cobalt", "Nickel", 
  "Oil", "Gas", "Other"
];

const incoterms = ["FOB", "CIF", "EXW", "DDP", "FCA", "CPT", "CIP", "DAP", "DPU"];

const FranchiseAndPartnershipsForm = () => {
  const { toast } = useToast();
  const [formType, setFormType] = useState("franchise_applicant");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    // Common fields
    fullName: "",
    email: "",
    phone: "",
    
    // Franchise Applicant
    city: "",
    country: "United States",
    launchTimeline: "",
    ownsBusinessCurrently: "",
    businessName: "",
    investmentCapacity: "",
    franchiseModel: [] as string[],
    businessLicense: null as File | null,
    motivation: "",
    
    // Bank Partner
    institutionName: "",
    countryOfIncorporation: "United States",
    regulatoryStatus: "",
    assetsUnderManagement: "",
    contactTitle: "",
    partnershipAreas: [] as string[],
    regulatoryApproval: null as File | null,
    
    // Commodity Provider
    companyName: "",
    countryOfOperation: "United States",
    authorizedSignatory: "",
    primaryCommodities: [] as string[],
    otherCommodity: "",
    annualCapacity: "",
    fulfillmentMethod: "",
    exportLicenses: null as File | null,
    incotermsPreference: "",
    additionalDetails: "",
    
    // Customer Vote
    cityWanted: "",
    countryWanted: "United States",
    wouldBeCustomer: "",
    likelyToUse: "",
    
    // General Business Inquiry
    inquiryType: "",
    message: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | string[] | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof typeof formData] as string[];
    if (checked) {
      handleInputChange(field, [...currentValues, value]);
    } else {
      handleInputChange(field, currentValues.filter(v => v !== value));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Common required fields
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    
    // Type-specific validation
    switch (formType) {
      case "franchise_applicant":
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.country) newErrors.country = "Country is required";
        if (!formData.launchTimeline) newErrors.launchTimeline = "Launch timeline is required";
        if (!formData.ownsBusinessCurrently) newErrors.ownsBusinessCurrently = "This field is required";
        if (!formData.investmentCapacity) newErrors.investmentCapacity = "Investment capacity is required";
        break;
        
      case "bank_partner":
        if (!formData.institutionName.trim()) newErrors.institutionName = "Institution name is required";
        if (!formData.countryOfIncorporation) newErrors.countryOfIncorporation = "Country is required";
        if (!formData.regulatoryStatus) newErrors.regulatoryStatus = "Regulatory status is required";
        if (!formData.contactTitle.trim()) newErrors.contactTitle = "Contact title is required";
        break;
        
      case "commodity_provider":
        if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
        if (!formData.countryOfOperation) newErrors.countryOfOperation = "Country is required";
        if (!formData.authorizedSignatory.trim()) newErrors.authorizedSignatory = "Authorized signatory is required";
        if (formData.primaryCommodities.length === 0) newErrors.primaryCommodities = "Select at least one commodity";
        if (!formData.annualCapacity.trim()) newErrors.annualCapacity = "Annual capacity is required";
        if (!formData.fulfillmentMethod) newErrors.fulfillmentMethod = "Fulfillment method is required";
        break;
        
      case "customer_vote":
        if (!formData.cityWanted.trim()) newErrors.cityWanted = "City is required";
        if (!formData.countryWanted) newErrors.countryWanted = "Country is required";
        if (!formData.wouldBeCustomer) newErrors.wouldBeCustomer = "This field is required";
        if (!formData.likelyToUse) newErrors.likelyToUse = "This field is required";
        break;
        
      case "general_business_inquiry":
        if (!formData.inquiryType) newErrors.inquiryType = "Inquiry type is required";
        if (!formData.message.trim()) newErrors.message = "Message is required";
        break;
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
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsSubmitting(true);
    
    // Rate limiting - disable for 3 seconds
    setTimeout(() => setIsSubmitting(false), 3000);
    
    // Get lead tag
    const leadTagMap = {
      franchise_applicant: "franchise_lead",
      bank_partner: "bank_partner_lead", 
      commodity_provider: "supply_lead",
      customer_vote: "franchise_vote",
      general_business_inquiry: "inbound_lead"
    };
    
    const payload = {
      formType,
      leadTag: leadTagMap[formType as keyof typeof leadTagMap],
      fields: formData
    };
    
    console.log("Form submission payload:", payload);
    
    // Update franchise demand counter
    const store = (window as any).franchiseDemandStore;
    const countFranchiseAsFive = (window as any).countFranchiseAsFive;
    
    if (store) {
      if (formType === "customer_vote") {
        const result = store.addRecord({
          city: formData.cityWanted,
          country: formData.countryWanted,
          weight: 1,
          source: 'vote',
          email: formData.email
        });
        
        if (!result.success) {
          toast({
            title: "Notice",
            description: result.message,
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      } else if (formType === "franchise_applicant" && countFranchiseAsFive) {
        store.addRecord({
          city: formData.city,
          country: formData.country,
          weight: 5,
          source: 'franchise',
          email: formData.email
        });
      }
    }
    
    toast({
      title: "Success!",
      description: "Thanks — we received your submission.",
    });
    
    // Show additional demand update toast for relevant form types
    if (formType === "customer_vote" || (formType === "franchise_applicant" && countFranchiseAsFive)) {
      setTimeout(() => {
        toast({
          title: "Demand Updated",
          description: "Thanks — demand updated.",
        });
      }, 500);
    }
    
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      city: "",
      country: "United States",
      launchTimeline: "",
      ownsBusinessCurrently: "",
      businessName: "",
      investmentCapacity: "",
      franchiseModel: [],
      businessLicense: null,
      motivation: "",
      institutionName: "",
      countryOfIncorporation: "United States",
      regulatoryStatus: "",
      assetsUnderManagement: "",
      contactTitle: "",
      partnershipAreas: [],
      regulatoryApproval: null,
      companyName: "",
      countryOfOperation: "United States",
      authorizedSignatory: "",
      primaryCommodities: [],
      otherCommodity: "",
      annualCapacity: "",
      fulfillmentMethod: "",
      exportLicenses: null,
      incotermsPreference: "",
      additionalDetails: "",
      cityWanted: "",
      countryWanted: "United States",
      wouldBeCustomer: "",
      likelyToUse: "",
      inquiryType: "",
      message: ""
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
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          data-error={!!errors.phone}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
      </div>
    </div>
  );

  const renderFranchiseApplicantForm = () => (
    <div className="space-y-6">
      {/* Expansion Target */}
      <div>
        <h4 className="font-semibold mb-4">Expansion Target</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="city">City you want to open in *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              data-error={!!errors.city}
              className={errors.city ? "border-destructive" : ""}
            />
            {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
              <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-sm text-destructive mt-1">{errors.country}</p>}
          </div>
          <div>
            <Label htmlFor="launchTimeline">Launch Timeline *</Label>
            <Select value={formData.launchTimeline} onValueChange={(value) => handleInputChange("launchTimeline", value)}>
              <SelectTrigger className={errors.launchTimeline ? "border-destructive" : ""}>
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-3-months">0–3 months</SelectItem>
                <SelectItem value="3-6-months">3–6 months</SelectItem>
                <SelectItem value="6-12-months">6–12 months</SelectItem>
                <SelectItem value="12-plus-months">&gt;12 months</SelectItem>
              </SelectContent>
            </Select>
            {errors.launchTimeline && <p className="text-sm text-destructive mt-1">{errors.launchTimeline}</p>}
          </div>
        </div>
      </div>

      {/* Operator Profile */}
      <div>
        <h4 className="font-semibold mb-4">Operator Profile</h4>
        <div className="space-y-4">
          <div>
            <Label>Do you currently own/operate a business? *</Label>
            <RadioGroup 
              value={formData.ownsBusinessCurrently} 
              onValueChange={(value) => handleInputChange("ownsBusinessCurrently", value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="owns-yes" />
                <Label htmlFor="owns-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="owns-no" />
                <Label htmlFor="owns-no">No</Label>
              </div>
            </RadioGroup>
            {errors.ownsBusinessCurrently && <p className="text-sm text-destructive mt-1">{errors.ownsBusinessCurrently}</p>}
          </div>
          
          {formData.ownsBusinessCurrently === "yes" && (
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="investmentCapacity">Investment Capacity *</Label>
            <Select value={formData.investmentCapacity} onValueChange={(value) => handleInputChange("investmentCapacity", value)}>
              <SelectTrigger className={errors.investmentCapacity ? "border-destructive" : ""}>
                <SelectValue placeholder="Select capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-50k">&lt;$50k</SelectItem>
                <SelectItem value="50-100k">$50–100k</SelectItem>
                <SelectItem value="100-250k">$100–250k</SelectItem>
                <SelectItem value="250-500k">$250k–$500k</SelectItem>
                <SelectItem value="500k-plus">$500k+</SelectItem>
              </SelectContent>
            </Select>
            {errors.investmentCapacity && <p className="text-sm text-destructive mt-1">{errors.investmentCapacity}</p>}
          </div>
          
          <div>
            <Label>Preferred Franchise Model</Label>
            <div className="mt-2 space-y-2">
              {["Retail Storefront", "Gold Exchange Kiosk", "Teller/Counter", "Online-Only", "Hybrid"].map(model => (
                <div key={model} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`model-${model}`}
                    checked={formData.franchiseModel.includes(model)}
                    onCheckedChange={(checked) => handleCheckboxChange("franchiseModel", model, checked as boolean)}
                  />
                  <Label htmlFor={`model-${model}`}>{model}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h4 className="font-semibold mb-4">Documents (optional)</h4>
        <div>
          <Label htmlFor="businessLicense">Business License / ID</Label>
          <Input
            id="businessLicense"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleInputChange("businessLicense", e.target.files?.[0] || null)}
          />
          <p className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
        </div>
      </div>

      {/* Motivation */}
      <div>
        <h4 className="font-semibold mb-4">Motivation</h4>
        <div>
          <Label htmlFor="motivation">Why this city and why PBCEx?</Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => handleInputChange("motivation", e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  const renderBankPartnerForm = () => (
    <div className="space-y-6">
      {/* Institution */}
      <div>
        <h4 className="font-semibold mb-4">Institution</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="institutionName">Institution Name *</Label>
            <Input
              id="institutionName"
              value={formData.institutionName}
              onChange={(e) => handleInputChange("institutionName", e.target.value)}
              data-error={!!errors.institutionName}
              className={errors.institutionName ? "border-destructive" : ""}
            />
            {errors.institutionName && <p className="text-sm text-destructive mt-1">{errors.institutionName}</p>}
          </div>
          <div>
            <Label htmlFor="countryOfIncorporation">Country of Incorporation *</Label>
            <Select value={formData.countryOfIncorporation} onValueChange={(value) => handleInputChange("countryOfIncorporation", value)}>
              <SelectTrigger className={errors.countryOfIncorporation ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.countryOfIncorporation && <p className="text-sm text-destructive mt-1">{errors.countryOfIncorporation}</p>}
          </div>
          <div>
            <Label htmlFor="regulatoryStatus">Regulatory Status *</Label>
            <Select value={formData.regulatoryStatus} onValueChange={(value) => handleInputChange("regulatoryStatus", value)}>
              <SelectTrigger className={errors.regulatoryStatus ? "border-destructive" : ""}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="licensed-bank">Licensed Bank</SelectItem>
                <SelectItem value="emi">EMI</SelectItem>
                <SelectItem value="msb">MSB</SelectItem>
                <SelectItem value="custodian">Custodian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.regulatoryStatus && <p className="text-sm text-destructive mt-1">{errors.regulatoryStatus}</p>}
          </div>
          <div>
            <Label htmlFor="assetsUnderManagement">Assets Under Management</Label>
            <Input
              id="assetsUnderManagement"
              value={formData.assetsUnderManagement}
              onChange={(e) => handleInputChange("assetsUnderManagement", e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <h4 className="font-semibold mb-4">Primary Contact</h4>
        <div>
          <Label htmlFor="contactTitle">Contact Title *</Label>
          <Input
            id="contactTitle"
            value={formData.contactTitle}
            onChange={(e) => handleInputChange("contactTitle", e.target.value)}
            data-error={!!errors.contactTitle}
            className={errors.contactTitle ? "border-destructive" : ""}
          />
          {errors.contactTitle && <p className="text-sm text-destructive mt-1">{errors.contactTitle}</p>}
        </div>
      </div>

      {/* Focus Areas */}
      <div>
        <h4 className="font-semibold mb-4">Focus Areas</h4>
        <div>
          <Label>Preferred Partnership Areas</Label>
          <div className="mt-2 space-y-2">
            {["FX/Settlement", "Custody", "API Integration", "Payments", "Vaulting", "Card Issuing"].map(area => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox 
                  id={`area-${area}`}
                  checked={formData.partnershipAreas.includes(area)}
                  onCheckedChange={(checked) => handleCheckboxChange("partnershipAreas", area, checked as boolean)}
                />
                <Label htmlFor={`area-${area}`}>{area}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div>
        <h4 className="font-semibold mb-4">Compliance</h4>
        <div>
          <Label htmlFor="regulatoryApproval">License / Regulatory Approval</Label>
          <Input
            id="regulatoryApproval"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleInputChange("regulatoryApproval", e.target.files?.[0] || null)}
          />
          <p className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
        </div>
      </div>
    </div>
  );

  const renderCommodityProviderForm = () => (
    <div className="space-y-6">
      {/* Company */}
      <div>
        <h4 className="font-semibold mb-4">Company</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              data-error={!!errors.companyName}
              className={errors.companyName ? "border-destructive" : ""}
            />
            {errors.companyName && <p className="text-sm text-destructive mt-1">{errors.companyName}</p>}
          </div>
          <div>
            <Label htmlFor="countryOfOperation">Country of Operation *</Label>
            <Select value={formData.countryOfOperation} onValueChange={(value) => handleInputChange("countryOfOperation", value)}>
              <SelectTrigger className={errors.countryOfOperation ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.countryOfOperation && <p className="text-sm text-destructive mt-1">{errors.countryOfOperation}</p>}
          </div>
          <div>
            <Label htmlFor="authorizedSignatory">Authorized Signatory Name & Title *</Label>
            <Input
              id="authorizedSignatory"
              value={formData.authorizedSignatory}
              onChange={(e) => handleInputChange("authorizedSignatory", e.target.value)}
              data-error={!!errors.authorizedSignatory}
              className={errors.authorizedSignatory ? "border-destructive" : ""}
              placeholder="Name and Title"
            />
            {errors.authorizedSignatory && <p className="text-sm text-destructive mt-1">{errors.authorizedSignatory}</p>}
          </div>
        </div>
      </div>

      {/* Supply */}
      <div>
        <h4 className="font-semibold mb-4">Supply</h4>
        <div className="space-y-4">
          <div>
            <Label>Primary Commodities Supplied *</Label>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {commodities.map(commodity => (
                <div key={commodity} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`commodity-${commodity}`}
                    checked={formData.primaryCommodities.includes(commodity)}
                    onCheckedChange={(checked) => handleCheckboxChange("primaryCommodities", commodity, checked as boolean)}
                  />
                  <Label htmlFor={`commodity-${commodity}`}>{commodity}</Label>
                </div>
              ))}
            </div>
            {formData.primaryCommodities.includes("Other") && (
              <Input
                placeholder="Specify other commodity"
                value={formData.otherCommodity}
                onChange={(e) => handleInputChange("otherCommodity", e.target.value)}
                className="mt-2"
              />
            )}
            {errors.primaryCommodities && <p className="text-sm text-destructive mt-1">{errors.primaryCommodities}</p>}
          </div>
          <div>
            <Label htmlFor="annualCapacity">Annual Production / Supply Capacity *</Label>
            <Input
              id="annualCapacity"
              value={formData.annualCapacity}
              onChange={(e) => handleInputChange("annualCapacity", e.target.value)}
              data-error={!!errors.annualCapacity}
              className={errors.annualCapacity ? "border-destructive" : ""}
              placeholder="e.g., 1000 tons/year"
            />
            {errors.annualCapacity && <p className="text-sm text-destructive mt-1">{errors.annualCapacity}</p>}
          </div>
        </div>
      </div>

      {/* Trade/Logistics */}
      <div>
        <h4 className="font-semibold mb-4">Trade/Logistics</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fulfillmentMethod">Preferred Fulfillment Method *</Label>
            <Select value={formData.fulfillmentMethod} onValueChange={(value) => handleInputChange("fulfillmentMethod", value)}>
              <SelectTrigger className={errors.fulfillmentMethod ? "border-destructive" : ""}>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bonded-warehouse">Bonded Warehouse</SelectItem>
                <SelectItem value="cif">CIF</SelectItem>
                <SelectItem value="fob">FOB</SelectItem>
                <SelectItem value="direct-fill">Direct Fill</SelectItem>
              </SelectContent>
            </Select>
            {errors.fulfillmentMethod && <p className="text-sm text-destructive mt-1">{errors.fulfillmentMethod}</p>}
          </div>
          <div>
            <Label htmlFor="exportLicenses">Existing Export/Customs Licenses *</Label>
            <Input
              id="exportLicenses"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleInputChange("exportLicenses", e.target.files?.[0] || null)}
            />
            <p className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
          </div>
          <div>
            <Label htmlFor="incotermsPreference">Incoterms Preference</Label>
            <Select value={formData.incotermsPreference} onValueChange={(value) => handleInputChange("incotermsPreference", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select incoterms" />
              </SelectTrigger>
              <SelectContent>
                {incoterms.map(term => (
                  <SelectItem key={term} value={term}>{term}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h4 className="font-semibold mb-4">Notes</h4>
        <div>
          <Label htmlFor="additionalDetails">Additional Details</Label>
          <Textarea
            id="additionalDetails"
            value={formData.additionalDetails}
            onChange={(e) => handleInputChange("additionalDetails", e.target.value)}
            rows={4}
            placeholder="Any additional information about your supply capabilities..."
          />
        </div>
      </div>
    </div>
  );

  const renderCustomerVoteForm = () => (
    <div className="space-y-6">
      {/* Location Preference */}
      <div>
        <h4 className="font-semibold mb-4">Location Preference</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cityWanted">City you want a PBCEx in *</Label>
            <Input
              id="cityWanted"
              value={formData.cityWanted}
              onChange={(e) => handleInputChange("cityWanted", e.target.value)}
              data-error={!!errors.cityWanted}
              className={errors.cityWanted ? "border-destructive" : ""}
            />
            {errors.cityWanted && <p className="text-sm text-destructive mt-1">{errors.cityWanted}</p>}
          </div>
          <div>
            <Label htmlFor="countryWanted">Country *</Label>
            <Select value={formData.countryWanted} onValueChange={(value) => handleInputChange("countryWanted", value)}>
              <SelectTrigger className={errors.countryWanted ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.countryWanted && <p className="text-sm text-destructive mt-1">{errors.countryWanted}</p>}
          </div>
        </div>
      </div>

      {/* Interest */}
      <div>
        <h4 className="font-semibold mb-4">Interest</h4>
        <div className="space-y-4">
          <div>
            <Label>Would you be a customer if this franchise opened? *</Label>
            <RadioGroup 
              value={formData.wouldBeCustomer} 
              onValueChange={(value) => handleInputChange("wouldBeCustomer", value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="customer-yes" />
                <Label htmlFor="customer-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="customer-no" />
                <Label htmlFor="customer-no">No</Label>
              </div>
            </RadioGroup>
            {errors.wouldBeCustomer && <p className="text-sm text-destructive mt-1">{errors.wouldBeCustomer}</p>}
          </div>
          <div>
            <Label htmlFor="likelyToUse">How likely are you to use PBCEx (trading, payments, redemption)? *</Label>
            <Select value={formData.likelyToUse} onValueChange={(value) => handleInputChange("likelyToUse", value)}>
              <SelectTrigger className={errors.likelyToUse ? "border-destructive" : ""}>
                <SelectValue placeholder="1-5 scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Unlikely</SelectItem>
                <SelectItem value="2">2 - Unlikely</SelectItem>
                <SelectItem value="3">3 - Neutral</SelectItem>
                <SelectItem value="4">4 - Likely</SelectItem>
                <SelectItem value="5">5 - Very Likely</SelectItem>
              </SelectContent>
            </Select>
            {errors.likelyToUse && <p className="text-sm text-destructive mt-1">{errors.likelyToUse}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneralInquiryForm = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="inquiryType">Inquiry Type *</Label>
        <Select value={formData.inquiryType} onValueChange={(value) => handleInputChange("inquiryType", value)}>
          <SelectTrigger className={errors.inquiryType ? "border-destructive" : ""}>
            <SelectValue placeholder="Select inquiry type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="investor">Investor</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="press">Press</SelectItem>
            <SelectItem value="partnership">Partnership</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.inquiryType && <p className="text-sm text-destructive mt-1">{errors.inquiryType}</p>}
      </div>
      <div>
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange("message", e.target.value)}
          rows={6}
          data-error={!!errors.message}
          className={errors.message ? "border-destructive" : ""}
          placeholder="Tell us about your inquiry..."
        />
        {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start a Franchise or Partner with PBCEx
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose your path and tell us a bit more so the right team can follow up.
            </p>
          </div>

          <Card className="shadow-xl border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-center">I am a...</CardTitle>
              <CardDescription className="text-center">
                Select the option that best describes your interest
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
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
                    <TabsTrigger value="franchise_applicant" className="text-xs p-2">
                      Franchise Applicant
                    </TabsTrigger>
                    <TabsTrigger value="bank_partner" className="text-xs p-2">
                      Bank Partner
                    </TabsTrigger>
                    <TabsTrigger value="commodity_provider" className="text-xs p-2">
                      Commodity Provider
                    </TabsTrigger>
                    <TabsTrigger value="customer_vote" className="text-xs p-2">
                      Customer Vote
                    </TabsTrigger>
                    <TabsTrigger value="general_business_inquiry" className="text-xs p-2">
                      General Business Inquiry
                    </TabsTrigger>
                  </TabsList>

                  {/* Common Fields */}
                  <div>
                    <h3 className="font-semibold mb-4 text-lg border-b pb-2">Contact Information</h3>
                    {renderCommonFields()}
                  </div>

                  {/* Dynamic Form Content */}
                  <TabsContent value="franchise_applicant" className="mt-8">
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4 text-lg">Franchise Details</h3>
                      {renderFranchiseApplicantForm()}
                    </div>
                  </TabsContent>

                  <TabsContent value="bank_partner" className="mt-8">
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4 text-lg">Partnership Details</h3>
                      {renderBankPartnerForm()}
                    </div>
                  </TabsContent>

                  <TabsContent value="commodity_provider" className="mt-8">
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4 text-lg">Supply Details</h3>
                      {renderCommodityProviderForm()}
                    </div>
                  </TabsContent>

                  <TabsContent value="customer_vote" className="mt-8">
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4 text-lg">Location Request</h3>
                      {renderCustomerVoteForm()}
                    </div>
                  </TabsContent>

                  <TabsContent value="general_business_inquiry" className="mt-8">
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4 text-lg">Your Inquiry</h3>
                      {renderGeneralInquiryForm()}
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
    </section>
  );
};

export default FranchiseAndPartnershipsForm;