import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Globe, Coins } from 'lucide-react';
import treasureChest from '@/assets/treasure-chest-clean.webp';

const HeroSection = () => {
  return (
    <section className='relative min-h-[75vh] flex items-center justify-center overflow-hidden pt-8 pb-8 bg-background'>
      {/* Background elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-background via-card/30 to-muted/20' />

      <div className='container mx-auto px-4 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto'>
          {/* Left - Content */}
          <div className='text-center lg:text-left space-y-6'>
            {/* Brand eyebrow */}
            <div className='text-3xl md:text-4xl font-bold text-gold'>
              PBCEx
            </div>
            
            {/* Micro-copy */}
            <div className='text-xs text-muted-foreground/70 -mt-2'>
              People's Banking & Commodities Exchange
            </div>

            <h1 className='text-4xl md:text-6xl font-bold text-foreground leading-tight max-w-lg'>
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
                className='group bg-gold text-black hover:bg-gold-light'
                onClick={() => window.location.href = '/markets'}
              >
                Trade now
                <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
              </Button>
              <Button 
                variant='outline' 
                size='lg'
                className='border-muted text-foreground hover:bg-muted/20'
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
              {/* Large soft radial glow - top-right offset */}
              <div className='absolute -top-20 -right-20 w-96 h-96 bg-gradient-radial from-gold/10 to-transparent rounded-full blur-3xl opacity-60' />
              
              {/* Wide curved gradient band - bottom-right */}
              <div className='absolute -bottom-16 -right-32 w-80 h-40 bg-gradient-to-l from-gold-light/8 via-gold/5 to-transparent rounded-full blur-2xl opacity-40 transform rotate-12' />
              
              {/* Treasure chest image */}
              <img
                src={treasureChest}
                alt='Treasure chest representing digital asset storage and wealth building'
                className='w-80 h-80 object-contain relative z-10'
                style={{
                  filter: 'drop-shadow(0 0 20px hsl(var(--gold) / 0.15)) drop-shadow(0 0 40px hsl(var(--gold) / 0.1))',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className='absolute top-20 left-10 w-32 h-32 rounded-full bg-gold/3 blur-2xl' />
      <div className='absolute bottom-20 right-10 w-48 h-48 rounded-full bg-gold-light/3 blur-3xl' />
    </section>
  );
};

export default HeroSection;
