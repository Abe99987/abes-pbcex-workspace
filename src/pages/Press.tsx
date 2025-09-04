import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PressForm from '@/components/PressForm';

const Press = () => {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-2xl mx-auto'>
            <div className='text-center mb-12'>
              <h1 className='text-3xl md:text-4xl font-bold mb-4'>
                Press & Media
              </h1>
              <p className='text-xl text-muted-foreground'>
                Connect with our media team for interviews, features, and
                collaboration opportunities.
              </p>
            </div>

            <PressForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Press;
