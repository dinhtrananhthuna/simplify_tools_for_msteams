'use client';

import { useState, useEffect } from 'react';

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
      enableEmojis: true,
      messageFormat: 'detailed'
    },
    systemSettings: {
      logLevel: 'info',
      maxLogRetention: 30,
      enableMetrics: true
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ System Settings</h1>
            <p className="text-gray-600">
              Configure system behavior và default values
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? '💾 Saving...' : '💾 Save Settings'}
          </button>
        </div>
        
        {saveMessage && (
          <div className={`mt-4 p-3 rounded-lg ${
            saveMessage.includes('success') 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {saveMessage}
          </div>
        )}
      </div>

      {/* Webhook Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          🔐 Webhook Security
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                value={settings.webhookSecret}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                className="input-field flex-1"
                placeholder="Enter webhook secret"
              />
              <button
                onClick={generateNewWebhookSecret}
                className="btn-secondary"
              >
                🎲 Generate
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Secret được dùng để validate webhook requests từ Azure DevOps
            </p>
          </div>
        </div>
      </div>

      {/* Notification Defaults */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          📱 Default Notification Settings
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable @Mentions</h3>
              <p className="text-sm text-gray-500">Automatically mention users in notifications</p>
            </div>
            <input
              type="checkbox"
              checked={settings.defaultNotificationSettings.enableMentions}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                defaultNotificationSettings: {
                  ...prev.defaultNotificationSettings,
                  enableMentions: e.target.checked
                }
              }))}
              className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Emojis</h3>
              <p className="text-sm text-gray-500">Include emojis in notification messages</p>
            </div>
            <input
              type="checkbox"
              checked={settings.defaultNotificationSettings.enableEmojis}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                defaultNotificationSettings: {
                  ...prev.defaultNotificationSettings,
                  enableEmojis: e.target.checked
                }
              }))}
              className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Format
            </label>
            <select
              value={settings.defaultNotificationSettings.messageFormat}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                defaultNotificationSettings: {
                  ...prev.defaultNotificationSettings,
                  messageFormat: e.target.value as 'simple' | 'detailed'
                }
              }))}
              className="input-field w-full"
            >
              <option value="simple">Simple</option>
              <option value="detailed">Detailed</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Default format cho notification messages
            </p>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          🖥️ System Configuration
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Level
            </label>
            <select
              value={settings.systemSettings.logLevel}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                systemSettings: {
                  ...prev.systemSettings,
                  logLevel: e.target.value as any
                }
              }))}
              className="input-field w-full"
            >
              <option value="error">Error only</option>
              <option value="warning">Warning & Error</option>
              <option value="info">Info, Warning & Error</option>
              <option value="debug">All (Debug mode)</option>
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
              onChange={(e) => setSettings(prev => ({
                ...prev,
                systemSettings: {
                  ...prev.systemSettings,
                  maxLogRetention: parseInt(e.target.value)
                }
              }))}
              className="input-field w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of days to keep logs before automatic cleanup
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Metrics Collection</h3>
              <p className="text-sm text-gray-500">Collect usage metrics và performance data</p>
            </div>
            <input
              type="checkbox"
              checked={settings.systemSettings.enableMetrics}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                systemSettings: {
                  ...prev.systemSettings,
                  enableMetrics: e.target.checked
                }
              }))}
              className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
            />
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          📊 Environment Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Application</h3>
            <p className="text-sm text-gray-600">Version: 1.0.0</p>
            <p className="text-sm text-gray-600">Environment: Development</p>
            <p className="text-sm text-gray-600">Node.js: 18.x</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Database</h3>
            <p className="text-sm text-gray-600">Type: PostgreSQL</p>
            <p className="text-sm text-gray-600">Provider: Neon</p>
            <p className="text-sm text-gray-600">Status: Connected</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Deployment</h3>
            <p className="text-sm text-gray-600">Platform: Vercel</p>
            <p className="text-sm text-gray-600">Region: Auto</p>
            <p className="text-sm text-gray-600">Runtime: Edge</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Security</h3>
            <p className="text-sm text-gray-600">HTTPS: Enabled</p>
            <p className="text-sm text-gray-600">Auth: Basic + OAuth</p>
            <p className="text-sm text-gray-600">Encryption: AES-256</p>
          </div>
        </div>
      </div>
    </div>
  );
} 