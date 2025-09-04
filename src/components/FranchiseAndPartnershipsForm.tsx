import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const countries = [
  'United States',
  'European Union (EU/EEA)',
  'United Kingdom',
  'China',
  'Hong Kong',
  'Singapore',
  'India',
  'Japan',
  'United Arab Emirates',
  'Saudi Arabia',
  'Nigeria',
  'South Africa',
];

// World cities for the dropdown - abbreviated list for demo
const worldCities = [
  'New York',
  'London',
  'Singapore',
  'Hong Kong',
  'Dubai',
  'Tokyo',
  'Mumbai',
  'Shanghai',
  'Paris',
  'Berlin',
  'Sydney',
  'Toronto',
  'Los Angeles',
  'Chicago',
  'Frankfurt',
  'Zurich',
  'Amsterdam',
  'Stockholm',
  'Madrid',
  'Rome',
  'Bangkok',
  'Seoul',
  'Taipei',
  'Jakarta',
  'Kuala Lumpur',
  'Manila',
  'Ho Chi Minh City',
  'Mexico City',
  'São Paulo',
  'Buenos Aires',
  'Lima',
  'Santiago',
  'Bogotá',
  'Caracas',
  'Lagos',
  'Cairo',
  'Johannesburg',
  'Nairobi',
  'Casablanca',
];

const commoditiesData = {
  'Precious Metals': ['Gold', 'Silver', 'Platinum', 'Palladium', 'Rhodium'],
  'Base & Industrial Metals': [
    'Copper',
    'Aluminum',
    'Nickel',
    'Zinc',
    'Tin',
    'Iron / Steel',
    'Tungsten',
  ],
  Energy: ['Crude Oil', 'Natural Gas', 'Uranium', 'Graphite'],
  'Rare Earth Elements (REEs)': [
    'Neodymium',
    'Dysprosium',
    'Terbium',
    'Yttrium',
    'Praseodymium',
    'Samarium',
    'Europium',
    'Holmium',
    'Erbium',
    'Thulium',
    'Lutetium',
  ],
  'Strategic / Other Metals': [
    'Gallium',
    'Germanium',
    'Indium',
    'Antimony',
    'Bismuth',
    'Tantalum',
    'Scandium',
    'Other (please specify)',
  ],
};

const incoterms = [
  'FOB',
  'CIF',
  'EXW',
  'DDP',
  'FCA',
  'CPT',
  'CIP',
  'DAP',
  'DPU',
];

const FranchiseAndPartnershipsForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formType, setFormType] = useState('franchise_applicant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [commodityDropdownOpen, setCommodityDropdownOpen] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // Common fields
    fullName: '',
    email: '',
    phone: '',

    // Franchise Applicant
    city: '',
    country: 'United States',
    launchTimeline: '',
    ownsBusinessCurrently: '',
    businessName: '',
    investmentCapacity: '',
    franchiseModel: [] as string[],
    businessLicense: null as File | null,
    motivation: '',

    // Bank Partner
    institutionName: '',
    countryOfIncorporation: 'United States',
    regulatoryStatus: '',
    assetsUnderManagement: '',
    numberOfLocations: '',
    contactTitle: '',
    partnershipAreas: [] as string[],
    regulatoryApproval: null as File | null,

    // Commodity Provider
    companyName: '',
    countryOfOperation: 'United States',
    authorizedSignatory: '',
    primaryCommodities: [] as string[],
    otherCommodity: '',
    annualCapacity: '',
    fulfillmentMethod: '',
    exportLicenses: null as File | null,
    incotermsPreference: '',
    additionalDetails: '',

    // Customer Vote / Feedback
    accountNumber: '',
    cityWanted: '',
    countryWanted: 'United States',
    wouldBeCustomer: '',
    likelyToUse: '',
    feedbackImprovement: '',

    // General Business Inquiry
    websiteSocial: '',
    inquiryType: [] as string[],
    message: '',

    // Investor
    investorFirmName: '',
    investorAumRange: '',
    investorType: '',
    investorMessage: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    field: string,
    value: string | string[] | File | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCheckboxChange = (
    field: string,
    value: string,
    checked: boolean
  ) => {
    const currentValues = formData[field as keyof typeof formData] as string[];
    if (checked) {
      handleInputChange(field, [...currentValues, value]);
    } else {
      handleInputChange(
        field,
        currentValues.filter(v => v !== value)
      );
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    // Type-specific validation
    switch (formType) {
      case 'franchise_applicant':
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.launchTimeline)
          newErrors.launchTimeline = 'Launch timeline is required';
        if (!formData.ownsBusinessCurrently)
          newErrors.ownsBusinessCurrently = 'This field is required';
        if (!formData.investmentCapacity)
          newErrors.investmentCapacity = 'Investment capacity is required';
        break;

      case 'bank_partner':
        if (!formData.institutionName.trim())
          newErrors.institutionName = 'Institution name is required';
        if (!formData.countryOfIncorporation)
          newErrors.countryOfIncorporation = 'Country is required';
        if (!formData.regulatoryStatus)
          newErrors.regulatoryStatus = 'Regulatory status is required';
        if (!formData.contactTitle.trim())
          newErrors.contactTitle = 'Contact title is required';
        if (!formData.numberOfLocations.trim())
          newErrors.numberOfLocations = 'Number of locations is required';
        break;

      case 'commodity_provider':
        if (!formData.companyName.trim())
          newErrors.companyName = 'Company name is required';
        if (!formData.countryOfOperation)
          newErrors.countryOfOperation = 'Country is required';
        if (!formData.authorizedSignatory.trim())
          newErrors.authorizedSignatory = 'Authorized signatory is required';
        if (formData.primaryCommodities.length === 0)
          newErrors.primaryCommodities = 'Select at least one commodity';
        if (!formData.annualCapacity.trim())
          newErrors.annualCapacity = 'Annual capacity is required';
        if (!formData.fulfillmentMethod)
          newErrors.fulfillmentMethod = 'Fulfillment method is required';
        break;

      case 'customer_vote':
        if (!formData.cityWanted.trim())
          newErrors.cityWanted = 'City is required';
        if (!formData.countryWanted)
          newErrors.countryWanted = 'Country is required';
        break;

      case 'general_business_inquiry':
        if (formData.inquiryType.length === 0)
          newErrors.inquiryType = 'Select at least one inquiry type';
        if (!formData.message.trim()) newErrors.message = 'Message is required';
        break;

      case 'investor':
        if (!formData.investorType)
          newErrors.investorType = 'Investor type is required';
        if (!formData.investorMessage.trim())
          newErrors.investorMessage = 'Message is required';
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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get lead tag
    const leadTagMap = {
      franchise_applicant: 'franchise_lead',
      bank_partner: 'bank_partner_lead',
      commodity_provider: 'supply_lead',
      customer_vote: 'franchise_vote',
      general_business_inquiry: 'inbound_lead',
      investor: 'investor_lead',
    };

    const payload = {
      formType,
      leadTag: leadTagMap[formType as keyof typeof leadTagMap],
      fields: formData,
      timestamp: new Date().toISOString(),
    };

    console.log('Form submission payload:', payload);

    // Update franchise demand counter
    const store = (window as { franchiseDemandStore?: unknown })
      .franchiseDemandStore;
    const countFranchiseAsFive = (window as { countFranchiseAsFive?: unknown })
      .countFranchiseAsFive;

    if (
      store &&
      typeof store === 'object' &&
      'addRecord' in store &&
      typeof store.addRecord === 'function'
    ) {
      if (formType === 'customer_vote') {
        const result = (store as any).addRecord({
          city: formData.cityWanted,
          country: formData.countryWanted,
          weight: 1,
          source: 'vote',
          email: formData.email,
        });

        if (!result.success) {
          toast({
            title: 'Notice',
            description: result.message,
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      } else if (formType === 'franchise_applicant' && countFranchiseAsFive) {
        (store as any).addRecord({
          city: formData.city,
          country: formData.country,
          weight: 5,
          source: 'franchise',
          email: formData.email,
        });
      }
    }

    toast({
      title: 'Success!',
      description: 'Thanks — we received your submission.',
    });

    // Show additional demand update toast for relevant form types
    if (
      formType === 'customer_vote' ||
      (formType === 'franchise_applicant' && countFranchiseAsFive)
    ) {
      setTimeout(() => {
        toast({
          title: 'Demand Updated',
          description: 'Thanks — demand updated.',
        });
      }, 500);
    }

    setIsSubmitting(false);
    setIsConfirmed(true);

    // Redirect after 4 seconds
    setTimeout(() => {
      const redirectMap = {
        franchise_applicant: '/thank-you?type=franchise',
        bank_partner: '/thank-you?type=franchise',
        commodity_provider: '/thank-you?type=franchise',
        customer_vote: '/thank-you?type=vote',
        general_business_inquiry: '/thank-you?type=contact',
        investor: '/thank-you?type=investor',
      };
      navigate(redirectMap[formType as keyof typeof redirectMap]);
    }, 4000);
  };

  const renderCommonFields = () => (
    <div className='space-y-4'>
      <div className='grid md:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='fullName'>Full Name *</Label>
          <Input
            id='fullName'
            value={formData.fullName}
            onChange={e => handleInputChange('fullName', e.target.value)}
            data-error={!!errors.fullName}
            className={errors.fullName ? 'border-destructive' : ''}
          />
          {errors.fullName && (
            <p className='text-sm text-destructive mt-1'>{errors.fullName}</p>
          )}
        </div>
        <div>
          <Label htmlFor='email'>Email *</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            data-error={!!errors.email}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className='text-sm text-destructive mt-1'>{errors.email}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor='phone'>Phone *</Label>
        <Input
          id='phone'
          type='tel'
          value={formData.phone}
          onChange={e => handleInputChange('phone', e.target.value)}
          data-error={!!errors.phone}
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && (
          <p className='text-sm text-destructive mt-1'>{errors.phone}</p>
        )}
      </div>
    </div>
  );

  const renderFranchiseApplicantForm = () => (
    <div className='space-y-6'>
      {/* Expansion Target */}
      <div>
        <h4 className='font-semibold mb-4'>Expansion Target</h4>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='city'>City you want to open in *</Label>
            <Input
              id='city'
              value={formData.city}
              onChange={e => handleInputChange('city', e.target.value)}
              data-error={!!errors.city}
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && (
              <p className='text-sm text-destructive mt-1'>{errors.city}</p>
            )}
          </div>
          <div>
            <Label htmlFor='country'>Country *</Label>
            <Select
              value={formData.country}
              onValueChange={value => handleInputChange('country', value)}
            >
              <SelectTrigger
                className={errors.country ? 'border-destructive' : ''}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className='text-sm text-destructive mt-1'>{errors.country}</p>
            )}
          </div>
          <div>
            <Label htmlFor='launchTimeline'>Launch Timeline *</Label>
            <Select
              value={formData.launchTimeline}
              onValueChange={value =>
                handleInputChange('launchTimeline', value)
              }
            >
              <SelectTrigger
                className={errors.launchTimeline ? 'border-destructive' : ''}
              >
                <SelectValue placeholder='Select timeline' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='0-3-months'>0–3 months</SelectItem>
                <SelectItem value='3-6-months'>3–6 months</SelectItem>
                <SelectItem value='6-12-months'>6–12 months</SelectItem>
                <SelectItem value='12-plus-months'>&gt;12 months</SelectItem>
              </SelectContent>
            </Select>
            {errors.launchTimeline && (
              <p className='text-sm text-destructive mt-1'>
                {errors.launchTimeline}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Operator Profile */}
      <div>
        <h4 className='font-semibold mb-4'>Operator Profile</h4>
        <div className='space-y-4'>
          <div>
            <Label>Do you currently own/operate a business? *</Label>
            <RadioGroup
              value={formData.ownsBusinessCurrently}
              onValueChange={value =>
                handleInputChange('ownsBusinessCurrently', value)
              }
              className='mt-2'
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='yes' id='owns-yes' />
                <Label htmlFor='owns-yes'>Yes</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='no' id='owns-no' />
                <Label htmlFor='owns-no'>No</Label>
              </div>
            </RadioGroup>
            {errors.ownsBusinessCurrently && (
              <p className='text-sm text-destructive mt-1'>
                {errors.ownsBusinessCurrently}
              </p>
            )}
          </div>

          {formData.ownsBusinessCurrently === 'yes' && (
            <div>
              <Label htmlFor='businessName'>Business Name</Label>
              <Input
                id='businessName'
                value={formData.businessName}
                onChange={e =>
                  handleInputChange('businessName', e.target.value)
                }
              />
            </div>
          )}

          <div>
            <Label htmlFor='investmentCapacity'>Investment Capacity *</Label>
            <Select
              value={formData.investmentCapacity}
              onValueChange={value =>
                handleInputChange('investmentCapacity', value)
              }
            >
              <SelectTrigger
                className={
                  errors.investmentCapacity ? 'border-destructive' : ''
                }
              >
                <SelectValue placeholder='Select capacity' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='under-50k'>&lt;$50k</SelectItem>
                <SelectItem value='50-100k'>$50–100k</SelectItem>
                <SelectItem value='100-250k'>$100–250k</SelectItem>
                <SelectItem value='250-500k'>$250–500k</SelectItem>
                <SelectItem value='500k-1m'>$500k–$1M</SelectItem>
                <SelectItem value='1m-10m'>$1M–$10M</SelectItem>
                <SelectItem value='10m-plus'>$10M+</SelectItem>
              </SelectContent>
            </Select>
            {errors.investmentCapacity && (
              <p className='text-sm text-destructive mt-1'>
                {errors.investmentCapacity}
              </p>
            )}
          </div>

          <div>
            <Label>Preferred Franchise Model</Label>
            <div className='mt-2 space-y-3'>
              {[
                {
                  value: 'Retail Storefront',
                  description:
                    'Full branch experience: customer deposits & withdrawals, cash-to-gold exchange, and retail precious-metals sales.',
                },
                {
                  value: 'Gold FX Exchange Kiosk',
                  description:
                    'Small footprint (mall/airport kiosk) for fast foreign exchange, gold-token sales, and basic deposits/withdrawals.',
                },
                {
                  value: 'Teller / Counter',
                  description:
                    'Bank-counter services only: deposits, withdrawals, and account setup. No on-site retail sales or trading.',
                },
                {
                  value: 'Online-Only',
                  description:
                    'Digital-first operator or metals provider who can fulfill orders in-country via logistics partners. No physical storefront.',
                },
                {
                  value: 'Hybrid',
                  description:
                    'Combination model (e.g., teller/counter + retail FX/gold sales); configure based on local demand and footprint.',
                },
              ].map(model => (
                <div key={model.value} className='flex items-start space-x-2'>
                  <Checkbox
                    id={`model-${model.value}`}
                    checked={formData.franchiseModel.includes(model.value)}
                    onCheckedChange={checked =>
                      handleCheckboxChange(
                        'franchiseModel',
                        model.value,
                        checked as boolean
                      )
                    }
                    className='mt-1'
                  />
                  <div className='flex-1'>
                    <Label
                      htmlFor={`model-${model.value}`}
                      className='cursor-pointer'
                    >
                      {model.value}
                    </Label>
                    <p
                      className='text-sm text-muted-foreground mt-1 leading-relaxed'
                      aria-describedby={`model-${model.value}`}
                    >
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h4 className='font-semibold mb-4'>Documents (optional)</h4>
        <div>
          <Label htmlFor='businessLicense'>Business License / ID</Label>
          <Input
            id='businessLicense'
            type='file'
            accept='.pdf,.jpg,.jpeg,.png'
            onChange={e =>
              handleInputChange('businessLicense', e.target.files?.[0] || null)
            }
          />
          <p className='text-sm text-muted-foreground mt-1'>
            PDF, JPG, PNG up to 10MB
          </p>
        </div>
      </div>

      {/* Motivation */}
      <div>
        <h4 className='font-semibold mb-4'>Motivation</h4>
        <div>
          <Label htmlFor='motivation'>Why this city and why PBCEx?</Label>
          <Textarea
            id='motivation'
            value={formData.motivation}
            onChange={e => handleInputChange('motivation', e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  const renderBankPartnerForm = () => (
    <div className='space-y-6'>
      {/* Institution */}
      <div>
        <h4 className='font-semibold mb-4'>Institution</h4>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='institutionName'>Institution Name *</Label>
            <Input
              id='institutionName'
              value={formData.institutionName}
              onChange={e =>
                handleInputChange('institutionName', e.target.value)
              }
              data-error={!!errors.institutionName}
              className={errors.institutionName ? 'border-destructive' : ''}
            />
            {errors.institutionName && (
              <p className='text-sm text-destructive mt-1'>
                {errors.institutionName}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='countryOfIncorporation'>
              Country of Incorporation *
            </Label>
            <Select
              value={formData.countryOfIncorporation}
              onValueChange={value =>
                handleInputChange('countryOfIncorporation', value)
              }
            >
              <SelectTrigger
                className={
                  errors.countryOfIncorporation ? 'border-destructive' : ''
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.countryOfIncorporation && (
              <p className='text-sm text-destructive mt-1'>
                {errors.countryOfIncorporation}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='regulatoryStatus'>Regulatory Status *</Label>
            <Select
              value={formData.regulatoryStatus}
              onValueChange={value =>
                handleInputChange('regulatoryStatus', value)
              }
            >
              <SelectTrigger
                className={errors.regulatoryStatus ? 'border-destructive' : ''}
              >
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='licensed-bank'>Licensed Bank</SelectItem>
                <SelectItem value='emi'>EMI</SelectItem>
                <SelectItem value='msb'>MSB</SelectItem>
                <SelectItem value='custodian'>Custodian</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.regulatoryStatus && (
              <p className='text-sm text-destructive mt-1'>
                {errors.regulatoryStatus}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='assetsUnderManagement'>
              Assets Under Management
            </Label>
            <Input
              id='assetsUnderManagement'
              value={formData.assetsUnderManagement}
              onChange={e =>
                handleInputChange('assetsUnderManagement', e.target.value)
              }
              placeholder='Optional'
            />
          </div>
          <div>
            <Label htmlFor='numberOfLocations'>Number of Locations *</Label>
            <Input
              id='numberOfLocations'
              type='number'
              min='1'
              value={formData.numberOfLocations || ''}
              onChange={e =>
                handleInputChange('numberOfLocations', e.target.value)
              }
              data-error={!!errors.numberOfLocations}
              className={errors.numberOfLocations ? 'border-destructive' : ''}
              placeholder='Total number of branch locations'
            />
            {errors.numberOfLocations && (
              <p className='text-sm text-destructive mt-1'>
                {errors.numberOfLocations}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <h4 className='font-semibold mb-4'>Primary Contact</h4>
        <div>
          <Label htmlFor='contactTitle'>Contact Title *</Label>
          <Input
            id='contactTitle'
            value={formData.contactTitle}
            onChange={e => handleInputChange('contactTitle', e.target.value)}
            data-error={!!errors.contactTitle}
            className={errors.contactTitle ? 'border-destructive' : ''}
          />
          {errors.contactTitle && (
            <p className='text-sm text-destructive mt-1'>
              {errors.contactTitle}
            </p>
          )}
        </div>
      </div>

      {/* Focus Areas */}
      <div>
        <h4 className='font-semibold mb-4'>Focus Areas</h4>
        <div>
          <Label>Preferred Partnership Areas</Label>
          <div className='mt-2 space-y-3'>
            {[
              {
                value: 'Integrate PBCEx Rails',
                description:
                  'Embed PBCEx into your bank, letting customers hold and transact in precious metals alongside fiat.',
              },
              {
                value: 'FX Settlement',
                description:
                  'Enable cross-border exchange and settlement for remittances and wires.',
              },
              {
                value: 'Custody',
                description:
                  'Offer insured custody of tokenized metals and fiat via PBCEx vault partners.',
              },
              {
                value: 'API Integration (Trading)',
                description:
                  'Trading APIs so clients can buy/sell metals and FX pairs directly in your apps.',
              },
              {
                value: 'Payments',
                description:
                  'Cards and QR payments linked to asset-backed accounts for retail customers.',
              },
              {
                value: 'Vaulting',
                description:
                  'Institutional vault access with full insurance for metals storage and settlements.',
              },
              {
                value: 'Card Issuing',
                description:
                  'Provide branded debit/credit cards tied to PBCEx rails.',
              },
              {
                value: 'Retail Metals Sales',
                description:
                  'Enable OTC gold/silver/platinum sales at your bank branches via PBCEx suppliers.',
              },
              {
                value: 'Future: Home Loan Program',
                description:
                  'Offer mortgages collateralized by tokenized metals and bonds (asset-backed, halal-finance compatible).',
              },
            ].map(area => (
              <div key={area.value} className='flex items-start space-x-2'>
                <Checkbox
                  id={`area-${area.value}`}
                  checked={formData.partnershipAreas.includes(area.value)}
                  onCheckedChange={checked =>
                    handleCheckboxChange(
                      'partnershipAreas',
                      area.value,
                      checked as boolean
                    )
                  }
                  className='mt-1'
                />
                <div className='flex-1'>
                  <Label
                    htmlFor={`area-${area.value}`}
                    className='cursor-pointer'
                  >
                    {area.value}
                  </Label>
                  <p
                    className='text-sm text-muted-foreground mt-1 leading-relaxed'
                    aria-describedby={`area-${area.value}`}
                  >
                    {area.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div>
        <h4 className='font-semibold mb-4'>Compliance</h4>
        <div>
          <Label htmlFor='regulatoryApproval'>
            License / Regulatory Approval
          </Label>
          <Input
            id='regulatoryApproval'
            type='file'
            accept='.pdf,.jpg,.jpeg,.png'
            onChange={e =>
              handleInputChange(
                'regulatoryApproval',
                e.target.files?.[0] || null
              )
            }
          />
          <p className='text-sm text-muted-foreground mt-1'>
            PDF, JPG, PNG up to 10MB
          </p>
        </div>
      </div>
    </div>
  );

  const renderCommodityProviderForm = () => {
    const handleCommoditySelect = (commodity: string) => {
      const currentValues = formData.primaryCommodities;
      if (currentValues.includes(commodity)) {
        handleInputChange(
          'primaryCommodities',
          currentValues.filter(v => v !== commodity)
        );
      } else {
        handleInputChange('primaryCommodities', [...currentValues, commodity]);
      }

      // If "Other (please specify)" was unselected, clear the other commodity field
      if (
        commodity === 'Other (please specify)' &&
        currentValues.includes(commodity)
      ) {
        handleInputChange('otherCommodity', '');
      }
    };

    const removeCommodity = (commodity: string) => {
      const currentValues = formData.primaryCommodities;
      handleInputChange(
        'primaryCommodities',
        currentValues.filter(v => v !== commodity)
      );

      if (commodity === 'Other (please specify)') {
        handleInputChange('otherCommodity', '');
      }
    };

    return (
      <div className='space-y-6'>
        {/* Intro Pitch */}
        <div className='p-4 bg-muted/20 rounded-lg border-l-4 border-primary'>
          <p className='text-sm leading-relaxed'>
            Join the PBCEx global supply network. Connect your commodities
            directly to our marketplace and participate as a co-market maker
            with us. Approved providers can set pricing margins, fulfill orders
            locally, and reach institutional buyers worldwide. As we expand
            through Phases 1, 3, and 4B, eligible partners gain additional
            routes for settlement, hedging, and distribution.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4 className='font-semibold mb-4'>Company</h4>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='companyName'>Company Name *</Label>
              <Input
                id='companyName'
                value={formData.companyName}
                onChange={e => handleInputChange('companyName', e.target.value)}
                data-error={!!errors.companyName}
                className={errors.companyName ? 'border-destructive' : ''}
              />
              {errors.companyName && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.companyName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor='countryOfOperation'>Country of Operation *</Label>
              <Select
                value={formData.countryOfOperation}
                onValueChange={value =>
                  handleInputChange('countryOfOperation', value)
                }
              >
                <SelectTrigger
                  className={
                    errors.countryOfOperation ? 'border-destructive' : ''
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.countryOfOperation && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.countryOfOperation}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor='authorizedSignatory'>
                Authorized Signatory Name & Title *
              </Label>
              <Input
                id='authorizedSignatory'
                value={formData.authorizedSignatory}
                onChange={e =>
                  handleInputChange('authorizedSignatory', e.target.value)
                }
                data-error={!!errors.authorizedSignatory}
                className={
                  errors.authorizedSignatory ? 'border-destructive' : ''
                }
                placeholder='Name and Title'
              />
              {errors.authorizedSignatory && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.authorizedSignatory}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Supply */}
        <div>
          <h4 className='font-semibold mb-4'>Supply</h4>
          <div className='space-y-4'>
            <div>
              <Label>Primary Commodities Supplied *</Label>
              <Popover
                open={commodityDropdownOpen}
                onOpenChange={setCommodityDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={commodityDropdownOpen}
                    className={`w-full justify-between min-h-[40px] ${errors.primaryCommodities ? 'border-destructive' : ''}`}
                  >
                    <div className='flex flex-wrap gap-1 flex-1 text-left'>
                      {formData.primaryCommodities.length === 0 ? (
                        <span className='text-muted-foreground'>
                          Select commodities...
                        </span>
                      ) : (
                        formData.primaryCommodities.map(commodity => (
                          <Badge
                            key={commodity}
                            variant='secondary'
                            className='mr-1 mb-1'
                            onClick={e => {
                              e.stopPropagation();
                              removeCommodity(commodity);
                            }}
                          >
                            {commodity}
                            <X className='h-3 w-3 ml-1 cursor-pointer' />
                          </Badge>
                        ))
                      )}
                    </div>
                    <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-0' align='start'>
                  <Command>
                    <div className='flex items-center border-b px-3'>
                      <input
                        className='flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
                        placeholder='Search commodities...'
                      />
                    </div>
                    <CommandList className='max-h-60'>
                      <CommandEmpty>No commodities found.</CommandEmpty>
                      {Object.entries(commoditiesData).map(
                        ([category, items]) => (
                          <CommandGroup key={category} heading={category}>
                            {items.map(commodity => (
                              <CommandItem
                                key={commodity}
                                onSelect={() =>
                                  handleCommoditySelect(commodity)
                                }
                                className='cursor-pointer'
                              >
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    checked={formData.primaryCommodities.includes(
                                      commodity
                                    )}
                                  />
                                  <span>{commodity}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.primaryCommodities.includes(
                'Other (please specify)'
              ) && (
                <Input
                  placeholder='Specify other commodity'
                  value={formData.otherCommodity}
                  onChange={e =>
                    handleInputChange('otherCommodity', e.target.value)
                  }
                  className='mt-2'
                />
              )}
              {errors.primaryCommodities && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.primaryCommodities}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor='annualCapacity'>
                Annual Production / Supply Capacity *
              </Label>
              <Input
                id='annualCapacity'
                value={formData.annualCapacity}
                onChange={e =>
                  handleInputChange('annualCapacity', e.target.value)
                }
                data-error={!!errors.annualCapacity}
                className={errors.annualCapacity ? 'border-destructive' : ''}
                placeholder='e.g., 1000 tons/year'
              />
              {errors.annualCapacity && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.annualCapacity}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trade/Logistics */}
        <div>
          <h4 className='font-semibold mb-4'>Trade/Logistics</h4>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='fulfillmentMethod'>
                Preferred Fulfillment Method *
              </Label>
              <Select
                value={formData.fulfillmentMethod}
                onValueChange={value =>
                  handleInputChange('fulfillmentMethod', value)
                }
              >
                <SelectTrigger
                  className={
                    errors.fulfillmentMethod ? 'border-destructive' : ''
                  }
                >
                  <SelectValue placeholder='Select method' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='bonded-warehouse'>
                    Bonded Warehouse
                  </SelectItem>
                  <SelectItem value='cif'>CIF</SelectItem>
                  <SelectItem value='fob'>FOB</SelectItem>
                  <SelectItem value='direct-fill'>Direct Fill</SelectItem>
                </SelectContent>
              </Select>
              {errors.fulfillmentMethod && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.fulfillmentMethod}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor='exportLicenses'>
                Existing Export/Customs Licenses *
              </Label>
              <Input
                id='exportLicenses'
                type='file'
                accept='.pdf,.jpg,.jpeg,.png'
                onChange={e =>
                  handleInputChange(
                    'exportLicenses',
                    e.target.files?.[0] || null
                  )
                }
              />
              <p className='text-sm text-muted-foreground mt-1'>
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
            <div>
              <Label htmlFor='incotermsPreference'>Incoterms Preference</Label>
              <Select
                value={formData.incotermsPreference}
                onValueChange={value =>
                  handleInputChange('incotermsPreference', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select incoterms' />
                </SelectTrigger>
                <SelectContent>
                  {incoterms.map(term => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className='font-semibold mb-4'>Notes</h4>
          <div>
            <Label htmlFor='additionalDetails'>Additional Details</Label>
            <Textarea
              id='additionalDetails'
              value={formData.additionalDetails}
              onChange={e =>
                handleInputChange('additionalDetails', e.target.value)
              }
              rows={4}
              placeholder='Any additional information about your supply capabilities...'
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerVoteForm = () => (
    <div className='space-y-6'>
      <div>
        <Label htmlFor='accountNumber'>PBCEx Account Number</Label>
        <Input
          id='accountNumber'
          value={formData.accountNumber}
          onChange={e => handleInputChange('accountNumber', e.target.value)}
          placeholder='If you already have one'
        />
        <p className='text-sm text-muted-foreground mt-1'>
          If you already have one
        </p>
      </div>

      {/* Location Preference */}
      <div>
        <Label htmlFor='cityWanted'>City *</Label>
        <Select
          value={formData.cityWanted}
          onValueChange={value => handleInputChange('cityWanted', value)}
        >
          <SelectTrigger
            className={errors.cityWanted ? 'border-destructive' : ''}
          >
            <SelectValue placeholder='Select city' />
          </SelectTrigger>
          <SelectContent>
            <div className='p-2'>
              <Input placeholder='Search cities...' className='mb-2' />
            </div>
            {worldCities.map(city => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cityWanted && (
          <p className='text-sm text-destructive mt-1'>{errors.cityWanted}</p>
        )}
      </div>

      <div>
        <Label htmlFor='countryWanted'>Country *</Label>
        <Select
          value={formData.countryWanted}
          onValueChange={value => handleInputChange('countryWanted', value)}
        >
          <SelectTrigger
            className={errors.countryWanted ? 'border-destructive' : ''}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countries.map(country => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.countryWanted && (
          <p className='text-sm text-destructive mt-1'>
            {errors.countryWanted}
          </p>
        )}
      </div>

      <div>
        <Label>Would you be a customer if this franchise opened?</Label>
        <RadioGroup
          value={formData.wouldBeCustomer}
          onValueChange={value => handleInputChange('wouldBeCustomer', value)}
          className='mt-2'
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='yes' id='customer-yes' />
            <Label htmlFor='customer-yes'>Yes</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='no' id='customer-no' />
            <Label htmlFor='customer-no'>No</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor='likelyToUse'>
          How likely are you to use PBCEx (trading, payments, redemption)?
        </Label>
        <Select
          value={formData.likelyToUse}
          onValueChange={value => handleInputChange('likelyToUse', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder='1-5 scale' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='1'>1 - Very Unlikely</SelectItem>
            <SelectItem value='2'>2 - Unlikely</SelectItem>
            <SelectItem value='3'>3 - Neutral</SelectItem>
            <SelectItem value='4'>4 - Likely</SelectItem>
            <SelectItem value='5'>5 - Very Likely</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor='feedbackImprovement'>
          What would you like to see improved in PBCEx?
        </Label>
        <Textarea
          id='feedbackImprovement'
          value={formData.feedbackImprovement}
          onChange={e =>
            handleInputChange('feedbackImprovement', e.target.value)
          }
          rows={3}
          placeholder='Features or recommendations to make PBCEx better'
        />
        <p className='text-sm text-muted-foreground mt-1'>
          Features or recommendations to make PBCEx better
        </p>
      </div>
    </div>
  );

  const renderGeneralInquiryForm = () => (
    <div className='space-y-6'>
      <div>
        <Label htmlFor='websiteSocial'>Website / Social Media</Label>
        <Input
          id='websiteSocial'
          value={formData.websiteSocial}
          onChange={e => handleInputChange('websiteSocial', e.target.value)}
          placeholder='Share your site, Twitter/X, or LinkedIn'
        />
        <p className='text-sm text-muted-foreground mt-1'>
          Share your site, Twitter/X, or LinkedIn
        </p>
      </div>

      <div>
        <Label>Inquiry Type *</Label>
        <div className='mt-2 space-y-3'>
          {[
            'Investor',
            'Bank / Financial Institution',
            'Commodity Provider',
            'Blockchain / Technology Partner',
            'Exchange / Trading Platform',
            'Vendor / Service Provider',
            'Press / Media',
            'Partnership (general)',
            'Other',
          ].map(type => (
            <div key={type} className='flex items-center space-x-2'>
              <Checkbox
                id={`inquiry-${type.toLowerCase().replace(/\s+/g, '-').replace('/', '-')}`}
                checked={formData.inquiryType.includes(type)}
                onCheckedChange={checked =>
                  handleCheckboxChange('inquiryType', type, checked as boolean)
                }
              />
              <Label
                htmlFor={`inquiry-${type.toLowerCase().replace(/\s+/g, '-').replace('/', '-')}`}
              >
                {type}
              </Label>
            </div>
          ))}
        </div>
        {errors.inquiryType && (
          <p className='text-sm text-destructive mt-1'>{errors.inquiryType}</p>
        )}
      </div>

      <div>
        <Label htmlFor='message'>Message *</Label>
        <Textarea
          id='message'
          value={formData.message}
          onChange={e => handleInputChange('message', e.target.value)}
          rows={6}
          data-error={!!errors.message}
          className={errors.message ? 'border-destructive' : ''}
          placeholder='Tell us about your inquiry...'
        />
        {errors.message && (
          <p className='text-sm text-destructive mt-1'>{errors.message}</p>
        )}
      </div>
    </div>
  );

  const renderInvestorForm = () => (
    <div className='space-y-6'>
      <div>
        <Label htmlFor='investorFirmName'>Firm/Company Name</Label>
        <Input
          id='investorFirmName'
          value={formData.investorFirmName}
          onChange={e => handleInputChange('investorFirmName', e.target.value)}
          placeholder='Optional'
        />
      </div>

      <div>
        <Label htmlFor='investorAumRange'>AUM / Investment Range</Label>
        <Input
          id='investorAumRange'
          value={formData.investorAumRange}
          onChange={e => handleInputChange('investorAumRange', e.target.value)}
          placeholder='e.g., $1M-$10M, $50M+, etc.'
        />
      </div>

      <div>
        <Label htmlFor='investorType'>Investor Type *</Label>
        <Select
          value={formData.investorType}
          onValueChange={value => handleInputChange('investorType', value)}
        >
          <SelectTrigger
            className={errors.investorType ? 'border-destructive' : ''}
          >
            <SelectValue placeholder='Select investor type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='vc'>VC</SelectItem>
            <SelectItem value='family-office'>Family Office</SelectItem>
            <SelectItem value='institutional'>Institutional</SelectItem>
            <SelectItem value='angel'>Angel</SelectItem>
            <SelectItem value='other'>Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.investorType && (
          <p className='text-sm text-destructive mt-1'>{errors.investorType}</p>
        )}
      </div>

      <div>
        <Label htmlFor='investorMessage'>Message *</Label>
        <Textarea
          id='investorMessage'
          value={formData.investorMessage}
          onChange={e => handleInputChange('investorMessage', e.target.value)}
          rows={4}
          data-error={!!errors.investorMessage}
          className={errors.investorMessage ? 'border-destructive' : ''}
          placeholder='Tell us about your investment interests and thesis'
        />
        {errors.investorMessage && (
          <p className='text-sm text-destructive mt-1'>
            {errors.investorMessage}
          </p>
        )}
      </div>

      {/* Investor Portal Link Card */}
      <Card className='bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mt-6'>
        <CardHeader>
          <CardTitle className='text-lg'>
            Investor Portal (Coming Soon)
          </CardTitle>
          <CardDescription>
            Access live KPIs, trading volumes, and financial dashboards as an
            approved investor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant='outline' className='w-full' asChild>
            <a href='/investors'>Learn More →</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <section className='py-20 bg-gradient-to-br from-background to-muted/20'>
      <div className='container mx-auto px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              Start a Franchise or Partner with PBCEx
            </h2>
            <p className='text-xl text-muted-foreground'>
              Choose your path and tell us a bit more so the right team can
              follow up.
            </p>
          </div>

          <Card className='shadow-xl border-border/50 rounded-2xl'>
            <CardHeader>
              <CardTitle className='text-xl text-center'>I am a...</CardTitle>
              <CardDescription className='text-center'>
                Select the option that best describes your interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Honeypot field */}
              <input
                ref={honeypotRef}
                type='text'
                name='website'
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete='off'
              />

              {isConfirmed ? (
                <div className='text-center py-12'>
                  <div className='flex flex-col items-center space-y-4'>
                    <CheckCircle className='w-12 h-12 text-green-500' />
                    <h3 className='text-lg font-semibold'>Thank you!</h3>
                    <p className='text-muted-foreground max-w-md'>
                      Your submission has been received. Our team will follow up
                      within 24 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-8'>
                  {/* ... keep existing code (all form content) */}
                  {/* Type Selector */}
                  <Tabs value={formType} onValueChange={setFormType}>
                    <TabsList className='flex w-full overflow-x-auto whitespace-nowrap p-1'>
                      <TabsTrigger
                        value='franchise_applicant'
                        className='flex-1 text-xs p-3 min-w-fit h-12 leading-tight text-center'
                      >
                        <div className='flex flex-col items-center'>
                          <span>Franchise</span>
                          <span>Applicant</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value='bank_partner'
                        className='flex-1 text-xs p-3 min-w-fit h-12 leading-tight text-center'
                      >
                        <div className='flex flex-col items-center'>
                          <span>Bank</span>
                          <span>Partner</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value='commodity_provider'
                        className='flex-1 text-xs p-3 min-w-fit h-12 leading-tight text-center'
                      >
                        <div className='flex flex-col items-center'>
                          <span>Commodity</span>
                          <span>Provider</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value='customer_vote'
                        className='flex-1 text-xs p-3 min-w-fit h-12 leading-tight text-center'
                      >
                        <div className='flex flex-col items-center'>
                          <span>Customer</span>
                          <span>Vote</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value='general_business_inquiry'
                        className='flex-1 text-xs p-3 min-w-fit h-12 leading-tight text-center'
                      >
                        <div className='flex flex-col items-center'>
                          <span>General</span>
                          <span>Inquiry</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value='investor'
                        className='flex-1 text-xs p-3 min-w-fit h-12 leading-tight text-center'
                      >
                        Investor
                      </TabsTrigger>
                    </TabsList>

                    {/* Common Fields */}
                    <div>
                      <h3 className='font-semibold mb-4 text-lg border-b pb-2'>
                        Contact Information
                      </h3>
                      {renderCommonFields()}
                    </div>

                    {/* Dynamic Form Content */}
                    <TabsContent value='franchise_applicant' className='mt-8'>
                      <div className='border-t pt-6'>
                        <h3 className='font-semibold mb-4 text-lg'>
                          Franchise Details
                        </h3>
                        {renderFranchiseApplicantForm()}
                      </div>
                    </TabsContent>

                    <TabsContent value='bank_partner' className='mt-8'>
                      <div className='border-t pt-6'>
                        <h3 className='font-semibold mb-4 text-lg'>
                          Partnership Details
                        </h3>
                        {renderBankPartnerForm()}
                      </div>
                    </TabsContent>

                    <TabsContent value='commodity_provider' className='mt-8'>
                      <div className='border-t pt-6'>
                        <h3 className='font-semibold mb-4 text-lg'>
                          Supply Details
                        </h3>
                        {renderCommodityProviderForm()}
                      </div>
                    </TabsContent>

                    <TabsContent value='customer_vote' className='mt-8'>
                      <div className='border-t pt-6'>
                        <h3 className='font-semibold mb-4 text-lg'>
                          Customer Feedback
                        </h3>
                        {renderCustomerVoteForm()}
                      </div>
                    </TabsContent>

                    <TabsContent
                      value='general_business_inquiry'
                      className='mt-8'
                    >
                      <div className='border-t pt-6'>
                        <h3 className='font-semibold mb-4 text-lg'>
                          Your Inquiry
                        </h3>
                        {renderGeneralInquiryForm()}
                      </div>
                    </TabsContent>

                    <TabsContent value='investor' className='mt-8'>
                      <div className='border-t pt-6'>
                        <h3 className='font-semibold mb-4 text-lg'>
                          Investment Details
                        </h3>
                        {renderInvestorForm()}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Submit Button */}
                  <div className='flex justify-end pt-6 border-t'>
                    <Button
                      type='submit'
                      disabled={isSubmitting}
                      className='w-full md:w-auto min-w-[200px]'
                      size='lg'
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FranchiseAndPartnershipsForm;
