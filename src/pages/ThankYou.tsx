import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'contact';
  const navigate = useNavigate();

  const getContent = () => {
    switch (type) {
      case 'franchise':
        return {
          title: 'Franchise Application Received',
          message:
            'Thanks for applying to open a PBCEx Franchise. Our partnerships team will review your application and contact you shortly.',
          cta: 'Return to Franchise Page',
          ctaPath: '/franchise',
        };
      case 'investor':
        return {
          title: 'Investor Inquiry Received',
          message:
            'Thank you for your interest in PBCEx. Our investor relations team will review your submission and reach out soon.',
          cta: 'Return to Investor Relations',
          ctaPath: '/investors',
        };
      case 'press':
        return {
          title: 'Press Inquiry Received',
          message:
            "Thanks for reaching out to PBCEx Press. We'll respond to your request within 24 hours.",
          cta: 'Return to Press Page',
          ctaPath: '/press',
        };
      case 'vote':
        return {
          title: 'Feedback Received',
          message:
            'Thank you for your feedback. Your voice helps us improve PBCEx for everyone.',
          cta: 'Return to Home',
          ctaPath: '/',
        };
      default:
        return {
          title: 'Message Received',
          message:
            "Thank you for contacting us. We'll respond within 24 hours.",
          cta: 'Return to Contact',
          ctaPath: '/contact',
        };
    }
  };

  const content = getContent();

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-2xl mx-auto'>
            <Card className='shadow-xl border-border/50 rounded-2xl'>
              <CardContent className='text-center py-16'>
                <div className='flex flex-col items-center space-y-6'>
                  <CheckCircle className='w-16 h-16 text-green-500' />
                  <div className='space-y-2'>
                    <h1 className='text-2xl md:text-3xl font-bold'>
                      {content.title}
                    </h1>
                    <p className='text-lg text-muted-foreground max-w-md'>
                      {content.message}
                    </p>
                  </div>
                  <div className='flex flex-col sm:flex-row gap-4 pt-4'>
                    <Button
                      onClick={() => navigate(content.ctaPath)}
                      className='flex items-center space-x-2'
                    >
                      <ArrowLeft className='w-4 h-4' />
                      <span>{content.cta}</span>
                    </Button>
                    <Button variant='outline' onClick={() => navigate('/')}>
                      Go to Homepage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;
