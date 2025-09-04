import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Info, Wrench } from 'lucide-react';

interface AdminBannerProps {
  type?: 'info' | 'warning' | 'maintenance';
  dismissible?: boolean;
  children: React.ReactNode;
}

const AdminBanner = ({
  type = 'info',
  dismissible = true,
  children,
}: AdminBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className='h-4 w-4' />;
      case 'maintenance':
        return <Wrench className='h-4 w-4' />;
      default:
        return <Info className='h-4 w-4' />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'maintenance':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950/20 dark:border-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={`border-b ${getStyles()}`}>
      <div className='container mx-auto px-4 py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {getIcon()}
            <span className='text-sm font-medium'>Admin Terminal</span>
            <span className='text-sm'>{children}</span>
          </div>
          {dismissible && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsVisible(false)}
              className='h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10'
            >
              <X className='h-3 w-3' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBanner;
