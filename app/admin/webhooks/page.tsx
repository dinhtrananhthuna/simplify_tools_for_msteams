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

interface WebhookStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
  successRate: number;
}

export default function WebhooksPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [stats, setStats] = useState<WebhookStats>({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    successRate: 0
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
    <TooltipProvider>
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
                onClick={handleCopyWebhookUrl}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">📊 Webhook Status</h2>
          <div className="flex items-center">
            {isLoadingStats && (
              <div className="flex items-center mr-3">
                <div className="w-4 h-4 border-2 border-teams-purple border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
            <button
              onClick={loadWebhookStats}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={isLoadingStats}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div className="relative">
          {isLoadingStats && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 border-2 border-teams-purple border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600">Loading stats...</span>
              </div>
            </div>
          )}
          
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${isLoadingStats ? 'opacity-50' : ''} transition-opacity`}>
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-2xl mb-2 block">✅</span>
              <h3 className="font-medium text-gray-900">Endpoint Ready</h3>
              <p className="text-sm text-gray-600 mt-1">Sẵn sàng nhận webhook</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-2xl mb-2 block">📊</span>
              <h3 className="font-medium text-gray-900">Total Received</h3>
              <p className="text-sm text-gray-600 mt-1">{stats.total.toLocaleString()} webhooks</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-2xl mb-2 block">🚀</span>
              <h3 className="font-medium text-gray-900">Success Rate</h3>
              <p className="text-sm text-gray-600 mt-1">{stats.successRate.toFixed(1)}%</p>
            </div>

            <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-2xl mb-2 block">📈</span>
              <h3 className="font-medium text-gray-900">Success / Failed</h3>
              <p className="text-sm text-gray-600 mt-1">{stats.success} / {stats.failed}</p>
            </div>
          </div>
        </div>
      </div>



      {/* Webhook Logs with Search and Pagination */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">📋 Webhook Events</h2>
          <div className="text-sm text-gray-500">
            {isLoadingEvents ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-teams-purple border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            ) : (
              `${totalCount} ${totalCount === 1 ? 'event' : 'events'} total`
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-field w-32"
              disabled={isLoadingEvents}
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={() => loadWebhookLogs(false)}
            className="btn-secondary"
            disabled={isLoadingEvents}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search events, sources, tools, or errors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 whitespace-nowrap">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="input-field w-20"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-700">Sort by:</span>
          <Button
            variant={sortBy === 'created_at' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('created_at')}
          >
            Date {sortBy === 'created_at' && (sortOrder === 'desc' ? '↓' : '↑')}
          </Button>
          <Button
            variant={sortBy === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('status')}
          >
            Status {sortBy === 'status' && (sortOrder === 'desc' ? '↓' : '↑')}
          </Button>
          <Button
            variant={sortBy === 'event_type' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('event_type')}
          >
            Event {sortBy === 'event_type' && (sortOrder === 'desc' ? '↓' : '↑')}
          </Button>
        </div>

        {/* Events List */}
        <div className="relative">
          {isLoadingEvents && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 border-2 border-teams-purple border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600">Loading events...</span>
              </div>
            </div>
          )}
          
          {logs.length === 0 && !isLoadingEvents ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-500 mb-2">
                {searchTerm ? 'No events match your search' : 'No webhook events found'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : logs.length > 0 ? (
            <div className={`space-y-3 ${isLoadingEvents ? 'opacity-50' : ''} transition-opacity`}>
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-green-500 cursor-help">
                              💬
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Teams message sent</p>
                          </TooltipContent>
                        </Tooltip>
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
          ) : null}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} events
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoadingEvents}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      disabled={isLoadingEvents}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoadingEvents}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
} 