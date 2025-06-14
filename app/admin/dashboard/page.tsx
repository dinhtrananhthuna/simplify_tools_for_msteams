'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PageTemplate,
  StatsGrid,
  StatCard,
  SectionCard,
  CompactList,
  CompactListItem,
  StatusBadge,
  TeamsBadge,
  LoadingSpinner,
  EmptyState,
  SectionLoading,
  PageLoadingTemplate
} from "@/components/templates/page-template";
import { useDataLoading } from '@/hooks/use-page-loading';

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
  status: 'success' | 'failed';
  error_message?: string;
  teams_message_id?: string;
  created_at: string;
  repository?: string;
  processing_time_ms?: number;
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const { isLoading, error, withLoading } = useDataLoading();

  const loadDashboardData = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to load dashboard data');
      }
      
      setIsInitialLoad(false);
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getWebhookIcon = (eventType: string) => {
    if (eventType.includes('pull_request') || eventType.includes('pullrequest')) {
      return '🔀';
    }
    if (eventType.includes('push')) {
      return '📤';
    }
    if (eventType.includes('build')) {
      return '🔨';
    }
    return '📡';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateSuccessRate = (successful: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
  };

  // Only show loading for data refresh, not initial load
  if (isLoading && !isInitialLoad) {
    return (
      <PageLoadingTemplate 
        title="📊 Dashboard" 
        description="Đang tải lại dữ liệu..."
        text="Refreshing dashboard data..."
      />
    );
  }

  if (error) {
    return (
      <PageTemplate title="📊 Dashboard" description="Overview of your MS Teams Tools Suite">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </PageTemplate>
    );
  }

  // Show empty state while initial loading
  if (isInitialLoad || !stats) {
    return (
      <PageTemplate title="📊 Dashboard" description="Overview of your MS Teams Tools Suite">
        <div className="animate-pulse">
          <StatsGrid>
            {[1,2,3,4].map(i => (
              <div key={i} className="card-standard">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </StatsGrid>
        </div>
      </PageTemplate>
    );
  }

  const successRate = calculateSuccessRate(stats.successfulWebhooks, stats.totalWebhooks);

  return (
    <TooltipProvider>
      <PageTemplate 
        title="📊 Dashboard" 
        description="Overview of your MS Teams Tools Suite"
        actions={
          <button
            onClick={loadDashboardData}
            className="text-link text-sm"
            disabled={isLoading}
          >
            🔄 Refresh Data
          </button>
        }
      >
        {/* Stats Grid */}
        <StatsGrid>
          <StatCard
            label="Total Tools"
            value={stats.totalTools}
            icon="🔧"
          />
          <StatCard
            label="Active Tools"
            value={stats.activeTools}
            icon="✅"
            color="success"
          />
          <StatCard
            label="Total Webhooks"
            value={stats.totalWebhooks}
            icon="📡"
          />
          <StatCard
            label="Success Rate"
            value={`${successRate}%`}
            icon="📊"
            color={successRate > 80 ? 'success' : successRate > 50 ? 'warning' : 'error'}
          />
        </StatsGrid>

        {/* Tools Overview - Full Width */}
        <SectionCard 
          title="🔧 Tools Overview"
          actions={
            <Link href="/admin/tools" className="text-link text-sm">
              View All →
            </Link>
          }
        >
          {stats.tools.length === 0 ? (
            <EmptyState
              icon="🔧"
              title="No tools configured"
              description="Get started by configuring your first tool."
              action={
                <Link href="/admin/tools" className="btn-primary">
                  Configure Tools
                </Link>
              }
            />
          ) : (
            <CompactList>
              {stats.tools.map((tool) => (
                <CompactListItem
                  key={tool.id}
                  icon={tool.icon}
                  title={tool.name}
                  subtitle={tool.description}
                  meta={`Category: ${tool.category} • Created: ${formatDate(tool.created_at)}`}
                  status={
                    <StatusBadge type={tool.is_active ? 'success' : 'warning'}>
                      {tool.is_active ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  }
                />
              ))}
            </CompactList>
          )}
        </SectionCard>

        {/* Recent Webhooks - Full Width */}
        <SectionCard 
          title="📡 Recent Webhooks"
          actions={
            <Link href="/admin/webhooks" className="text-link text-sm">
              View All →
            </Link>
          }
        >
          {stats.recentWebhooks.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No recent webhooks"
              description="Webhook events will appear here once received."
            />
          ) : (
            <CompactList>
              {stats.recentWebhooks.map((webhook) => (
                <CompactListItem
                  key={webhook.id}
                  icon={getWebhookIcon(webhook.event_type)}
                  title={webhook.event_type}
                  subtitle={webhook.webhook_source}
                  meta={`Tool: ${webhook.tool_id} • ${formatDate(webhook.created_at)}`}
                  status={
                    <div className="flex items-center space-x-2">
                      <StatusBadge type={webhook.status === 'success' ? 'success' : 'failed'}>
                        {webhook.status}
                      </StatusBadge>
                      {webhook.teams_message_id && (
                        <TeamsBadge messageId={webhook.teams_message_id} />
                      )}
                    </div>
                  }
                  error={webhook.error_message}
                />
              ))}
            </CompactList>
          )}
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="⚡ Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/auth"
              className="card-compact text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="text-card-title mb-1">Teams Auth</h3>
              <p className="text-xs text-gray-500">Configure Microsoft Teams authentication</p>
            </Link>
            
            <Link
              href="/admin/tools/pr-notifier"
              className="card-compact text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">📢</div>
              <h3 className="text-card-title mb-1">PR Notifier</h3>
              <p className="text-xs text-gray-500">Set up pull request notifications</p>
            </Link>
            
            <Link
              href="/admin/test-api"
              className="card-compact text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">🧪</div>
              <h3 className="text-card-title mb-1">Test API</h3>
              <p className="text-xs text-gray-500">Test your Teams integration</p>
            </Link>
          </div>
        </SectionCard>
      </PageTemplate>
    </TooltipProvider>
  );
} 