'use client';

import { useState, useEffect } from 'react';
import {
  PageTemplate,
  SectionCard,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  PageLoadingTemplate
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
  scope?: string;
  timeUntilExpiry?: number;
}

export default function AuthPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'true') {
      setOauthMessage({ type: 'success', message: 'Teams authentication successful! 🎉' });
      // Clear URL params
      window.history.replaceState({}, document.title, '/admin/auth');
    } else if (error) {
      setOauthMessage({ type: 'error', message: `Authentication failed: ${decodeURIComponent(error)}` });
      // Clear URL params
      window.history.replaceState({}, document.title, '/admin/auth');
    }
    
    loadAuthStatus();
  }, []);

  const loadAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/teams/status');
      const data = await response.json();
      setAuthStatus(data);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/teams';
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/auth/teams/refresh', {
        method: 'POST'
      });
      
      if (response.ok) {
        // Reload auth status after refresh
        await loadAuthStatus();
      } else {
        console.error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Only show loading for refresh, not initial load
  if (isLoading && !isInitialLoad) {
    return (
      <PageLoadingTemplate 
        title="🔐 Teams Authentication" 
        description="Đang tải lại trạng thái xác thực..."
        text="Refreshing authentication status..."
      />
    );
  }

  return (
    <PageTemplate 
      title="🔐 Teams Authentication" 
      description="Kết nối với Microsoft Teams để gửi thông báo"
    >
      {/* Authentication Status */}
      <SectionCard 
        title="📊 Authentication Status"
        actions={
          <button
            onClick={loadAuthStatus}
            className="text-link text-sm"
            disabled={isLoading}
          >
            🔄 Refresh Status
          </button>
        }
      >
        {!authStatus ? (
          <EmptyState
            icon="❌"
            title="Not Authenticated"
            description="You need to authenticate with Microsoft Teams to send notifications."
            action={
              <button onClick={handleLogin} className="btn-primary">
                🚀 Connect to Microsoft Teams
              </button>
            }
          />
        ) : authStatus.error ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
            <p className="text-gray-600 mb-6">{authStatus.error}</p>
            <button onClick={handleLogin} className="btn-primary">
              🔄 Re-authenticate
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h3 className="text-card-title text-green-800">Successfully Authenticated</h3>
                  <p className="text-meta text-green-600">Connected to Microsoft Teams</p>
                </div>
              </div>
              <StatusBadge type="success">Active</StatusBadge>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">👤 User Information</h4>
                <div className="space-y-1">
                  <p className="text-sm"><strong>Name:</strong> {authStatus.userInfo?.displayName}</p>
                  <p className="text-sm"><strong>Email:</strong> {authStatus.userInfo?.email}</p>
                  <p className="text-sm"><strong>ID:</strong> {authStatus.userInfo?.id}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">⏰ Token Information</h4>
                <div className="space-y-1">
                  <p className="text-sm">
                    <strong>Expires:</strong> {authStatus.expiresAt ? new Date(authStatus.expiresAt).toLocaleString('vi-VN') : 'Unknown'}
                  </p>
                  <p className="text-sm">
                    <strong>Time until expiry:</strong> {
                      authStatus.timeUntilExpiry 
                        ? `${Math.round(authStatus.timeUntilExpiry / 60)} minutes`
                        : 'Unknown'
                    }
                  </p>
                  <p className="text-sm">
                    <strong>Scope:</strong> {authStatus.scope || 'Default'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                className="btn-secondary"
              >
                {isRefreshing ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Refreshing...</span>
                  </div>
                ) : (
                  '🔄 Force Refresh Token'
                )}
              </button>
              
              <button onClick={handleLogin} className="btn-primary">
                🔄 Re-authenticate
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Microsoft Teams OAuth */}
      <SectionCard title="🔗 Microsoft Teams OAuth">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">ℹ️ How it works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click "Connect to Microsoft Teams" to start OAuth flow</li>
              <li>• You'll be redirected to Microsoft login page</li>
              <li>• Grant permissions to send messages to Teams</li>
              <li>• You'll be redirected back with authentication token</li>
              <li>• Token will be automatically refreshed when needed</li>
            </ul>
          </div>

          {!authStatus?.isAuthenticated && (
            <div className="text-center py-6">
              <button onClick={handleLogin} className="btn-primary">
                🚀 Connect to Microsoft Teams
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Troubleshooting */}
      <SectionCard title="🔧 Troubleshooting">
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Common Issues</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Token expired:</strong> Use "Force Refresh Token" or re-authenticate</li>
              <li>• <strong>Permission denied:</strong> Make sure you have proper Teams permissions</li>
              <li>• <strong>Network issues:</strong> Check your internet connection</li>
              <li>• <strong>Popup blocked:</strong> Allow popups for this site</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🔍 Debug Information</h4>
            <div className="text-xs font-mono text-gray-600">
              <p>Environment: {process.env.NODE_ENV}</p>
              <p>Timestamp: {new Date().toISOString()}</p>
              <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageTemplate>
  );
} 