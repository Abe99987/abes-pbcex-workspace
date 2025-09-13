import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Globe, Coins } from 'lucide-react';
import treasureChest from '@/assets/treasure-chest-realistic.png';

const HeroSection = () => {
  return (
    <section className='relative min-h-[78vh] flex items-center justify-center overflow-hidden pt-6 pb-2 bg-background'>
      {/* Background elements - seamless blend to exact site black */}
      <div className='absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background' />

      <div className='container mx-auto px-4 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto'>
          {/* Left - Content - aligned with page grid */}
          <div className='text-center lg:text-left space-y-5 lg:-ml-8'>
            {/* Brand eyebrow - reduced size with color split */}
            <div className='text-[9rem] md:text-[10.5rem] font-bold tracking-wide leading-none'>
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

          {/* Right - Treasure Chest */}
          <div className='flex justify-center lg:justify-start lg:-mr-16 relative'>
            {/* Seamless black blend vignette */}
            <div className='absolute inset-0 bg-gradient-radial from-transparent via-background/60 to-background w-full h-full' />
            
            <div className='relative'>
              {/* Compact interior glow from chest opening */}
              <div className='absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[200px] h-[150px] bg-gradient-radial from-amber-400/20 via-gold/12 to-transparent rounded-full blur-2xl opacity-70' />
              
              {/* Treasure chest image */}
              <img
                src={treasureChest}
                alt='Treasure chest glowing from within'
                className='w-[800px] h-[800px] object-contain relative z-10 max-w-none'
                style={{
                  filter: 'drop-shadow(2px 2px 8px hsl(var(--gold) / 0.15)) drop-shadow(-1px -1px 4px hsl(var(--foreground) / 0.08)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
                }}
              />
              
              {/* Subtle rim light on top/front edges */}
              <div className='absolute top-[10%] left-[10%] w-[80%] h-[40%] bg-gradient-to-br from-foreground/8 via-transparent to-transparent rounded-full blur-lg opacity-40' />
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
