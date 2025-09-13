import { Card, CardContent } from '@/components/ui/card';
import { Shield, Award, Users, GraduationCap } from 'lucide-react';

const FeatureStripe = () => {
  const features = [
    {
      icon: Shield,
      title: 'Security',
      description: 'Bank-grade security with multi-sig protection',
    },
    {
      icon: Award,
      title: 'Earn/Rewards',
      description: 'Earn yield on your gold and silver holdings',
    },
    {
      icon: Users,
      title: 'Sub-accounts',
      description: 'Manage family and business accounts',
    },
    {
      icon: GraduationCap,
      title: 'Learn',
      description: 'Master precious metals investing',
    },
  ];

  return (
    <section className='py-8 bg-background'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto'>
          {features.map((feature, index) => (
            <Card
              key={index}
              className='bg-card/50 border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-[0_10px_30px_-10px_hsl(var(--gold)/0.2)]'
            >
              <CardContent className='p-6 text-center'>
                <div className='w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center'>
                  <feature.icon className='w-6 h-6 text-gold' />
                </div>
                <h3 className='font-semibold text-foreground mb-2'>{feature.title}</h3>
                <p className='text-sm text-muted-foreground'>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureStripe;