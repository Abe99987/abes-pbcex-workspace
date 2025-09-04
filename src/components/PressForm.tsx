import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PressFormProps {
  showHeader?: boolean;
}

const PressForm = ({ showHeader = true }: PressFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    pressOrganization: '',
    mediaType: '',
    website: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.pressOrganization.trim())
      newErrors.pressOrganization = 'Press company/outlet is required';
    if (!formData.mediaType) newErrors.mediaType = 'Media type is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const payload = {
      ...formData,
      page: 'press',
      timestamp: new Date().toISOString(),
    };

    console.log('Press inquiry submission:', payload);

    toast({
      title: 'Press Inquiry Submitted!',
      description:
        'Thank you for your interest. Our media team will get back to you soon.',
    });

    setIsSubmitting(false);
    setIsConfirmed(true);

    // Redirect after 4 seconds
    setTimeout(() => {
      navigate('/thank-you?type=press');
    }, 4000);
  };

  if (isConfirmed) {
    return (
      <Card className='shadow-xl border-border/50 rounded-2xl'>
        {showHeader && (
          <CardHeader>
            <CardTitle className='text-xl text-center'>Press Inquiry</CardTitle>
            <CardDescription className='text-center'>
              Tell us about your media project
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className='text-center py-12'>
          <div className='flex flex-col items-center space-y-4'>
            <CheckCircle className='w-12 h-12 text-green-500' />
            <h3 className='text-lg font-semibold'>Thank you!</h3>
            <p className='text-muted-foreground max-w-md'>
              Your submission has been received. Our team will follow up within
              24 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='shadow-xl border-border/50 rounded-2xl'>
      {showHeader && (
        <CardHeader>
          <CardTitle className='text-xl text-center'>Press Inquiry</CardTitle>
          <CardDescription className='text-center'>
            Tell us about your media project
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='fullName'>Full Name *</Label>
              <Input
                id='fullName'
                value={formData.fullName}
                onChange={e => handleInputChange('fullName', e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.fullName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor='email'>Email *</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className='text-sm text-destructive mt-1'>{errors.email}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='pressOrganization'>Press Company / Outlet *</Label>
            <Input
              id='pressOrganization'
              value={formData.pressOrganization}
              onChange={e =>
                handleInputChange('pressOrganization', e.target.value)
              }
              className={errors.pressOrganization ? 'border-destructive' : ''}
            />
            {errors.pressOrganization && (
              <p className='text-sm text-destructive mt-1'>
                {errors.pressOrganization}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='mediaType'>Media Type *</Label>
            <Select
              value={formData.mediaType}
              onValueChange={value => handleInputChange('mediaType', value)}
            >
              <SelectTrigger
                className={errors.mediaType ? 'border-destructive' : ''}
              >
                <SelectValue placeholder='Select media type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='journalist'>Journalist</SelectItem>
                <SelectItem value='influencer'>Influencer</SelectItem>
                <SelectItem value='interview'>Interview</SelectItem>
                <SelectItem value='marketing-collab'>
                  Marketing/Collab
                </SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.mediaType && (
              <p className='text-sm text-destructive mt-1'>
                {errors.mediaType}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='website'>Website / Social Media</Label>
            <Input
              id='website'
              value={formData.website}
              onChange={e => handleInputChange('website', e.target.value)}
              placeholder='Optional - your website, Twitter/X, LinkedIn'
            />
          </div>

          <div>
            <Label htmlFor='message'>Message *</Label>
            <Textarea
              id='message'
              value={formData.message}
              onChange={e => handleInputChange('message', e.target.value)}
              rows={5}
              placeholder='Tell us about your media project or collaboration idea'
              className={errors.message ? 'border-destructive' : ''}
            />
            {errors.message && (
              <p className='text-sm text-destructive mt-1'>{errors.message}</p>
            )}
          </div>

          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full md:w-auto min-w-[200px]'
              size='lg'
            >
              {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PressForm;
