import { useRouter } from 'next/router';
import { useEffect, useState, FormEvent } from 'react';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: loading, login } = useAuth();
  const [err, setErr] = useState<string | null>(null);

  // If already logged in, bounce to next or dashboard
  useEffect(() => {
    if (!loading && user) {
      const next =
        typeof router.query.next === 'string'
          ? router.query.next
          : '/dashboard';
      router.replace(next);
    }
  }, [loading, user, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');
    try {
      await login(email, password); // Use the existing login method from useAuth
      const next =
        typeof router.query.next === 'string'
          ? router.query.next
          : '/dashboard';
      router.replace(next);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? 'Login failed');
    }
  };

  const devLogin = async () => {
    setErr(null);
    try {
      if (process.env.NEXT_PUBLIC_ENABLE_DEV_FAKE_LOGIN === 'true') {
        await login('dev@example.com', 'dev'); // Simple dev login
        const next =
          typeof router.query.next === 'string'
            ? router.query.next
            : '/dashboard';
        router.replace(next);
      } else {
        setErr(
          'Dev fake login disabled. Set NEXT_PUBLIC_ENABLE_DEV_FAKE_LOGIN=true to enable.'
        );
      }
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? 'Dev login failed');
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <main className='mx-auto max-w-sm p-6'>
        <h1 className='text-xl font-semibold mb-4'>Log in</h1>

        <form onSubmit={handleLogin} className='space-y-3'>
          <label className='block'>
            <span className='text-sm'>Email</span>
            <input
              name='email'
              type='email'
              required
              className='w-full border p-2 rounded'
            />
          </label>
          <label className='block'>
            <span className='text-sm'>Password</span>
            <input
              name='password'
              type='password'
              required
              className='w-full border p-2 rounded'
            />
          </label>
          <button
            type='submit'
            className='w-full border p-2 rounded font-medium'
          >
            Sign in
          </button>
        </form>

        {process.env.NEXT_PUBLIC_ENABLE_DEV_FAKE_LOGIN === 'true' && (
          <div className='mt-6'>
            <button onClick={devLogin} className='w-full border p-2 rounded'>
              Dev Fake Login
            </button>
            <p className='text-xs text-gray-500 mt-2'>
              Enabled via NEXT_PUBLIC_ENABLE_DEV_FAKE_LOGIN.
            </p>
          </div>
        )}

        {err && <p className='mt-4 text-sm text-red-600'>{err}</p>}
      </main>
    </>
  );
}
