'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface WebhookLog {
  id: string;
  tool_id: string;
  webhook_source: string;
  event_type: string;
  status: 'success' | 'failed';
  error_message?: string;
  payload?: any;
  teams_message_id?: string;
  created_at: string;
}

interface WebhookStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export default function WebhooksPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [stats, setStats] = useState<WebhookStats>({
    total: 0,
    success: 0,
    failed: 0,
    successRate: 0
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'created_at' | 'status' | 'event_type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    loadWebhookLogs(true);
    loadWebhookStats();
  }, []);

  // Load data when filters change (not initial load)
  useEffect(() => {
    if (!isLoading) {
      loadWebhookLogs(false);
    }
  }, [currentPage, pageSize, filter, debouncedSearchTerm, sortBy, sortOrder]);

  const loadWebhookLogs = async (isInitial: boolean = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingEvents(true);
    }
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        status: filter,
        search: debouncedSearchTerm,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/webhooks/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalCount(data.pagination?.total || 0);
      }
      
      if (isInitial) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Failed to load webhook logs:', error);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsLoadingEvents(false);
      }
    }
  };

  const loadWebhookStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/webhooks/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load webhook stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCopyWebhookUrl = async () => {
    try {
      const url = `${window.location.origin}/api/webhooks/azure-devops`;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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

  // Reset page when filters change (but not for page change itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, debouncedSearchTerm, sortBy, sortOrder, pageSize]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Only show loading for refresh, not initial load
  if (isLoading && !isInitialLoad) {
    return (
      <PageLoadingTemplate 
        title="📡 Webhooks" 
        description="Đang tải lại webhook logs..."
        text="Refreshing webhook data..."
      />
    );
  }

  return (
    <TooltipProvider>
      <PageTemplate 
        title="📡 Webhooks" 
        description="Quản lý và theo dõi các webhook endpoints"
        actions={
          <Button onClick={handleCopyWebhookUrl} variant="outline" size="sm">
            📋 Copy Webhook URL
          </Button>
        }
      >
        {/* Stats Grid */}
        <StatsGrid>
          <StatCard
            label="Total Webhooks"
            value={stats.total}
            icon="📡"
          />
          <StatCard
            label="Successful"
            value={stats.success}
            icon="✅"
            color="success"
          />
          <StatCard
            label="Failed"
            value={stats.failed}
            icon="❌"
            color="error"
          />
          <StatCard
            label="Success Rate"
            value={`${Math.round(stats.successRate)}%`}
            icon="📊"
            color={stats.successRate > 80 ? 'success' : stats.successRate > 50 ? 'warning' : 'error'}
          />
        </StatsGrid>

        {/* Webhook Configuration */}
        <SectionCard title="🔗 Webhook Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure DevOps PR Webhook URL
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/azure-devops`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopyWebhookUrl} variant="outline" size="sm">
                  📋 Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sử dụng URL này trong Azure DevOps Service Hooks
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Filters and Search */}
        <SectionCard title="🔍 Filters & Search">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'success' | 'failed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teams-purple focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teams-purple focus:border-transparent"
              >
                <option value="created_at">Date</option>
                <option value="status">Status</option>
                <option value="event_type">Event Type</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teams-purple focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Webhook Events */}
        <SectionCard 
          title={`📋 Webhook Events (${totalCount} total)`}
          actions={
            <div className="flex items-center space-x-2">
              {isLoadingEvents && <LoadingSpinner size="sm" />}
              <Button onClick={() => loadWebhookLogs(false)} variant="outline" size="sm">
                🔄 Refresh
              </Button>
            </div>
          }
        >
          {logs.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No webhook events found"
              description={filter === 'all' ? "No webhook events have been received yet." : `No ${filter} webhook events found.`}
              action={
                filter !== 'all' ? (
                  <Button onClick={() => setFilter('all')} variant="outline">
                    Show All Events
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <CompactList>
                {logs.map((log) => (
                  <CompactListItem
                    key={log.id}
                    icon={getWebhookIcon(log.event_type)}
                    title={log.event_type}
                    subtitle={log.webhook_source}
                    meta={`Tool: ${log.tool_id} • ${formatDate(log.created_at)}`}
                    status={
                      <div className="flex items-center space-x-2">
                        <StatusBadge type={log.status === 'success' ? 'success' : 'failed'}>
                          {log.status}
                        </StatusBadge>
                        {log.teams_message_id && (
                          <TeamsBadge messageId={log.teams_message_id} />
                        )}
                      </div>
                    }
                    error={log.error_message}
                  >
                    {log.payload && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View Payload
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CompactListItem>
                ))}
              </CompactList>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      ← Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>
      </PageTemplate>
    </TooltipProvider>
  );
} 