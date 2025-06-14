'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PageTemplate,
  SectionCard,
  StatusBadge,
  LoadingSpinner,
  ButtonLoading,
  PageLoadingTemplate
} from "@/components/templates/page-template";

interface TeamsChat {
  id: string;
  displayName: string;
  chatType: string;
  memberCount: number;
  members: Array<{
    id: string;
    displayName: string;
    email?: string;
  }>;
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
  const { toast } = useToast();
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

  const loadTeamsChats = async (forceRefresh: boolean = false) => {
    setChatsLoading(true);
    setChatsError(null);
    
    try {
      const url = '/api/teams/chats?limit=10'; // Using simple fetch - no cache needed
      const chatsResponse = await fetch(url);
      const chatsData = await chatsResponse.json();
      
      if (chatsResponse.ok && chatsData.success) {
        setTeamsChats(chatsData.chats || []);
        
        // Show cache status in console for debugging
        console.log(`📊 Chats loaded: ${chatsData.count} items, cached: ${chatsData.cached}`);
      } else {
        setChatsError(chatsData.error || 'Failed to load Teams chats');
      }
    } catch (error) {
      console.error('Failed to load Teams chats:', error);
      
      // Better error messages based on error type
      if (error instanceof Error && error.message.includes('timeout')) {
        setChatsError('Request timed out. Teams API is slow, please try again or use force refresh.');
      } else {
        setChatsError('Network error while loading chats. Please try again.');
      }
    } finally {
      setChatsLoading(false);
    }
  };

  const handleTeamsAuth = () => {
    window.location.href = '/api/auth/teams';
  };

  const handleCopyWebhookUrl = async () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/azure-devops`;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({
        variant: 'success',
        title: 'Đã copy!',
        description: 'Webhook URL đã được sao chép vào clipboard',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi!',
        description: 'Không thể sao chép URL. Vui lòng thử lại.',
      });
    }
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
        toast({
          variant: 'success',
          title: 'Thành công!',
          description: 'Cấu hình đã được lưu thành công',
        });
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: `Không thể lưu: ${error.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi!',
        description: 'Không thể lưu cấu hình',
      });
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
      <PageLoadingTemplate 
        title="🔔 Pull Request Notifier" 
        description="Đang tải cấu hình..."
        text="Loading configuration..."
      />
    );
  }

  return (
    <TooltipProvider>
      <PageTemplate 
        title="🔔 Pull Request Notifier" 
        description="Tự động thông báo team về pull requests mới từ Azure DevOps"
        actions={
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Active:</label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
              />
            </div>
            <ButtonLoading
              isLoading={isSaving}
              onClick={handleSaveConfig}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : '💾 Save Configuration'}
            </ButtonLoading>
          </div>
        }
      >
        {/* Teams Authentication */}
        <SectionCard title="📱 Microsoft Teams Authentication">
          {authStatus.isAuthenticated ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="flex items-center space-x-2">
                  <StatusBadge type="success">Connected</StatusBadge>
                  <span className="text-card-title text-green-900">Connected to Teams</span>
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
                  <div className="flex items-center space-x-2">
                    <StatusBadge type="warning">Required</StatusBadge>
                    <span className="text-card-title text-yellow-900">Teams authentication required</span>
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
        </SectionCard>

        {/* Configuration Form */}
        <SectionCard title="⚙️ Configuration">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadTeamsChats(false)}
                        className="btn-secondary text-sm"
                      >
                        🔄 Retry (Cached)
                      </button>
                      <button
                        onClick={() => loadTeamsChats(true)}
                        className="btn-primary text-sm"
                      >
                        🚀 Force Refresh
                      </button>
                    </div>
                  </div>
                ) : teamsChats.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Found {teamsChats.length} chats
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => loadTeamsChats(true)}
                            className="btn-secondary text-xs"
                          >
                            🔄 Refresh
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Force refresh to get latest chats</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-3">
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
                      
                      {/* Chat Details */}
                      {config.targetChatId && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          {(() => {
                            const selectedChat = teamsChats.find(chat => chat.id === config.targetChatId);
                            if (!selectedChat) return null;
                            
                            return (
                              <div>
                                <h4 className="font-medium text-blue-900 mb-2">
                                  📋 Selected Chat Details
                                </h4>
                                <div className="text-sm text-blue-800 space-y-1">
                                  <div><strong>Name:</strong> {selectedChat.displayName}</div>
                                  <div><strong>Type:</strong> {selectedChat.chatType}</div>
                                  <div><strong>Members:</strong> {selectedChat.memberCount}</div>
                                  {selectedChat.members.length > 0 && (
                                    <div>
                                      <strong>Participants:</strong>
                                      <ul className="ml-4 mt-1">
                                        {selectedChat.members.map((member, index) => (
                                          <li key={index} className="text-xs">
                                            • {member.displayName}
                                            {member.email && ` (${member.email})`}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
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
        </SectionCard>

        {/* Webhook Setup */}
        <SectionCard title="📡 Azure DevOps Webhook Setup">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyWebhookUrl}
                      className="btn-secondary px-3 hover:bg-gray-100 transition-colors"
                    >
                      📋
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy webhook URL</p>
                  </TooltipContent>
                </Tooltip>
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
        </SectionCard>
      </PageTemplate>
    </TooltipProvider>
  );
} 