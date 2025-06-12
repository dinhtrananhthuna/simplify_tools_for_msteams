'use client';

import { useState, useEffect } from 'react';

interface WebhookLog {
  id: string;
  tool_id: string;
  webhook_source: string;
  event_type: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
  payload?: any;
  teams_message_id?: string;
  created_at: string;
}

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');

  useEffect(() => {
    loadWebhookLogs();
  }, []);

  const loadWebhookLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load webhook logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredLogs = logs.filter(log => filter === 'all' || log.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading webhook logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📡 Webhook Management</h1>
        <p className="text-gray-600">
          Monitor và quản lý webhook events từ external services
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-field w-32"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <button
            onClick={loadWebhookLogs}
            className="btn-secondary"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Webhook URL Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">📡 Webhook Endpoints</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Azure DevOps Webhook URL
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
                📋 Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">📋 Recent Webhook Events</h2>
        
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No webhook events found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {log.webhook_source === 'azure-devops' ? '🔷' : '📡'}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {log.event_type} from {log.webhook_source}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Tool: {log.tool_id} • {new Date(log.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    {log.teams_message_id && (
                      <span className="text-green-500" title="Teams message sent">
                        💬
                      </span>
                    )}
                  </div>
                </div>
                
                {log.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    <strong>Error:</strong> {log.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 