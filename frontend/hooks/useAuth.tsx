import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import {
  api,
  setAuthToken,
  removeAuthToken,
  getAuthToken,
  User,
} from '@/utils/api';
import toast from 'react-hot-toast';

/**
 * Authentication hook and context for PBCEx frontend
 */

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.auth.me();
        if (response.data.code === 'SUCCESS' && response.data.data?.user) {
          setUser(response.data.data.user);
        } else {
          removeAuthToken();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        removeAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Dev shortcut (explicitly gated)
      if (
        process.env.NEXT_PUBLIC_ENABLE_DEV_FAKE_LOGIN === 'true' &&
        email === 'dev@example.com'
      ) {
        const devUser = {
          id: 'dev-user',
          email: 'dev@example.com',
          firstName: 'Dev',
          lastName: 'User',
          kycStatus: 'APPROVED',
          emailVerified: true,
          phoneVerified: true,
          twoFactorEnabled: false,
          role: 'USER',
        };
        setUser(devUser);
        toast.success(`Welcome back, Dev User! (Fake login enabled)`);
        return;
      }

      const response = await api.auth.login({ email, password });

      if (response.data.code === 'SUCCESS' && response.data.data) {
        const { user: userData, accessToken } = response.data.data;

        setAuthToken(accessToken);
        setUser(userData);

        toast.success(`Welcome back, ${userData.firstName || 'User'}!`);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      const responseError = error as {
        response?: { data?: { message?: string } };
      };
      const message = responseError.response?.data?.message || errorMessage;
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await api.auth.register(data);

      if (response.data.code === 'SUCCESS' && response.data.data) {
        const { user: userData, accessToken } = response.data.data;

        setAuthToken(accessToken);
        setUser(userData);

        toast.success(`Welcome to PBCEx, ${userData.firstName || 'User'}!`);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed';
      const responseError = error as {
        response?: { data?: { message?: string } };
      };
      const message = responseError.response?.data?.message || errorMessage;
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      removeAuthToken();
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await api.auth.me();
      if (response.data.code === 'SUCCESS' && response.data.data?.user) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't logout on refresh failure - token might still be valid
    }
  };

  const updateUser = (updates: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Reason: exports include non-React hooks used by other modules
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hooks for specific auth states
// eslint-disable-next-line react-refresh/only-export-components -- Reason: exports include non-React hooks used by other modules
export function useRequireAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  return { user, isAuthenticated, isLoading };
}

// eslint-disable-next-line react-refresh/only-export-components -- Reason: exports include non-React hooks used by other modules
export function useRequireAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else if (!isAdmin) {
        toast.error('Admin access required');
        window.location.href = '/dashboard';
      }
    }
  }, [isAuthenticated, isAdmin, isLoading]);

  return { user, isAuthenticated, isAdmin, isLoading };
}

// eslint-disable-next-line react-refresh/only-export-components -- Reason: exports include non-React hooks used by other modules
export function useKycStatus() {
  const { user } = useAuth();

  const needsKyc =
    !user || ['NOT_STARTED', 'REJECTED', 'EXPIRED'].includes(user.kycStatus);
  const kycPending =
    user && ['IN_PROGRESS', 'PENDING_REVIEW'].includes(user.kycStatus);
  const kycApproved = user?.kycStatus === 'APPROVED';
  const canTrade = kycApproved && user?.emailVerified;
  const canWithdraw = canTrade && user?.phoneVerified;

  return {
    kycStatus: user?.kycStatus || 'NOT_STARTED',
    needsKyc,
    kycPending,
    kycApproved,
    canTrade,
    canWithdraw,
  };
}

// Utility function to format user display name
// eslint-disable-next-line react-refresh/only-export-components -- Reason: exports include non-React utility function used by other modules
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'User';

  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  const emailName = user.email?.split('@')[0];
  return emailName || 'User';
}
