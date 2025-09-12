import { Link } from 'react-router-dom';

export default function ComplianceHub() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-secondary/20'>
      <div className='container mx-auto py-12 px-4'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl font-bold mb-6'>
            Financial Crime & Sanctions
          </h1>
          <p className='text-lg text-muted-foreground mb-8'>
            Anti-money laundering, sanctions compliance, and financial crime
            prevention policies.
          </p>
          <Link
            to='/legal'
            className='text-primary underline hover:no-underline'
          >
            View All Legal Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
