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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📡 Webhooks</h1>
        <p className="text-gray-600 mt-2">
          Quản lý và theo dõi các webhook endpoints
        </p>
      </div>

      {/* Webhook URLs */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 Webhook URLs</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Azure DevOps PR Webhook
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${window.location.origin}/api/webhooks/azure-devops`}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/azure-devops`)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Sử dụng URL này trong Azure DevOps webhook configuration
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Status */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Webhook Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-2xl mb-2 block">✅</span>
            <h3 className="font-medium text-gray-900">Endpoint Ready</h3>
            <p className="text-sm text-gray-600 mt-1">Sẵn sàng nhận webhook</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-2xl mb-2 block">📊</span>
            <h3 className="font-medium text-gray-900">Total Received</h3>
            <p className="text-sm text-gray-600 mt-1">0 webhooks</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-2xl mb-2 block">🚀</span>
            <h3 className="font-medium text-gray-900">Success Rate</h3>
            <p className="text-sm text-gray-600 mt-1">100%</p>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">📋 Setup Instructions</h2>
        <div className="space-y-4 text-blue-800">
          <div>
            <h3 className="font-medium mb-2">1. Trong Azure DevOps:</h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Vào Project Settings → Service Hooks</li>
              <li>• Chọn "Create subscription"</li>
              <li>• Chọn "Web Hooks" làm service</li>
              <li>• Chọn "Pull request created" event</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">2. Cấu hình Webhook:</h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• URL: Copy từ field phía trên</li>
              <li>• HTTP Method: POST</li>
              <li>• Content Type: application/json</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">3. Kiểm tra:</h3>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Tạo test PR để kiểm tra webhook</li>
              <li>• Theo dõi logs trong Test API page</li>
            </ul>
          </div>
        </div>
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