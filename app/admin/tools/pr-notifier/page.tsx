'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TeamsChat {
  id: string;
  displayName: string;
  chatType: string;
  lastUpdated: string;
}

interface PRNotifierConfig {
  azureDevOpsUrl: string;
  targetChatId: string;
  messageTemplate?: string;
  enableMentions: boolean;
  mentionUsers: string[];
}

interface AuthStatus {
  isAuthenticated: boolean;
  userInfo?: {
    displayName: string;
    email: string;
    id: string;
  };
  error?: string;
}

export default function PRNotifierPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [teamsChats, setTeamsChats] = useState<TeamsChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [config, setConfig] = useState<PRNotifierConfig>({
    azureDevOpsUrl: '',
    targetChatId: '',
    messageTemplate: '',
    enableMentions: false,
    mentionUsers: [],
  });
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Check Teams authentication status
      const authResponse = await fetch('/api/auth/teams/status');
      const authData = await authResponse.json();
      setAuthStatus(authData);

      if (authData.isAuthenticated) {
        // Load Teams chats
        await loadTeamsChats();
      }

      // Load current configuration
      const configResponse = await fetch('/api/tools/pr-notifier');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData.tool) {
          setConfig(configData.tool.config || config);
          setIsActive(configData.tool.is_active || false);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamsChats = async () => {
    setChatsLoading(true);
    setChatsError(null);
    
    try {
      const chatsResponse = await fetch('/api/teams/chats');
      const chatsData = await chatsResponse.json();
      
      if (chatsResponse.ok && chatsData.success) {
        setTeamsChats(chatsData.chats || []);
      } else {
        setChatsError(chatsData.error || 'Failed to load Teams chats');
      }
    } catch (error) {
      console.error('Failed to load Teams chats:', error);
      setChatsError('Network error while loading chats. Please try again.');
    } finally {
      setChatsLoading(false);
    }
  };

  const handleTeamsAuth = () => {
    window.location.href = '/api/auth/teams';
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/tools/pr-notifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          is_active: isActive,
        }),
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to save configuration');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addMentionUser = () => {
    setConfig(prev => ({
      ...prev,
      mentionUsers: [...prev.mentionUsers, ''],
    }));
  };

  const updateMentionUser = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      mentionUsers: prev.mentionUsers.map((user, i) => i === index ? value : user),
    }));
  };

  const removeMentionUser = (index: number) => {
    setConfig(prev => ({
      ...prev,
      mentionUsers: prev.mentionUsers.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link
              href="/admin/tools"
              className="text-gray-400 hover:text-gray-600"
            >
              Tools
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">PR Notifier</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl mr-3">🔔</span>
            Pull Request Notifier
          </h1>
          <p className="text-gray-600">
            Tự động thông báo team về pull requests mới từ Azure DevOps
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label className="text-sm text-gray-700 mr-3">Active:</label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? '💾 Saving...' : '💾 Save Configuration'}
          </button>
        </div>
      </div>

      {/* Teams Authentication */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          📱 Microsoft Teams Authentication
        </h2>
        
        {authStatus.isAuthenticated ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                <span className="font-medium text-green-900">Connected to Teams</span>
              </div>
              {authStatus.userInfo && (
                <div className="text-sm text-green-700 mt-1">
                  Logged in as: {authStatus.userInfo.displayName} ({authStatus.userInfo.email})
                </div>
              )}
            </div>
            <button
              onClick={handleTeamsAuth}
              className="btn-secondary text-sm"
            >
              🔄 Reconnect
            </button>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                  <span className="font-medium text-yellow-900">Teams authentication required</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Connect to Microsoft Teams to send notifications
                </p>
              </div>
              <button
                onClick={handleTeamsAuth}
                className="btn-primary"
              >
                🔗 Connect to Teams
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          ⚙️ Configuration
        </h2>

        <div className="space-y-6">
          {/* Azure DevOps URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Azure DevOps Organization URL
            </label>
            <input
              type="url"
              value={config.azureDevOpsUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, azureDevOpsUrl: e.target.value }))}
              className="input-field"
              placeholder="https://dev.azure.com/your-org"
            />
            <p className="text-sm text-gray-500 mt-1">
              URL của Azure DevOps organization (dùng để validate webhooks)
            </p>
          </div>

          {/* Target Teams Chat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Teams Chat
            </label>
                          {authStatus.isAuthenticated ? (
                chatsLoading ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600">
                    🔄 Loading Teams chats...
                  </div>
                ) : chatsError ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      ❌ {chatsError}
                    </div>
                    <button
                      onClick={loadTeamsChats}
                      className="btn-secondary text-sm"
                    >
                      🔄 Retry Loading Chats
                    </button>
                  </div>
                ) : teamsChats.length > 0 ? (
                <select
                  value={config.targetChatId}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetChatId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select a chat...</option>
                  {teamsChats.map((chat) => (
                    <option key={chat.id} value={chat.id}>
                      {chat.displayName} ({chat.chatType})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  No Teams chats found. Make sure you have access to Teams chats.
                </div>
              )
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                Connect to Teams first to see available chats
              </div>
            )}
          </div>

          {/* Mentions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                @Mentions
              </label>
              <input
                type="checkbox"
                checked={config.enableMentions}
                onChange={(e) => setConfig(prev => ({ ...prev, enableMentions: e.target.checked }))}
                className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
              />
            </div>
            
            {config.enableMentions && (
              <div className="space-y-2">
                {config.mentionUsers.map((user, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={user}
                      onChange={(e) => updateMentionUser(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="username (without @)"
                    />
                    <button
                      onClick={() => removeMentionUser(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <button
                  onClick={addMentionUser}
                  className="btn-secondary text-sm"
                >
                  ➕ Add User
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Usernames sẽ được mention trong notification message
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Setup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          📡 Azure DevOps Webhook Setup
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${window.location.origin}/api/webhooks/azure-devops`}
                readOnly
                className="input-field flex-1 bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/azure-devops`)}
                className="btn-secondary px-3"
              >
                📋
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Setup Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Go to Azure DevOps → Project Settings → Service Hooks</li>
              <li>Create a new subscription for "Pull request created"</li>
              <li>Set URL to the webhook URL above</li>
              <li>Add header: <code>x-webhook-signature: your-secret</code></li>
              <li>Test the webhook to ensure it works</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 