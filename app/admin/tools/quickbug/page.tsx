'use client';

import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  PageTemplate,
  SectionCard,
  StatusBadge,
  LoadingSpinner,
  PageLoadingTemplate
} from "@/components/templates/page-template";

interface QuickbugTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  is_active: boolean;
  config: {
    defaultEnvironment?: string;
    severityLevels?: string[];
  };
  created_at: string;
  updated_at: string;
}

interface WebhookStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export default function QuickbugPage() {
  const { toast } = useToast();
  const [tool, setTool] = useState<QuickbugTool | null>(null);
  const [stats, setStats] = useState<WebhookStats>({ total: 0, success: 0, failed: 0, successRate: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadToolData();
    loadWebhookStats();
  }, []);

  const loadToolData = async () => {
    try {
      const response = await fetch('/api/tools/quickbug');
      if (response.ok) {
        const data = await response.json();
        setTool(data.tool);
      }
    } catch (error) {
      console.error('Failed to load tool data:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thông tin tool. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadWebhookStats = async () => {
    try {
      const response = await fetch('/api/webhooks/stats?tool_id=quickbug');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load webhook stats:', error);
    }
  };

  const toggleToolStatus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tool) return;
    
    const newStatus = e.target.checked;
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/tools/quickbug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: tool.config,
          is_active: newStatus,
        }),
      });

      if (response.ok) {
        setTool(prev => prev ? { ...prev, is_active: newStatus } : null);
        toast({
          variant: "success",
          description: `Tool đã được ${newStatus ? 'kích hoạt' : 'tắt'} thành công! 🎉`,
        });
      } else {
        throw new Error('Failed to update tool status');
      }
    } catch (error) {
      // Revert checkbox state on error
      setTool(prev => prev ? { ...prev, is_active: !newStatus } : null);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái tool. Vui lòng thử lại.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const copyWebhookUrl = async () => {
    try {
      const url = `${window.location.origin}/api/webhooks/teams-bot`;
      await navigator.clipboard.writeText(url);
      toast({
        variant: "success",
        description: "Đã copy webhook URL thành công! 📋",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể copy URL. Vui lòng thử lại.",
      });
    }
  };

  if (isLoading) {
    return (
      <PageLoadingTemplate 
        title="🐞 Quick Bug Reporter" 
        description="Đang tải thông tin tool..."
        text="Loading tool configuration..."
      />
    );
  }

  if (!tool) {
    return (
      <PageTemplate 
        title="🐞 Quick Bug Reporter" 
        description="Teams Message Extension for quick bug reporting"
      >
        <SectionCard title="❌ Tool Not Found">
          <p className="text-red-600">
            Quick Bug Reporter tool không tìm thấy trong database. 
            Vui lòng chạy migration script để thêm tool.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <code className="text-sm">npm run script:add-quickbug-tool</code>
          </div>
        </SectionCard>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate 
      title="🐞 Quick Bug Reporter" 
      description="Teams Message Extension for quick bug reporting với Adaptive Cards"
      actions={
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Active:</label>
            <input
              type="checkbox"
              checked={tool.is_active}
              onChange={toggleToolStatus}
              disabled={isUpdating}
              className="w-4 h-4 text-teams-purple border-gray-300 rounded focus:ring-teams-purple"
            />
          </div>
          {isUpdating && <LoadingSpinner size="sm" />}
        </div>
      }
    >
      {/* Tool Status */}
      <SectionCard title="📊 Tool Status">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600">📊</span>
              <h4 className="font-medium text-blue-900">Total Requests</h4>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">✅</span>
              <h4 className="font-medium text-green-900">Successful</h4>
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.success}</p>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-600">❌</span>
              <h4 className="font-medium text-red-900">Failed</h4>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Success Rate</h4>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.successRate}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {stats.successRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Tool Configuration */}
      <SectionCard title="⚙️ Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
            <p className="text-sm text-gray-600">{tool.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-sm text-gray-600">{tool.description}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
              {tool.category}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Environment</label>
            <p className="text-sm text-gray-600">{tool.config.defaultEnvironment || 'Production'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity Levels</label>
            <div className="flex flex-wrap gap-2">
              {(tool.config.severityLevels || ['Critical', 'High', 'Medium', 'Low']).map((level) => (
                <span 
                  key={level}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {level}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Bot Framework Setup */}
      <SectionCard title="🤖 Bot Framework Setup">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Endpoint</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/teams-bot`}
              </code>
              <button
                onClick={copyWebhookUrl}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sử dụng URL này làm Messaging endpoint trong Azure Bot registration
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">📝 Setup Requirements</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Azure Bot registration với App ID và App Password</li>
              <li>• Environment variables: MICROSOFT_APP_ID, MICROSOFT_APP_PASSWORD</li>
              <li>• Teams App manifest với composeExtensions configuration</li>
              <li>• Sideload Teams app vào org của bạn</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📚 Documentation</h4>
            <p className="text-sm text-blue-700">
              Xem chi tiết setup trong <code className="bg-blue-100 px-1 rounded">docs/teams-bot-setup.md</code>
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Recent Activity */}
      <SectionCard 
        title="📋 Recent Activity"
        actions={
          <a 
            href="/admin/webhooks?tool_id=quickbug"
            className="text-sm text-teams-purple hover:text-teams-purple-dark"
          >
            View All Logs →
          </a>
        }
      >
        <p className="text-sm text-gray-600">
          Xem tất cả webhook logs và activity details trong trang Webhooks.
        </p>
      </SectionCard>
    </PageTemplate>
  );
} 