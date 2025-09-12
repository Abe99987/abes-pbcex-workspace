import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, Eye, Accessibility } from 'lucide-react';

export default function PrivacyHub() {
  const privacyDocs = [
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal information',
      href: '/legal/privacy-policy',
      icon: Shield,
    },
    {
      title: 'Privacy Choices',
      description:
        'Your rights regarding Do Not Sell/Share and data control options',
      href: '/legal/privacy-choices',
      icon: Eye,
    },
    {
      title: 'Accessibility',
      description: 'Our commitment to making PBCEx accessible to everyone',
      href: '/legal/accessibility',
      icon: Accessibility,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-secondary/20'>
      <div className='container mx-auto py-12 px-4'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-4xl font-bold mb-4'>Privacy & Rights</h1>
          <p className='text-lg text-muted-foreground mb-8'>
            Understand how we protect your privacy, respect your data rights,
            and ensure accessible services for all users.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
            {privacyDocs.map(doc => {
              const Icon = doc.icon;
              return (
                <Card
                  key={doc.href}
                  className='hover:shadow-lg transition-shadow'
                >
                  <CardHeader>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Icon className='h-5 w-5 text-primary' />
                      <Link to={doc.href} className='hover:underline'>
                        <CardTitle className='text-xl'>{doc.title}</CardTitle>
                      </Link>
                    </div>
                    <CardDescription>{doc.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      to={doc.href}
                      className='text-primary hover:underline text-sm'
                    >
                      View document →
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className='mt-8'>
            <Link
              to='/legal'
              className='text-primary underline hover:no-underline'
            >
              View All Legal Documents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
