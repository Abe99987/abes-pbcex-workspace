import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Globe, Coins } from 'lucide-react';
import treasureChest from '@/assets/treasure-chest-large.png';

const HeroSection = () => {
  return (
    <section className='relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-6 pb-4 bg-background'>
      {/* Background elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-background via-card/30 to-muted/20' />

      <div className='container mx-auto px-4 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto'>
          {/* Left - Content - nudged closer to chest */}
          <div className='text-center lg:text-left space-y-5 lg:ml-24'>
            {/* Brand eyebrow - massively enlarged with color split */}
            <div className='text-[12rem] md:text-[14rem] font-bold tracking-wide leading-none'>
              <span className='text-foreground'>PBC</span><span className='text-gold'>Ex</span>
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

          {/* Right - Treasure Chest - 3x larger */}
          <div className='flex justify-center lg:justify-start lg:-mr-16'>
            <div className='relative'>
              {/* Large warm amber radial glow - much bigger for 3x chest */}
              <div className='absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-radial from-amber-400/25 via-gold/20 to-transparent rounded-full blur-3xl opacity-80' />
              
              {/* Curved wave band sweeping under the chest - extended */}
              <div className='absolute -bottom-32 -right-60 w-[600px] h-80 bg-gradient-to-l from-amber-500/15 via-gold/10 to-transparent rounded-full blur-3xl opacity-60 transform rotate-12' />
              
              {/* Secondary glow for extra warmth - scaled up */}
              <div className='absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-radial from-gold-light/18 to-transparent rounded-full blur-2xl opacity-70' />
              
              {/* Subtle angular highlights */}
              <div className='absolute -top-10 -right-32 w-96 h-1 bg-gradient-to-r from-transparent via-gold/8 to-transparent blur-sm opacity-30 transform rotate-12' />
              <div className='absolute -bottom-16 -left-20 w-80 h-1 bg-gradient-to-r from-transparent via-amber-400/6 to-transparent blur-sm opacity-25 transform -rotate-6' />
              
              {/* Treasure chest image - 3x larger */}
              <img
                src={treasureChest}
                alt='Glowing treasure chest'
                className='w-[960px] h-[960px] object-contain relative z-10 max-w-none'
                style={{
                  filter: 'drop-shadow(0 0 50px hsl(var(--gold) / 0.3)) drop-shadow(0 0 100px hsl(var(--gold) / 0.15)) drop-shadow(0 30px 60px rgba(0, 0, 0, 0.4))',
                }}
              />
              
              {/* Enhanced rim lighting effect */}
              <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-gold/12 rounded-full blur-xl opacity-50' />
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
