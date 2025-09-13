import { ReactNode } from 'react';
import Navigation from './Navigation';
import AdminBanner from './AdminBanner';
import { APP_BUILD_VERSION } from '@/lib/constants';

interface LayoutProps {
  children: ReactNode;
  showAdminBanner?: boolean;
  adminBannerType?: 'info' | 'warning' | 'maintenance';
  adminBannerContent?: ReactNode;
}

const Layout = ({
  children,
  showAdminBanner = false,
  adminBannerType = 'info',
  adminBannerContent = 'Scheduled maintenance window: 2:00 AM - 4:00 AM EST',
}: LayoutProps) => {
  return (
    <div
      className='min-h-screen bg-background'
      data-app-build={APP_BUILD_VERSION}
    >
      <Navigation />
      {showAdminBanner && (
        <AdminBanner type={adminBannerType}>{adminBannerContent}</AdminBanner>
      )}
      {children}
    </div>
  );
};

export default Layout;
