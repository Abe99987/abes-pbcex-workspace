import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Package, Archive } from 'lucide-react';

export default function OperationsHub() {
  const operationsDocs = [
    {
      title: 'Refunds, Returns & Shipping',
      description:
        'Policies for refunds, returns, and physical asset shipping and fulfillment',
      href: '/legal/refunds-shipping',
      icon: Package,
    },
    {
      title: 'Record Retention Schedule',
      description: 'Document retention policies and data management procedures',
      href: '/legal/record-retention',
      icon: Archive,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-secondary/20'>
      <div className='container mx-auto py-12 px-4'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-4xl font-bold mb-4'>Operations & Records</h1>
          <p className='text-lg text-muted-foreground mb-8'>
            Policies governing fulfillment operations, record management, and
            business continuity procedures.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            {operationsDocs.map(doc => {
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
