import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Globe, Coins } from 'lucide-react';
import treasureChest from '@/assets/treasure-chest.png';

const HeroSection = () => {
  return (
    <section className='relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-8 pb-12 bg-background'>
      {/* Background elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-background via-card/30 to-muted/20' />

      <div className='container mx-auto px-4 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto'>
          {/* Left - Content */}
          <div className='text-center lg:text-left space-y-8'>
            <h1 className='text-4xl md:text-6xl font-bold text-foreground leading-tight'>
              Start your{' '}
              <span className='bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent'>
                treasure
              </span>{' '}
              now.
            </h1>

            <p className='text-xl text-muted-foreground leading-relaxed'>
              Trade real assets with bank-grade security and global reach.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
              <Button 
                variant='gold' 
                size='lg' 
                className='group'
                onClick={() => window.location.href = '/markets'}
              >
                Trade now
                <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
              </Button>
              <Button 
                variant='outline' 
                size='lg'
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore products
              </Button>
            </div>

            <p className='text-xs text-muted-foreground/70'>
              Regulated financial services. Assets held in secure custody. Individual results may vary.
            </p>
          </div>

          {/* Right - Treasure Chest */}
          <div className='flex justify-center lg:justify-end'>
            <div className='relative'>
              <img
                src={treasureChest}
                alt='Treasure chest representing digital asset storage'
                className='w-80 h-80 object-contain drop-shadow-2xl'
              />
              <div className='absolute -inset-4 bg-gradient-to-r from-gold/20 to-gold-light/20 rounded-full blur-3xl opacity-50' />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className='absolute top-20 left-10 w-32 h-32 rounded-full bg-gold/5 blur-2xl' />
      <div className='absolute bottom-20 right-10 w-48 h-48 rounded-full bg-gold-light/5 blur-3xl' />
    </section>
  );
};

export default HeroSection;
