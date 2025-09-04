import { ReactNode } from 'react';
import Navigation from './Navigation';
import AdminBanner from './AdminBanner';

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
    <div className='min-h-screen bg-background'>
      <Navigation />
      {showAdminBanner && (
        <AdminBanner type={adminBannerType}>{adminBannerContent}</AdminBanner>
      )}
      {children}
    </div>
  );
};

export default Layout;
