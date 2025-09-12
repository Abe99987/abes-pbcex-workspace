import { Link } from 'react-router-dom';

export default function OperationsHub() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-secondary/20'>
      <div className='container mx-auto py-12 px-4'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-4xl font-bold mb-6'>Operations & Records</h1>
          <p className='text-lg text-muted-foreground mb-8'>
            Operational procedures, record keeping, and business continuity
            policies.
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
