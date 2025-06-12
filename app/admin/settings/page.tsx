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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Settings</h1>
        <p className="text-gray-600 mt-2">
          Cấu hình hệ thống và các tùy chọn chung
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 System Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <input
              type="text"
              value="Development"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Status
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                ❌ Disabled (Development Mode)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Total API Calls:</span>
            <span className="text-gray-600">-</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Webhooks Received:</span>
            <span className="text-gray-600">-</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Messages Sent:</span>
            <span className="text-gray-600">-</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Uptime:</span>
            <span className="text-gray-600">-</span>
          </div>
        </div>
      </div>
    </div>
  );
} 