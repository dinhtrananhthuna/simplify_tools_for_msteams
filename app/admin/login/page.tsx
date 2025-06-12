'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First verify credentials with API
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const loginResult = await loginResponse.json();

      if (loginResult.success) {
        // Store credentials for subsequent requests
        const authString = btoa(`${credentials.username}:${credentials.password}`);
        localStorage.setItem('adminAuth', authString);
        
        console.log('✅ Login successful, redirecting to dashboard');
        
        // Redirect to dashboard
        window.location.href = '/admin/dashboard';
      } else {
        setError(loginResult.error || 'Invalid credentials');
        console.log('❌ Login failed:', loginResult.error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <span className="text-6xl">🚀</span>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              MS Teams Tools
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Admin Panel Login
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-teams-purple focus:border-teams-purple focus:z-10 sm:text-sm"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-teams-purple focus:border-teams-purple focus:z-10 sm:text-sm"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">
                {error}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teams-purple hover:bg-teams-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teams-purple disabled:opacity-50"
            >
              {isLoading ? '🔄 Signing in...' : '🔑 Sign in'}
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600">
              Default credentials: <code className="bg-gray-100 px-2 py-1 rounded">admin / password</code>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 