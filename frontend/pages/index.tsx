/* eslint-disable react-refresh/only-export-components */
import type { GetServerSideProps } from 'next';

// Redirect homepage to dashboard since that's the main user interface
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
};

// This component won't be rendered due to the redirect
export default function IndexRedirect() {
  return null;
}
