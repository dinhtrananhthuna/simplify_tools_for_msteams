'use client';

import { useState, useEffect } from 'react';

interface DebugInfo {
  debug?: {
    allTokens: any;
    adminToken: any;
    hasValidToken: boolean;
    authStatus: any;
    timestamp: string;
  };
  error?: string;
}

interface AuthStatus {
  success?: boolean;
  isAuthenticated: boolean;
  userInfo?: any;
  error?: string;
}

export default function TestAuthPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(false);

  const checkDebugAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/auth');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Debug auth check failed:', error);
      setDebugInfo({ error: 'Failed to check debug auth' });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/teams/status');
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthStatus({ isAuthenticated: false, error: 'Failed to check auth status' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDebugAuth();
    checkAuthStatus();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🔧 Auth Debug</h1>
        <div className="space-x-3">
          <button
            onClick={checkDebugAuth}
            disabled={isLoading}
            className="btn-secondary"
          >
            🔍 Check Debug
          </button>
          <button
            onClick={checkAuthStatus}
            disabled={isLoading}
            className="btn-primary"
          >
            📊 Check Status
          </button>
        </div>
      </div>

      {/* Auth Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          📱 Auth Status (from /api/auth/teams/status)
        </h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          🔧 Debug Info (from /api/debug/auth)
        </h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>

      {/* Quick Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          ⚡ Quick Summary
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Has Valid Token (Debug):</span>
            <span className={`font-medium ${debugInfo.debug?.hasValidToken ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.debug?.hasValidToken ? '✅ YES' : '❌ NO'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Is Authenticated (Status):</span>
            <span className={`font-medium ${authStatus.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
              {authStatus.isAuthenticated ? '✅ YES' : '❌ NO'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Token Expires At:</span>
            <span className="font-medium text-gray-900">
              {debugInfo.debug?.authStatus?.expiresAt 
                ? new Date(debugInfo.debug.authStatus.expiresAt).toLocaleString() 
                : 'N/A'}
            </span>
          </div>
          
          {(authStatus.error || debugInfo.error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-medium">Errors:</p>
              {authStatus.error && (
                <p className="text-red-700 text-sm">Status: {authStatus.error}</p>
              )}
              {debugInfo.error && (
                <p className="text-red-700 text-sm">Debug: {debugInfo.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 