import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Globe, Coins } from 'lucide-react';
import treasureChest from '@/assets/treasure-chest-dark.png';

const HeroSection = () => {
  return (
    <section className='relative min-h-[75vh] flex items-center justify-center overflow-hidden pt-6 pb-4 bg-background'>
      {/* Background elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-background via-card/30 to-muted/20' />

      <div className='container mx-auto px-4 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto'>
          {/* Left - Content - nudged closer to chest */}
          <div className='text-center lg:text-left space-y-5 lg:ml-16'>
            {/* Brand eyebrow - enlarged and more prominent */}
            <div className='text-6xl md:text-7xl font-bold text-gold tracking-wide'>
              PBCEx
            </div>
            
            {/* Micro-copy */}
            <div className='text-xs text-muted-foreground/60 -mt-2'>
              People's Banking & Commodities Exchange
            </div>

            <h1 className='text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-lg'>
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
                className='group bg-gold text-black hover:bg-gold-light focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background'
                onClick={() => window.location.href = '/markets'}
              >
                Trade now
                <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
              </Button>
              <Button 
                variant='outline' 
                size='lg'
                className='border-muted text-foreground hover:bg-muted/20 focus:ring-2 focus:ring-muted focus:ring-offset-2 focus:ring-offset-background'
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore products
              </Button>
            </div>

            <p className='text-xs text-muted-foreground/60'>
              Regulated financial services. Assets held in secure custody. Individual results may vary.
            </p>
          </div>

          {/* Right - Treasure Chest */}
          <div className='flex justify-center lg:justify-end lg:-ml-8'>
            <div className='relative'>
              {/* Large warm amber radial glow - top-right offset */}
              <div className='absolute -top-24 -right-24 w-[400px] h-[400px] bg-gradient-radial from-amber-400/20 via-gold/15 to-transparent rounded-full blur-3xl opacity-70' />
              
              {/* Curved wave band sweeping under the chest */}
              <div className='absolute -bottom-20 -right-40 w-96 h-48 bg-gradient-to-l from-amber-500/12 via-gold/8 to-transparent rounded-full blur-2xl opacity-50 transform rotate-12' />
              
              {/* Secondary glow for extra warmth */}
              <div className='absolute -top-12 -right-12 w-80 h-80 bg-gradient-radial from-gold-light/15 to-transparent rounded-full blur-2xl opacity-60' />
              
              {/* Treasure chest image */}
              <img
                src={treasureChest}
                alt='Treasure chest representing digital asset storage and wealth building'
                className='w-80 h-80 object-contain relative z-10'
                style={{
                  filter: 'drop-shadow(0 0 30px hsl(var(--gold) / 0.2)) drop-shadow(0 0 60px hsl(var(--gold) / 0.1)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
                }}
              />
              
              {/* Subtle rim lighting effect */}
              <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-gold/10 rounded-full blur-xl opacity-40' />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced decorative background elements */}
      <div className='absolute top-16 left-8 w-40 h-40 rounded-full bg-gold/5 blur-2xl' />
      <div className='absolute bottom-16 right-8 w-56 h-56 rounded-full bg-gold-light/4 blur-3xl' />
    </section>
  );
};

export default HeroSection;
