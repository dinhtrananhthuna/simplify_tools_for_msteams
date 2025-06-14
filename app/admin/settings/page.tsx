'use client';

import { useState, useEffect } from 'react';
import {
  PageTemplate,
  SectionCard,
  StatusBadge,
  LoadingSpinner,
  PageLoadingTemplate
} from "@/components/templates/page-template";

interface Settings {
  webhookSecret: string;
  defaultNotificationSettings: {
    enableMentions: boolean;
    enableEmojis: boolean;
    messageFormat: 'simple' | 'detailed';
  };
  systemSettings: {
    logLevel: 'error' | 'warning' | 'info' | 'debug';
    maxLogRetention: number;
    enableMetrics: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    webhookSecret: '',
    defaultNotificationSettings: {
      enableMentions: true,
      enableEmojis: false,
      messageFormat: 'simple'
    },
    systemSettings: {
      logLevel: 'info',
      maxLogRetention: 30,
      enableMetrics: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Simulate loading settings from API
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateNewWebhookSecret = () => {
    const newSecret = Array.from({length: 32}, () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    setSettings(prev => ({ ...prev, webhookSecret: newSecret }));
  };

  // Only show loading for save/refresh actions, not initial load
  if (isLoading && !isInitialLoad) {
    return (
      <PageLoadingTemplate 
        title="⚙️ Settings" 
        description="Đang lưu cấu hình..."
        text="Saving settings..."
      />
    );
  }

  return (
    <PageTemplate 
      title="⚙️ Settings" 
      description="Cấu hình hệ thống và tùy chỉnh"
      actions={
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </div>
          ) : (
            '💾 Save Settings'
          )}
        </button>
      }
    >
      {/* Webhook Configuration */}
      <SectionCard title="🔗 Webhook Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret Key
            </label>
            <input
              type="password"
              value={settings.webhookSecret}
              onChange={(e) => setSettings({
                ...settings,
                webhookSecret: e.target.value
              })}
              placeholder="Enter webhook secret key..."
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used to verify webhook authenticity from Azure DevOps
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Webhook Security</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Secret key is used to validate incoming webhooks</li>
              <li>• Configure the same secret in Azure DevOps Service Hooks</li>
              <li>• Leave empty to disable signature verification (not recommended)</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Notification Settings */}
      <SectionCard title="📢 Default Notification Settings">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Message Format</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="messageFormat"
                    value="simple"
                    checked={settings.defaultNotificationSettings.messageFormat === 'simple'}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultNotificationSettings: {
                        ...settings.defaultNotificationSettings,
                        messageFormat: e.target.value as 'simple' | 'detailed'
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Simple - Basic information only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="messageFormat"
                    value="detailed"
                    checked={settings.defaultNotificationSettings.messageFormat === 'detailed'}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultNotificationSettings: {
                        ...settings.defaultNotificationSettings,
                        messageFormat: e.target.value as 'simple' | 'detailed'
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Detailed - Full information with metadata</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Message Options</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.defaultNotificationSettings.enableMentions}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultNotificationSettings: {
                        ...settings.defaultNotificationSettings,
                        enableMentions: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Enable @mentions in messages</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.defaultNotificationSettings.enableEmojis}
                    onChange={(e) => setSettings({
                      ...settings,
                      defaultNotificationSettings: {
                        ...settings.defaultNotificationSettings,
                        enableEmojis: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Include emojis in messages</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">📝 Preview</h4>
            <div className="text-sm text-gray-600">
              <p><strong>Format:</strong> {settings.defaultNotificationSettings.messageFormat}</p>
              <p><strong>Mentions:</strong> {settings.defaultNotificationSettings.enableMentions ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Emojis:</strong> {settings.defaultNotificationSettings.enableEmojis ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* System Settings */}
      <SectionCard title="🔧 System Settings">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Level
              </label>
              <select
                value={settings.systemSettings.logLevel}
                onChange={(e) => setSettings({
                  ...settings,
                  systemSettings: {
                    ...settings.systemSettings,
                    logLevel: e.target.value as 'error' | 'warning' | 'info' | 'debug'
                  }
                })}
                className="input-field"
              >
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Retention (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.systemSettings.maxLogRetention}
                onChange={(e) => setSettings({
                  ...settings,
                  systemSettings: {
                    ...settings.systemSettings,
                    maxLogRetention: parseInt(e.target.value) || 30
                  }
                })}
                className="input-field"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.systemSettings.enableMetrics}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemSettings: {
                      ...settings.systemSettings,
                      enableMetrics: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable Metrics Collection</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ System Settings Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Higher log levels will generate more data</li>
              <li>• Longer retention periods require more storage</li>
              <li>• Metrics help improve system performance</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Statistics */}
      <SectionCard title="📊 System Statistics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium text-gray-700">Total API Calls:</span>
            <span className="text-gray-600">-</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium text-gray-700">Webhooks Received:</span>
            <span className="text-gray-600">-</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium text-gray-700">Messages Sent:</span>
            <span className="text-gray-600">-</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium text-gray-700">Uptime:</span>
            <span className="text-gray-600">-</span>
          </div>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard title="⚠️ Danger Zone">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">🚨 Reset Settings</h4>
            <p className="text-sm text-red-700 mb-3">
              This will reset all settings to their default values. This action cannot be undone.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
                  setSettings({
                    webhookSecret: '',
                    defaultNotificationSettings: {
                      enableMentions: true,
                      enableEmojis: false,
                      messageFormat: 'simple'
                    },
                    systemSettings: {
                      logLevel: 'info',
                      maxLogRetention: 30,
                      enableMetrics: true
                    }
                  });
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </SectionCard>
    </PageTemplate>
  );
} 