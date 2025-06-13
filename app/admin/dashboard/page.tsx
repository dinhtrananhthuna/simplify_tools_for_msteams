'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  is_active: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  tool_id: string;
  webhook_source: string;
  event_type: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
  created_at: string;
}

interface DashboardStats {
  totalTools: number;
  activeTools: number;
  totalWebhooks: number;
  successfulWebhooks: number;
  failedWebhooks: number;
  recentWebhooks: WebhookLog[];
  tools: Tool[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
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

  const getToolStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'text-green-600 bg-green-100' 
      : 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Error loading dashboard</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="btn-primary"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard</h1>
        <p className="text-gray-600">
          Overview của MS Teams Tools Suite và activity logs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tools</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTools}</p>
            </div>
            <div className="text-3xl">🛠️</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Tools</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeTools}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Webhooks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWebhooks}</p>
            </div>
            <div className="text-3xl">📡</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-teams-purple">
                {stats.totalWebhooks > 0 
                  ? Math.round((stats.successfulWebhooks / stats.totalWebhooks) * 100)
                  : 0}%
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      {/* Tools Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">🛠️ Tools Overview</h2>
          <Link
            href="/admin/tools"
            className="text-teams-purple hover:text-teams-purple-dark text-sm"
          >
            View all →
          </Link>
        </div>

        {stats.tools.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No tools configured yet</p>
            <Link
              href="/admin/tools"
              className="btn-primary"
            >
              🚀 Set up your first tool
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.tools.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{tool.name}</h3>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getToolStatusColor(tool.is_active)}`}>
                    {tool.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Link
                    href={`/admin/tools/${tool.id}`}
                    className="text-teams-purple hover:text-teams-purple-dark text-sm"
                  >
                    Configure →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">📋 Recent Activity</h2>
          <Link
            href="/admin/webhooks"
            className="text-teams-purple hover:text-teams-purple-dark text-sm"
          >
            View all →
          </Link>
        </div>

        {stats.recentWebhooks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentWebhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {webhook.webhook_source === 'azure-devops' ? '🔷' : '📡'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {webhook.event_type} from {webhook.webhook_source}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(webhook.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(webhook.status)}`}>
                    {webhook.status}
                  </span>
                  {webhook.error_message && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-red-500 cursor-help">
                          ⚠️
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{webhook.error_message}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/tools/pr-notifier"
            className="p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🔔</div>
              <h3 className="font-medium text-gray-900">Set up PR Notifier</h3>
              <p className="text-sm text-gray-600">Configure Azure DevOps integration</p>
            </div>
          </Link>

          <Link
            href="/admin/auth"
            className="p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="font-medium text-gray-900">Connect Teams</h3>
              <p className="text-sm text-gray-600">Authenticate with Microsoft Teams</p>
            </div>
          </Link>

          <Link
            href="/admin/logs"
            className="p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900">View Logs</h3>
              <p className="text-sm text-gray-600">Monitor webhook activity</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
} 