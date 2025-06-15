'use client';

import { useState, useEffect } from 'react';
import {
  PageTemplate,
  SectionCard,
  StatusBadge,
  LoadingSpinner,
  ButtonLoading
} from "@/components/templates/page-template";

interface AuthStatus {
  isAuthenticated: boolean;
  userInfo?: {
    displayName: string;
    email: string;
    id: string;
  };
  error?: string;
  expiresAt?: string;
  timeUntilExpiry?: number;
}

export default function TestAuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  // Auto-load auth status when component mounts
  useEffect(() => {
    loadAuthStatus();
  }, []);

  const loadAuthStatus = async () => {
    setIsInitialLoading(true);
    try {
      const response = await fetch('/api/auth/teams/status');
      const data = await response.json();
      setAuthStatus(data);
      setResult(data);
    } catch (error) {
      setAuthStatus({
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const testTeamsAuth = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/auth/teams/status');
      const data = await response.json();
      setResult(data);
      setAuthStatus(data);
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setResult(errorResult);
      setAuthStatus({
        isAuthenticated: false,
        error: errorResult.error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initiateTeamsAuth = async () => {
    try {
      const response = await fetch('/api/auth/teams');
      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to initiate auth:', error);
    }
  };

  const forceRefreshToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/teams/refresh', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
      
      // Reload auth status after refresh
      if (data.success) {
        await loadAuthStatus();
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <PageTemplate 
        title="🔍 Test Authentication" 
        description="Đang kiểm tra trạng thái xác thực MS Teams..."
      >
        <SectionCard title="🔄 Loading">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-3 text-gray-600">Đang kiểm tra authentication status...</span>
          </div>
        </SectionCard>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate 
      title="🔍 Test Authentication" 
      description="Kiểm tra trạng thái xác thực MS Teams"
    >
      {/* Current Status */}
      {authStatus && (
        <SectionCard title="📊 Current Authentication Status">
          <div className={`p-4 rounded-lg border ${
            authStatus.isAuthenticated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <StatusBadge type={authStatus.isAuthenticated ? 'success' : 'failed'}>
                  {authStatus.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </StatusBadge>
                {authStatus.expiresAt && (
                  <span className="text-xs text-gray-500">
                    Expires: {new Date(authStatus.expiresAt).toLocaleString()}
                  </span>
                )}
              </div>
              {authStatus.isAuthenticated && (
                <button
                  onClick={forceRefreshToken}
                  disabled={isLoading}
                  className="text-xs btn-secondary px-2 py-1"
                >
                  🔄 Force Refresh
                </button>
              )}
            </div>
            {authStatus.userInfo && (
              <div className="text-sm text-gray-700">
                <p><strong>User:</strong> {authStatus.userInfo.displayName}</p>
                <p><strong>Email:</strong> {authStatus.userInfo.email}</p>
              </div>
            )}
            {authStatus.error && (
              <p className="text-sm text-red-600 mt-2">
                <strong>Error:</strong> {authStatus.error}
              </p>
            )}
          </div>
        </SectionCard>
      )}

      {/* Test Controls */}
      <SectionCard title="🧪 Authentication Tests">
        <div className="space-y-4">
          <ButtonLoading
            isLoading={isLoading}
            onClick={testTeamsAuth}
            className="w-full btn-primary"
          >
            {isLoading ? 'Checking...' : '🔍 Refresh Auth Status'}
          </ButtonLoading>

          <button
            onClick={initiateTeamsAuth}
            className="w-full btn-secondary"
          >
            🚀 Start Teams Authentication
          </button>

          {authStatus?.isAuthenticated && (
            <ButtonLoading
              isLoading={isLoading}
              onClick={forceRefreshToken}
              className="w-full btn-secondary"
            >
              {isLoading ? 'Refreshing...' : '🔄 Force Refresh Token'}
            </ButtonLoading>
          )}
        </div>
      </SectionCard>

      {/* Results */}
      {result && (
        <SectionCard title="📊 Test Results">
          <div className={`p-4 rounded-lg border ${
            result.success !== false ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <StatusBadge type={result.success !== false ? 'success' : 'failed'}>
                {result.success !== false ? 'Success' : 'Failed'}
              </StatusBadge>
              {result.isAuthenticated && (
                <StatusBadge type="info">Authenticated</StatusBadge>
              )}
              {result.tokenRefreshed && (
                <StatusBadge type="info">Token Refreshed</StatusBadge>
              )}
            </div>
            <pre className="text-sm overflow-auto whitespace-pre-wrap text-gray-700">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </SectionCard>
      )}

      {/* Instructions */}
      <SectionCard title="📋 Instructions">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <h4 className="text-card-title">Auto Status Check</h4>
              <p className="text-sm text-gray-600">Trang sẽ tự động kiểm tra và refresh token nếu cần khi load</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <h4 className="text-card-title">Manual Refresh</h4>
              <p className="text-sm text-gray-600">Sử dụng "Refresh Auth Status" để kiểm tra lại hoặc "Force Refresh Token" để ép refresh</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <h4 className="text-card-title">Re-authenticate</h4>
              <p className="text-sm text-gray-600">Nếu refresh token thất bại, sử dụng "Start Teams Authentication" để đăng nhập lại</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageTemplate>
  );
} 