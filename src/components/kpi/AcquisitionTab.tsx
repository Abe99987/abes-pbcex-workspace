import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';

const AcquisitionTab = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Acquisition</h2>
          <p className='text-muted-foreground'>
            Customer acquisition metrics and channels
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Inspect
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acquisition Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-64 bg-muted/50 rounded-lg flex items-center justify-center'>
            <p className='text-muted-foreground'>
              Acquisition metrics coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcquisitionTab;
