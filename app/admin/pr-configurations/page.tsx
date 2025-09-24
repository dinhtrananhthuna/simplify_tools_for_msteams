'use client';

import { useState, useEffect } from 'react';
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
import type { PRConfiguration, TeamsMessageTarget } from '@/types';

// More descriptive name for chats/channels
type TeamsConversation = TeamsMessageTarget & {
  displayName: string;
};

interface AuthStatus {
  isAuthenticated: boolean;
  userInfo?: {
    displayName: string;
    email: string;
    id: string;
  };
  error?: string;
}

interface PRConfigurationForm {
  name: string;
  azure_devops_org_url: string;
  azure_devops_project?: string;
  target_chat_id: string;
  target_chat_name?: string;
  target_chat_type?: string;
  target_team_id?: string;
  enable_mentions: boolean;
  mention_users: string[];
  webhook_secret?: string;
  is_active: boolean;
}

const emptyForm: PRConfigurationForm = {
  name: '',
  azure_devops_org_url: '',
  azure_devops_project: '',
  target_chat_id: '',
  target_chat_name: '',
  target_chat_type: 'group',
  target_team_id: '',
  enable_mentions: false,
  mention_users: [],
  webhook_secret: '',
  is_active: true,
};

export default function PRConfigurationsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [configurations, setConfigurations] = useState<PRConfiguration[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [teamsChats, setTeamsChats] = useState<TeamsConversation[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PRConfigurationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

      // Load configurations
      await loadConfigurations();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigurations = async () => {
    try {
      const response = await fetch('/api/pr-configurations', {
        headers: {
          'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_ADMIN_USER || 'admin'}:${process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin'}`),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data.configurations || []);
      } else {
        throw new Error('Failed to load configurations');
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load PR configurations',
      });
    }
  };

  const loadTeamsChats = async () => {
    setChatsLoading(true);
    setChatsError(null);
    
    try {
      const chatsResponse = await fetch('/api/teams/chats?limit=50');
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

  const handleNewConfig = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEditConfig = (config: PRConfiguration) => {
    setFormData({
      name: config.name,
      azure_devops_org_url: config.azure_devops_org_url,
      azure_devops_project: config.azure_devops_project || '',
      target_chat_id: config.target_chat_id,
      target_chat_name: config.target_chat_name || '',
      target_chat_type: config.target_chat_type || 'group',
      target_team_id: config.target_team_id || '',
      enable_mentions: config.enable_mentions,
      mention_users: config.mention_users,
      webhook_secret: config.webhook_secret || '',
      is_active: config.is_active,
    });
    setEditingId(config.id);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    
    try {
      const url = editingId ? `/api/pr-configurations/${editingId}` : '/api/pr-configurations';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_ADMIN_USER || 'admin'}:${process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin'}`),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Success!',
          description: `Configuration ${editingId ? 'updated' : 'created'} successfully`,
        });
        
        setShowForm(false);
        setFormData(emptyForm);
        setEditingId(null);
        await loadConfigurations();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error!',
          description: error.error || 'Failed to save configuration',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error!',
        description: 'Network error while saving configuration',
      });
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }
    
    setIsDeleting(id);
    
    try {
      const response = await fetch(`/api/pr-configurations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_ADMIN_USER || 'admin'}:${process.env.NEXT_PUBLIC_ADMIN_PASS || 'admin'}`),
        },
      });

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Success!',
          description: 'Configuration deleted successfully',
        });
        
        await loadConfigurations();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error!',
          description: error.error || 'Failed to delete configuration',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error!',
        description: 'Network error while deleting configuration',
      });
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCopyWebhookUrl = async (configId: string) => {
    const webhookUrl = `${window.location.origin}/api/webhooks/azure-devops/${configId}`;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({
        variant: 'success',
        title: 'Copied!',
        description: 'Webhook URL copied to clipboard',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error!',
        description: 'Failed to copy URL. Please try again.',
      });
    }
  };

  const addMentionUser = () => {
    setFormData(prev => ({
      ...prev,
      mention_users: [...prev.mention_users, ''],
    }));
  };

  const updateMentionUser = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      mention_users: prev.mention_users.map((user, i) => i === index ? value : user),
    }));
  };

  const removeMentionUser = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mention_users: prev.mention_users.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <PageLoadingTemplate 
        title="🔔 PR Configurations" 
        description="Loading configurations..."
        text="Loading configurations..."
      />
    );
  }

  return (
    <TooltipProvider>
      <PageTemplate 
        title="🔔 PR Configurations" 
        description="Manage multiple Azure DevOps organizations and Teams chat destinations"
        actions={
          <div className="flex items-center space-x-4">
            {!showForm && (
              <ButtonLoading
                isLoading={false}
                onClick={handleNewConfig}
                className="btn-primary"
                disabled={!authStatus.isAuthenticated}
              >
                ➕ Add Configuration
              </ButtonLoading>
            )}
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
                    Connect to Microsoft Teams to configure PR notifications
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
        {showForm && (
          <SectionCard title={`⚙️ ${editingId ? 'Edit' : 'New'} Configuration`}>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="My Team - Project X"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Friendly name to identify this configuration
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Azure DevOps Organization URL *
                  </label>
                  <input
                    type="url"
                    value={formData.azure_devops_org_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, azure_devops_org_url: e.target.value }))}
                    className="input-field"
                    placeholder="https://dev.azure.com/your-org"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    URL of your Azure DevOps organization
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Filter (Optional)
                </label>
                <input
                  type="text"
                  value={formData.azure_devops_project || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, azure_devops_project: e.target.value }))}
                  className="input-field"
                  placeholder="Leave empty for all projects"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Filter notifications to a specific project. Leave empty to receive notifications from all projects.
                </p>
              </div>

              {/* Teams Chat Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Chat or Channel *
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
                        🔄 Retry
                      </button>
                    </div>
                  ) : teamsChats.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={formData.target_chat_id}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedChat = teamsChats.find(chat => chat.id === selectedId);
                          setFormData(prev => ({
                            ...prev,
                            target_chat_id: selectedId,
                            target_chat_name: selectedChat?.displayName || '',
                            target_chat_type: selectedChat?.type || 'group',
                            target_team_id: selectedChat?.teamId || '',
                          }));
                        }}
                        className="input-field"
                        required
                      >
                        <option value="">-- Select a chat or channel --</option>
                        {teamsChats.map((chat) => (
                          <option key={chat.id} value={chat.id}>
                            {chat.displayName}
                          </option>
                        ))}
                      </select>
                      {formData.target_chat_id && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          <p className="text-blue-800">
                            Selected: <span className="font-semibold">{formData.target_chat_name}</span>
                          </p>
                          <p className="text-blue-700 text-xs">
                            Type: <span className="font-medium">{formData.target_chat_type}</span>
                          </p>
                        </div>
                      )}
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
                    checked={formData.enable_mentions}
                    onChange={(e) => setFormData(prev => ({ ...prev, enable_mentions: e.target.checked }))}
                    className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
                  />
                </div>
                
                {formData.enable_mentions && (
                  <div className="space-y-2">
                    {formData.mention_users.map((user, index) => (
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
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
                />
                <label className="text-sm font-medium text-gray-700">
                  Active Configuration
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={handleCancelForm}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <ButtonLoading
                  isLoading={isSaving}
                  onClick={handleSaveConfig}
                  className="btn-primary"
                  disabled={!formData.name || !formData.azure_devops_org_url || !formData.target_chat_id}
                >
                  {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                </ButtonLoading>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Configurations List */}
        {!showForm && (
          <SectionCard title={`📋 PR Configurations (${configurations.length})`}>
            {configurations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-card-title mb-2">No configurations yet</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Create your first PR notification configuration to get started
                </p>
                {authStatus.isAuthenticated ? (
                  <button
                    onClick={handleNewConfig}
                    className="btn-primary"
                  >
                    ➕ Create First Configuration
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Connect to Teams first to create configurations
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {configurations.map((config) => (
                  <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-card-title">{config.name}</h3>
                          <StatusBadge type={config.is_active ? "success" : "warning"}>
                            {config.is_active ? "Active" : "Inactive"}
                          </StatusBadge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Organization:</strong> {config.azure_devops_org_url}</p>
                            {config.azure_devops_project && (
                              <p><strong>Project:</strong> {config.azure_devops_project}</p>
                            )}
                          </div>
                          <div>
                            <p><strong>Target Chat:</strong> {config.target_chat_name || config.target_chat_id}</p>
                            <p><strong>Mentions:</strong> {config.enable_mentions ? `${config.mention_users.length} users` : "Disabled"}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-500">
                          Created: {new Date(config.created_at).toLocaleDateString()} • 
                          Updated: {new Date(config.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCopyWebhookUrl(config.id)}
                              className="btn-secondary text-xs"
                            >
                              📋 Copy Webhook
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy webhook URL for Azure DevOps</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <button
                          onClick={() => handleEditConfig(config)}
                          className="btn-secondary text-xs"
                        >
                          ✏️ Edit
                        </button>
                        
                        <ButtonLoading
                          isLoading={isDeleting === config.id}
                          onClick={() => handleDeleteConfig(config.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                        >
                          {isDeleting === config.id ? '...' : '🗑️'}
                        </ButtonLoading>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* Setup Instructions */}
        {configurations.length > 0 && !showForm && (
          <SectionCard title="📖 Setup Instructions">
            <div className="prose max-w-none">
              <h4 className="text-sm font-medium text-gray-700 mb-3">For each configuration:</h4>
              <ol className="text-sm text-gray-600 space-y-2">
                <li><strong>1.</strong> Copy the webhook URL using the "📋 Copy Webhook" button</li>
                <li><strong>2.</strong> Go to Azure DevOps → Project Settings → Service Hooks</li>
                <li><strong>3.</strong> Create subscription: "Pull request created"</li>
                <li><strong>4.</strong> Paste the webhook URL and test the connection</li>
                <li><strong>5.</strong> Create a test pull request to verify notifications</li>
              </ol>
            </div>
          </SectionCard>
        )}
      </PageTemplate>
    </TooltipProvider>
  );
}