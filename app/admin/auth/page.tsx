'use client';

import { useState, useEffect } from 'react';

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
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(true);
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
    
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/teams/status');
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamsAuth = () => {
    window.location.href = '/api/auth/teams';
  };

  const handleLogout = () => {
    // Clear admin auth
    localStorage.removeItem('adminAuth');
    window.location.href = '/admin/login';
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/auth/teams/refresh', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        const message = data.forceRefresh 
          ? `Token force refreshed successfully! 🚀\n📅 New expiry: ${data.newTokenInfo?.newExpiresAt ? new Date(data.newTokenInfo.newExpiresAt).toLocaleString('vi-VN') : 'N/A'}\n⏱️ Duration: ${data.newTokenInfo?.expiresIn ? Math.round(data.newTokenInfo.expiresIn / 60) + ' minutes' : 'N/A'}`
          : data.tokenRefreshed 
            ? 'Token refreshed successfully! 🔄' 
            : 'Token was already valid ✅';
            
        setOauthMessage({ 
          type: 'success', 
          message 
        });
        
        // Refresh auth status
        await checkAuthStatus();
      } else {
        setOauthMessage({ 
          type: 'error', 
          message: `Refresh failed: ${data.error}` 
        });
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      setOauthMessage({ 
        type: 'error', 
        message: 'Failed to refresh token' 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔐 Authentication Management</h1>
        <p className="text-gray-600">
          Quản lý authentication và permissions cho MS Teams integration
        </p>
        
        {/* OAuth Callback Messages */}
        {oauthMessage && (
          <div className={`mt-4 p-4 rounded-lg ${
            oauthMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{oauthMessage.message}</span>
              <button 
                onClick={() => setOauthMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Authentication */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          👤 Admin Authentication
        </h2>
        
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              <span className="font-medium text-green-900">Logged in as Admin</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Session active since login
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary text-sm"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Teams Authentication */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          💜 Microsoft Teams Authentication
        </h2>
        
        {authStatus.isAuthenticated ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  <span className="font-medium text-green-900">Connected to Teams</span>
                </div>
                {authStatus.userInfo && (
                  <div className="text-sm text-green-700 mt-1">
                    <p><strong>Name:</strong> {authStatus.userInfo.displayName}</p>
                    <p><strong>Email:</strong> {authStatus.userInfo.email}</p>
                    <p><strong>ID:</strong> {authStatus.userInfo.id}</p>
                  </div>
                )}
                {authStatus.expiresAt && (
                  <div className="text-sm text-green-700 mt-2">
                    <p><strong>Token expires:</strong> {new Date(authStatus.expiresAt).toLocaleString('vi-VN')}</p>
                    {authStatus.timeUntilExpiry !== undefined && (
                      <p><strong>Time remaining:</strong> {
                        authStatus.timeUntilExpiry > 0 
                          ? `${Math.round(authStatus.timeUntilExpiry / 60)} minutes (${authStatus.timeUntilExpiry} seconds)`
                          : `EXPIRED ${Math.abs(Math.round(authStatus.timeUntilExpiry / 60))} minutes ago`
                      }</p>
                    )}
                    <p className="text-xs text-gray-600">
                      {authStatus.timeUntilExpiry !== undefined && authStatus.timeUntilExpiry <= 300 
                        ? '⚠️ Auto-refresh sẽ kích hoạt ngay lập tức (token expires soon/expired)'
                        : '✅ Auto-refresh sẽ kích hoạt khi token còn dưới 5 phút'
                      }
                    </p>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={checkAuthStatus}
                  className="btn-secondary text-sm"
                  disabled={isLoading}
                >
                  🔄 Refresh Status
                </button>
                <button
                  onClick={handleForceRefresh}
                  className="btn-secondary text-sm"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? '⏳ Refreshing...' : '🔄 Force Refresh Token'}
                </button>
                <button
                  onClick={handleTeamsAuth}
                  className="btn-secondary text-sm"
                >
                  🔄 Reconnect
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Available Permissions:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Chat.ReadWrite - Send messages to Teams chats</li>
                <li>✅ TeamMember.Read.All - Read team member information</li>
                <li>✅ User.Read - Read user profile</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                    <span className="font-medium text-yellow-900">Teams authentication required</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Connect to Microsoft Teams để enable tools functionality
                  </p>
                  {authStatus.error && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {authStatus.error}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleTeamsAuth}
                  className="btn-primary"
                >
                  🔗 Connect to Teams
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What permissions will be requested:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>📝 <strong>Chat.ReadWrite</strong> - Send notifications to Teams chats</li>
                <li>👥 <strong>TeamMember.Read.All</strong> - List available chats and teams</li>
                <li>👤 <strong>User.Read</strong> - Get your basic profile information</li>
              </ul>
              <p className="text-sm text-blue-600 mt-2">
                Your data is stored securely và chỉ dùng để send notifications.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          🛡️ Security Settings
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Token Encryption</h3>
              <p className="text-sm text-gray-500">All authentication tokens are encrypted at rest</p>
            </div>
            <span className="text-green-500">✅ Enabled</span>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Webhook Signatures</h3>
              <p className="text-sm text-gray-500">Webhook requests require valid signatures</p>
            </div>
            <span className="text-green-500">✅ Enabled</span>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Admin Basic Auth</h3>
              <p className="text-sm text-gray-500">Admin panel protected by username/password</p>
            </div>
            <span className="text-green-500">✅ Enabled</span>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">HTTPS Only</h3>
              <p className="text-sm text-gray-500">All communications use secure HTTPS protocol</p>
            </div>
            <span className="text-green-500">✅ Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
} 