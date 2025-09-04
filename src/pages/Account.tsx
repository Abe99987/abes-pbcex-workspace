import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Settings,
  Edit3,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('profile');

  // Mock user data - in real app, this would come from Supabase auth
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    country: 'United States',
    joinDate: '2024-01-15',
    accountType: 'Personal',
    verified: true,
  };

  // Handle section from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/identity')) setActiveSection('identity');
    else if (path.includes('/security')) setActiveSection('security');
    else if (path.includes('/payments')) setActiveSection('payments');
    else if (path.includes('/notifications')) setActiveSection('notifications');
    else if (path.includes('/api-keys')) setActiveSection('api-keys');
    else if (path.includes('/tax')) setActiveSection('tax');
    else setActiveSection('profile');
  }, [location.pathname]);

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className='space-y-6'>
            <div>
              <h2 className='text-2xl font-bold mb-2'>
                Profile & Contact Information
              </h2>
              <p className='text-muted-foreground'>
                Manage your personal information and contact details.
              </p>
            </div>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Personal Information
                </CardTitle>
                <Button variant='outline' size='sm'>
                  <Edit3 className='h-4 w-4 mr-2' />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Full Name
                    </label>
                    <p className='text-sm'>{user.name}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Account Type
                    </label>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm'>{user.accountType}</p>
                      {user.verified && (
                        <Badge variant='secondary' className='text-xs'>
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Email
                    </label>
                    <div className='flex items-center gap-2'>
                      <Mail className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm'>{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Phone
                    </label>
                    <div className='flex items-center gap-2'>
                      <Phone className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm'>{user.phone}</p>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Country
                    </label>
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm'>{user.country}</p>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Member Since
                    </label>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm'>
                        {new Date(user.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'identity':
        return (
          <div className='space-y-6'>
            <div>
              <h2 className='text-2xl font-bold mb-2'>
                Identity Verification (KYC)
              </h2>
              <p className='text-muted-foreground'>
                Verify your identity to access all platform features.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-5 w-5' />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>Identity Verified</p>
                    <p className='text-sm text-muted-foreground'>
                      Your identity has been successfully verified
                    </p>
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-green-50 text-green-700 border-green-200'
                  >
                    ✓ Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className='space-y-6'>
            <div>
              <h2 className='text-2xl font-bold mb-2'>Security Settings</h2>
              <p className='text-muted-foreground'>
                Manage your account security and authentication methods.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Authenticator App</p>
                      <p className='text-sm text-muted-foreground'>
                        Not enabled
                      </p>
                    </div>
                    <Button variant='outline'>Enable</Button>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>SMS Authentication</p>
                      <p className='text-sm text-muted-foreground'>
                        Not enabled
                      </p>
                    </div>
                    <Button variant='outline'>Enable</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className='space-y-6'>
            <div>
              <h2 className='text-2xl font-bold mb-2'>
                {activeSection.charAt(0).toUpperCase() +
                  activeSection.slice(1).replace('-', ' ')}
              </h2>
              <p className='text-muted-foreground'>
                Coming soon - This feature is currently under development.
              </p>
            </div>

            <Card>
              <CardContent className='pt-6'>
                <div className='text-center py-8'>
                  <Settings className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <p className='text-muted-foreground'>
                    This section will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      {/* Breadcrumbs */}
      <div className='container mx-auto px-4 py-4'>
        <nav className='text-sm text-muted-foreground'>
          Account /{' '}
          {activeSection.charAt(0).toUpperCase() +
            activeSection.slice(1).replace('-', ' ')}
        </nav>
      </div>

      <div className='container mx-auto px-4 pb-16'>{renderContent()}</div>

      <Footer />
    </div>
  );
};

export default Account;
