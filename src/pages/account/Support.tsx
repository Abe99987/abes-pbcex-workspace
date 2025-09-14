import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Book,
  Search,
  ExternalLink,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
  FileText,
  Video,
} from 'lucide-react';

const Support = () => {
  const faqCategories = [
    {
      title: 'Getting Started',
      icon: Book,
      questions: [
        { question: 'How do I create an account?', answer: 'Step-by-step account creation guide...' },
        { question: 'How do I verify my identity?', answer: 'KYC verification process...' },
        { question: 'How do I make my first deposit?', answer: 'Deposit methods and instructions...' },
        { question: 'How do I place my first order?', answer: 'Trading basics and order types...' },
      ]
    },
    {
      title: 'Trading & Orders',
      icon: ArrowRight,
      questions: [
        { question: 'What are the different order types?', answer: 'Limit, market, and scale orders explained...' },
        { question: 'How do trading fees work?', answer: 'Fee structure and calculation...' },
        { question: 'How do I cancel an order?', answer: 'Order management and cancellation...' },
        { question: 'What is a scale order?', answer: 'Advanced order type for dollar-cost averaging...' },
      ]
    },
    {
      title: 'Security & Privacy',
      icon: CheckCircle,
      questions: [
        { question: 'How do I enable two-factor authentication?', answer: '2FA setup guide...' },
        { question: 'How do I reset my password?', answer: 'Password recovery process...' },
        { question: 'Is my personal information secure?', answer: 'Privacy and security measures...' },
        { question: 'How do I report suspicious activity?', answer: 'Security incident reporting...' },
      ]
    },
    {
      title: 'Deposits & Withdrawals',
      icon: ArrowRight,
      questions: [
        { question: 'What deposit methods are available?', answer: 'Bank transfer, card, crypto options...' },
        { question: 'How long do deposits take?', answer: 'Processing times by method...' },
        { question: 'How do I withdraw funds?', answer: 'Withdrawal process and limits...' },
        { question: 'Are there any fees for deposits/withdrawals?', answer: 'Fee schedule and minimums...' },
      ]
    }
  ];

  const supportChannels = [
    {
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      status: 'Available now',
      statusColor: 'green',
      action: 'Start Chat',
      availability: '24/7',
    },
    {
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: Mail,
      status: 'Response within 2 hours',
      statusColor: 'blue',
      action: 'Send Email',
      availability: 'Always open',
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with a specialist',
      icon: Phone,
      status: 'Available 9 AM - 6 PM EST',
      statusColor: 'yellow',
      action: 'Call Now',
      availability: 'Business hours',
    },
  ];

  const resources = [
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: Video,
      count: '25+ videos',
      link: '/education/videos',
    },
    {
      title: 'User Guide',
      description: 'Complete platform documentation',
      icon: FileText,
      count: '50+ articles',
      link: '/education/guides',
    },
    {
      title: 'Community Forum',
      description: 'Connect with other users',
      icon: Users,
      count: '1,200+ members',
      link: '/community',
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Support & Help Center - PBCEx | Get Help & Contact Support</title>
        <meta
          name='description'
          content='Get help with your PBCEx account. Browse FAQs, contact support, and access educational resources.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto space-y-8'>
          
          {/* Header */}
          <div className='text-center space-y-4'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <div className='p-3 rounded-full bg-primary/10 border border-primary/20'>
                <HelpCircle className='w-8 h-8 text-primary' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-foreground'>Support & Help Center</h1>
                <p className='text-muted-foreground mt-1'>
                  We're here to help you succeed with PBCEx
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <Card className='bg-card/50 border-border/50'>
            <CardContent className='p-6'>
              <div className='max-w-md mx-auto'>
                <Label htmlFor='search' className='sr-only'>Search</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5' />
                  <Input
                    id='search'
                    placeholder='Search for help articles, guides, or FAQs...'
                    className='pl-10 h-12 text-base'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Channels */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              const getStatusColor = (color: string) => {
                switch (color) {
                  case 'green':
                    return 'bg-green-500/10 text-green-400 border-green-500/30';
                  case 'blue':
                    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                  case 'yellow':
                    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
                  default:
                    return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
                }
              };

              return (
                <Card key={index} className='bg-card/50 border-border/50 hover:bg-card/70 transition-colors'>
                  <CardContent className='p-6 text-center'>
                    <div className='p-3 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto mb-4'>
                      <Icon className='w-6 h-6 text-primary' />
                    </div>
                    <h3 className='font-semibold text-foreground mb-2'>{channel.title}</h3>
                    <p className='text-sm text-muted-foreground mb-4'>{channel.description}</p>
                    <Badge className={getStatusColor(channel.statusColor)} variant='outline'>
                      {channel.status}
                    </Badge>
                    <div className='text-xs text-muted-foreground mt-2 mb-4'>
                      {channel.availability}
                    </div>
                    <Button className='w-full'>
                      {channel.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground'>Frequently Asked Questions</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Find quick answers to common questions
              </p>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                {faqCategories.map((category, index) => {
                  const Icon = category.icon;
                  
                  return (
                    <div key={index} className='space-y-4'>
                      <div className='flex items-center gap-2 mb-4'>
                        <Icon className='w-5 h-5 text-primary' />
                        <h3 className='font-semibold text-foreground'>{category.title}</h3>
                      </div>
                      
                      <div className='space-y-3'>
                        {category.questions.map((faq, faqIndex) => (
                          <div
                            key={faqIndex}
                            className='p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer'
                          >
                            <div className='flex items-center justify-between'>
                              <h4 className='text-sm font-medium text-foreground'>
                                {faq.question}
                              </h4>
                              <ExternalLink className='w-4 h-4 text-muted-foreground' />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground'>Educational Resources</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Learn more about trading and using PBCEx
              </p>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {resources.map((resource, index) => {
                  const Icon = resource.icon;
                  
                  return (
                    <div
                      key={index}
                      className='p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group'
                    >
                      <div className='flex items-start gap-3'>
                        <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
                          <Icon className='w-5 h-5 text-primary' />
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-medium text-foreground mb-1'>{resource.title}</h4>
                          <p className='text-sm text-muted-foreground mb-2'>{resource.description}</p>
                          <div className='text-xs text-muted-foreground mb-3'>{resource.count}</div>
                          <div className='flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all'>
                            Explore
                            <ArrowRight className='w-4 h-4' />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground'>Send us a Message</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Can't find what you're looking for? Send us a detailed message
              </p>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name</Label>
                  <Input id='name' placeholder='Your full name' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input id='email' type='email' placeholder='your@email.com' />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='category'>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='account'>Account Issues</SelectItem>
                    <SelectItem value='trading'>Trading Questions</SelectItem>
                    <SelectItem value='deposits'>Deposits & Withdrawals</SelectItem>
                    <SelectItem value='security'>Security Concerns</SelectItem>
                    <SelectItem value='technical'>Technical Support</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='subject'>Subject</Label>
                <Input id='subject' placeholder='Brief description of your issue' />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='message'>Message</Label>
                <Textarea
                  id='message'
                  placeholder='Please provide as much detail as possible...'
                  rows={5}
                />
              </div>

              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Clock className='w-4 h-4' />
                <span>We typically respond within 2 hours during business hours</span>
              </div>

              <Button className='w-full md:w-auto'>
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;