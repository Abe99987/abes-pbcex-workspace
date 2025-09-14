import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  MapPin,
  Monitor,
  MoreVertical,
} from 'lucide-react';

const Security = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Mock security data
  const securityStatus = {
    passwordStrength: 'Strong',
    twoFactorAuth: true,
    emailVerified: true,
    phoneVerified: true,
    lastPasswordChange: '2024-01-10',
  };

  const activeSessions = [
    {
      id: 'sess_001',
      device: 'MacBook Pro - Chrome',
      location: 'New York, NY',
      ip: '192.168.1.100',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: 'sess_002',
      device: 'iPhone 15 Pro - Safari',
      location: 'New York, NY',
      ip: '192.168.1.101',
      lastActive: '1 hour ago',
      current: false,
    },
    {
      id: 'sess_003',
      device: 'Windows PC - Edge',
      location: 'Brooklyn, NY',
      ip: '10.0.0.15',
      lastActive: '2 days ago',
      current: false,
    },
  ];

  const loginHistory = [
    {
      id: 'log_001',
      timestamp: '2024-01-15 14:23:45',
      device: 'MacBook Pro - Chrome',
      location: 'New York, NY',
      ip: '192.168.1.100',
      status: 'Success',
    },
    {
      id: 'log_002',
      timestamp: '2024-01-15 08:15:22',
      device: 'iPhone 15 Pro - Safari',
      location: 'New York, NY',
      ip: '192.168.1.101',
      status: 'Success',
    },
    {
      id: 'log_003',
      timestamp: '2024-01-14 16:45:12',
      device: 'Unknown Device - Chrome',
      location: 'Los Angeles, CA',
      ip: '203.0.113.45',
      status: 'Failed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Security Settings - PBCEx | 2FA, Sessions & Authentication</title>
        <meta
          name='description'
          content='Manage your PBCEx account security settings including two-factor authentication, active sessions, and login history.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto space-y-6'>
          
          {/* Header */}
          <div>
            <h1 className='text-3xl font-bold text-foreground mb-2'>Security Settings</h1>
            <p className='text-muted-foreground'>Manage your account security and authentication preferences</p>
          </div>

          {/* Security Overview */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground flex items-center gap-2'>
                <Shield className='w-5 h-5' />
                Security Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
                  {securityStatus.passwordStrength === 'Strong' ? (
                    <CheckCircle className='w-5 h-5 text-green-400' />
                  ) : (
                    <XCircle className='w-5 h-5 text-red-400' />
                  )}
                  <div>
                    <div className='text-sm font-medium text-foreground'>Password</div>
                    <div className='text-xs text-muted-foreground'>{securityStatus.passwordStrength}</div>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
                  {securityStatus.twoFactorAuth ? (
                    <CheckCircle className='w-5 h-5 text-green-400' />
                  ) : (
                    <XCircle className='w-5 h-5 text-red-400' />
                  )}
                  <div>
                    <div className='text-sm font-medium text-foreground'>2FA</div>
                    <div className='text-xs text-muted-foreground'>
                      {securityStatus.twoFactorAuth ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
                  {securityStatus.emailVerified ? (
                    <CheckCircle className='w-5 h-5 text-green-400' />
                  ) : (
                    <XCircle className='w-5 h-5 text-red-400' />
                  )}
                  <div>
                    <div className='text-sm font-medium text-foreground'>Email</div>
                    <div className='text-xs text-muted-foreground'>
                      {securityStatus.emailVerified ? 'Verified' : 'Not Verified'}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
                  {securityStatus.phoneVerified ? (
                    <CheckCircle className='w-5 h-5 text-green-400' />
                  ) : (
                    <XCircle className='w-5 h-5 text-red-400' />
                  )}
                  <div>
                    <div className='text-sm font-medium text-foreground'>Phone</div>
                    <div className='text-xs text-muted-foreground'>
                      {securityStatus.phoneVerified ? 'Verified' : 'Not Verified'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password & Authentication */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            
            {/* Change Password */}
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2'>
                  <Key className='w-5 h-5' />
                  Change Password
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Last changed: {securityStatus.lastPasswordChange}
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>Current Password</Label>
                  <div className='relative'>
                    <Input
                      id='currentPassword'
                      type={showPasswords ? 'text' : 'password'}
                      placeholder='Enter current password'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPasswords(!showPasswords)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground'
                    >
                      {showPasswords ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                    </button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New Password</Label>
                  <Input
                    id='newPassword'
                    type={showPasswords ? 'text' : 'password'}
                    placeholder='Enter new password'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                  <Input
                    id='confirmPassword'
                    type={showPasswords ? 'text' : 'password'}
                    placeholder='Confirm new password'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='text-xs text-muted-foreground'>
                    Password requirements:
                  </div>
                  <ul className='text-xs text-muted-foreground space-y-1'>
                    <li>• At least 12 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Include at least one special character</li>
                  </ul>
                </div>

                <Button className='w-full'>
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2'>
                  <Smartphone className='w-5 h-5' />
                  Two-Factor Authentication
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Add an extra layer of security to your account
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20'>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-400' />
                    <div>
                      <div className='text-sm font-medium text-foreground'>Authenticator App</div>
                      <div className='text-xs text-muted-foreground'>Google Authenticator enabled</div>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>

                <div className='space-y-3'>
                  <h4 className='text-sm font-medium text-foreground'>Backup Options</h4>
                  
                  <div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
                    <div>
                      <div className='text-sm font-medium text-foreground'>SMS Backup</div>
                      <div className='text-xs text-muted-foreground'>+1 (555) ***-4567</div>
                    </div>
                    <Button variant='outline' size='sm'>
                      Configure
                    </Button>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
                    <div>
                      <div className='text-sm font-medium text-foreground'>Backup Codes</div>
                      <div className='text-xs text-muted-foreground'>8 unused codes remaining</div>
                    </div>
                    <Button variant='outline' size='sm'>
                      View Codes
                    </Button>
                  </div>
                </div>

                <div className='p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='w-4 h-4 text-yellow-500 mt-0.5' />
                    <div className='text-xs text-muted-foreground'>
                      Keep backup codes in a safe place. They can be used to access your account if you lose your authenticator device.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground flex items-center gap-2'>
                <Monitor className='w-5 h-5' />
                Active Sessions
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                Manage devices that are currently signed in to your account
              </p>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {activeSessions.map((session) => (
                  <div key={session.id} className='flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
                        <Monitor className='w-4 h-4 text-primary' />
                      </div>
                      <div>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-sm font-medium text-foreground'>{session.device}</span>
                          {session.current && (
                            <Badge className='bg-green-500/10 text-green-400 border-green-500/30 text-xs'>
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className='text-xs text-muted-foreground space-y-1'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='w-3 h-3' />
                            {session.location} • {session.ip}
                          </div>
                          <div>Last active: {session.lastActive}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className='flex gap-2'>
                      {!session.current && (
                        <Button variant='outline' size='sm' className='text-red-400 hover:text-red-300'>
                          Terminate
                        </Button>
                      )}
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className='mt-4 pt-4 border-t border-border/50'>
                <Button variant='outline' className='w-full'>
                  Terminate All Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Login History */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground flex items-center gap-2'>
                <Lock className='w-5 h-5' />
                Recent Login Activity
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                Review recent login attempts to your account
              </p>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {loginHistory.map((login) => (
                  <div key={login.id} className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
                        {login.status === 'Success' ? (
                          <Lock className='w-4 h-4 text-green-400' />
                        ) : (
                          <Unlock className='w-4 h-4 text-red-400' />
                        )}
                      </div>
                      <div>
                        <div className='text-sm font-medium text-foreground'>{login.device}</div>
                        <div className='text-xs text-muted-foreground'>
                          {login.timestamp} • {login.location} • {login.ip}
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(login.status)} variant='outline'>
                      {login.status}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className='mt-4 text-center'>
                <Button variant='outline' size='sm'>
                  View Complete History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Security;