import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Globe, Coins } from 'lucide-react';
import treasureChest from '@/assets/treasure-chest-realistic.png';

const HeroSection = () => {
  return (
    <section className='relative min-h-[65vh] md:min-h-[75vh] flex items-center justify-center overflow-hidden pt-6 pb-2 bg-background'>
      {/* Seamless deep-black blend - no seams */}
      <div className='absolute inset-0 bg-background' />
      <div className='absolute inset-0 bg-gradient-radial from-background via-background to-background opacity-100' />

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
            <div className='relative'>
              {/* Interior glow from chest lid gap only */}
              <div className='absolute top-[25%] left-1/2 transform -translate-x-1/2 w-[120px] h-[80px] bg-gradient-ellipse from-amber-400/25 via-gold/15 to-transparent blur-xl opacity-80' />
              
              {/* Soft shadow beneath chest (not glow) */}
              <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[400px] h-[40px] bg-black/30 rounded-full blur-2xl opacity-60' />
              
              {/* Treasure chest image */}
              <img
                src={treasureChest}
                alt='Treasure chest glowing from within'
                className='w-[700px] h-[700px] md:w-[800px] md:h-[800px] object-contain object-right-center relative z-10'
                style={{
                  filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))',
                }}
              />
              
              {/* Very faint rim light for legibility - 6% strength */}
              <div className='absolute top-[8%] left-[15%] w-[70%] h-[35%] bg-gradient-to-br from-foreground/6 via-transparent to-transparent rounded-lg blur-md opacity-50' />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
