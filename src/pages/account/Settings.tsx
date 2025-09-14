import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Save,
  Upload,
  Camera,
} from 'lucide-react';

const Settings = () => {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    company: 'Acme Corp',
    bio: 'Professional trader and investor with focus on precious metals and cryptocurrencies.',
  });

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'America/New_York',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    trading: {
      confirmations: true,
      soundAlerts: false,
      priceAlerts: true,
    },
  });

  const [kycStatus] = useState({
    level: 'Level 2',
    status: 'Verified',
    limits: {
      daily: '$50,000',
      monthly: '$500,000',
    },
  });

  const handleProfileUpdate = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type as keyof typeof prev.notifications],
      },
    }));
  };

  const handleTradingToggle = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      trading: {
        ...prev.trading,
        [type]: !prev.trading[type as keyof typeof prev.trading],
      },
    }));
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Settings & Profile - PBCEx | Account Preferences</title>
        <meta
          name='description'
          content='Manage your PBCEx account settings, profile information, and trading preferences.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto space-y-6'>
          
          {/* Header */}
          <div>
            <h1 className='text-3xl font-bold text-foreground mb-2'>Settings & Profile</h1>
            <p className='text-muted-foreground'>Manage your account preferences and personal information</p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card/50">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="kyc">KYC Status</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Picture */}
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground flex items-center gap-2'>
                    <User className='w-5 h-5' />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-6'>
                    <div className='w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center border border-border/50'>
                      <User className='w-8 h-8 text-muted-foreground' />
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm text-muted-foreground'>
                        Upload a profile picture to personalize your account
                      </p>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm' className='flex items-center gap-2'>
                          <Upload className='w-4 h-4' />
                          Upload Image
                        </Button>
                        <Button variant='outline' size='sm' className='flex items-center gap-2'>
                          <Camera className='w-4 h-4' />
                          Take Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground'>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='firstName'>First Name</Label>
                      <Input
                        id='firstName'
                        value={profile.firstName}
                        onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='lastName'>Last Name</Label>
                      <Input
                        id='lastName'
                        value={profile.lastName}
                        onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email Address</Label>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                      <Input
                        id='email'
                        type='email'
                        value={profile.email}
                        onChange={(e) => handleProfileUpdate('email', e.target.value)}
                        className='pl-9'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone Number</Label>
                    <div className='relative'>
                      <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                      <Input
                        id='phone'
                        type='tel'
                        value={profile.phone}
                        onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                        className='pl-9'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='company'>Company (Optional)</Label>
                    <div className='relative'>
                      <Building2 className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                      <Input
                        id='company'
                        value={profile.company}
                        onChange={(e) => handleProfileUpdate('company', e.target.value)}
                        className='pl-9'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='bio'>Bio</Label>
                    <Textarea
                      id='bio'
                      value={profile.bio}
                      onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                      placeholder='Tell us about yourself...'
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='address'>Street Address</Label>
                    <Input
                      id='address'
                      value={profile.address}
                      onChange={(e) => handleProfileUpdate('address', e.target.value)}
                    />
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='city'>City</Label>
                      <Input
                        id='city'
                        value={profile.city}
                        onChange={(e) => handleProfileUpdate('city', e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='state'>State/Province</Label>
                      <Input
                        id='state'
                        value={profile.state}
                        onChange={(e) => handleProfileUpdate('state', e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='zipCode'>ZIP/Postal Code</Label>
                      <Input
                        id='zipCode'
                        value={profile.zipCode}
                        onChange={(e) => handleProfileUpdate('zipCode', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='country'>Country</Label>
                    <Select value={profile.country}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='United States'>United States</SelectItem>
                        <SelectItem value='Canada'>Canada</SelectItem>
                        <SelectItem value='United Kingdom'>United Kingdom</SelectItem>
                        <SelectItem value='Germany'>Germany</SelectItem>
                        <SelectItem value='France'>France</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className='flex justify-end'>
                <Button className='flex items-center gap-2'>
                  <Save className='w-4 h-4' />
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground'>Display & Language</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Theme</Label>
                      <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='dark'>Dark</SelectItem>
                          <SelectItem value='light'>Light</SelectItem>
                          <SelectItem value='system'>System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label>Language</Label>
                      <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='en'>English</SelectItem>
                          <SelectItem value='es'>Español</SelectItem>
                          <SelectItem value='fr'>Français</SelectItem>
                          <SelectItem value='de'>Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Timezone</Label>
                      <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='America/New_York'>Eastern Time (ET)</SelectItem>
                          <SelectItem value='America/Chicago'>Central Time (CT)</SelectItem>
                          <SelectItem value='America/Denver'>Mountain Time (MT)</SelectItem>
                          <SelectItem value='America/Los_Angeles'>Pacific Time (PT)</SelectItem>
                          <SelectItem value='Europe/London'>London (GMT)</SelectItem>
                          <SelectItem value='Europe/Paris'>Paris (CET)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label>Default Currency</Label>
                      <Select value={preferences.currency} onValueChange={(value) => setPreferences(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='USD'>USD - US Dollar</SelectItem>
                          <SelectItem value='EUR'>EUR - Euro</SelectItem>
                          <SelectItem value='GBP'>GBP - British Pound</SelectItem>
                          <SelectItem value='CAD'>CAD - Canadian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground'>Trading Preferences</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>Order Confirmations</Label>
                      <p className='text-xs text-muted-foreground'>Require confirmation before placing orders</p>
                    </div>
                    <Switch
                      checked={preferences.trading.confirmations}
                      onCheckedChange={() => handleTradingToggle('confirmations')}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>Sound Alerts</Label>
                      <p className='text-xs text-muted-foreground'>Play sounds for trading activities</p>
                    </div>
                    <Switch
                      checked={preferences.trading.soundAlerts}
                      onCheckedChange={() => handleTradingToggle('soundAlerts')}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>Price Alerts</Label>
                      <p className='text-xs text-muted-foreground'>Notify when prices reach your targets</p>
                    </div>
                    <Switch
                      checked={preferences.trading.priceAlerts}
                      onCheckedChange={() => handleTradingToggle('priceAlerts')}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground flex items-center gap-2'>
                    <Bell className='w-5 h-5' />
                    Notification Preferences
                  </CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    Choose how you want to receive updates and alerts
                  </p>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>Email Notifications</Label>
                      <p className='text-xs text-muted-foreground'>Receive updates via email</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.email}
                      onCheckedChange={() => handleNotificationToggle('email')}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>Push Notifications</Label>
                      <p className='text-xs text-muted-foreground'>Browser and mobile push notifications</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.push}
                      onCheckedChange={() => handleNotificationToggle('push')}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>SMS Notifications</Label>
                      <p className='text-xs text-muted-foreground'>Important alerts via SMS</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.sms}
                      onCheckedChange={() => handleNotificationToggle('sms')}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label className='text-sm font-medium'>Marketing Communications</Label>
                      <p className='text-xs text-muted-foreground'>Product updates and promotional offers</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.marketing}
                      onCheckedChange={() => handleNotificationToggle('marketing')}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KYC Status Tab */}
            <TabsContent value="kyc" className="space-y-6">
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground flex items-center gap-2'>
                    <Shield className='w-5 h-5' />
                    KYC Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-full bg-green-500/20'>
                        <Shield className='w-5 h-5 text-green-400' />
                      </div>
                      <div>
                        <div className='font-medium text-foreground'>{kycStatus.level} Verification</div>
                        <div className='text-sm text-muted-foreground'>Identity verified</div>
                      </div>
                    </div>
                    <Badge className='bg-green-500/10 text-green-400 border-green-500/30'>
                      {kycStatus.status}
                    </Badge>
                  </div>

                  <div className='space-y-4'>
                    <h4 className='font-medium text-foreground'>Current Limits</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='p-4 bg-muted/30 rounded-lg'>
                        <div className='text-sm text-muted-foreground'>Daily Limit</div>
                        <div className='text-lg font-semibold text-foreground'>{kycStatus.limits.daily}</div>
                      </div>
                      <div className='p-4 bg-muted/30 rounded-lg'>
                        <div className='text-sm text-muted-foreground'>Monthly Limit</div>
                        <div className='text-lg font-semibold text-foreground'>{kycStatus.limits.monthly}</div>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <h4 className='font-medium text-foreground'>Upgrade to Level 3</h4>
                    <p className='text-sm text-muted-foreground'>
                      Increase your limits by completing additional verification steps
                    </p>
                    <Button variant='outline'>
                      Start Level 3 Verification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;