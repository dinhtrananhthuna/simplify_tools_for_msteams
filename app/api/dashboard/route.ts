import { executeQuery } from '../../../lib/db';
import type { Tool, WebhookLog } from '../../../types';

export const dynamic = 'force-dynamic';

interface DashboardStats {
  totalTools: number;
  activeTools: number;
  totalWebhooks: number;
  successfulWebhooks: number;
  failedWebhooks: number;
  recentWebhooks: WebhookLog[];
  tools: Tool[];
}

export async function GET() {
  try {
    // Get tools statistics
    const toolsResult = await executeQuery<{ 
      total: number; 
      active: number; 
    }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active THEN 1 END) as active
      FROM tools
    `);
    
    const toolStats = toolsResult[0] || { total: 0, active: 0 };

    // Get webhooks statistics
    const webhookStatsResult = await executeQuery<{
      total: number;
      successful: number;
      failed: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM webhook_logs
    `);
    
    const webhookStats = webhookStatsResult[0] || { total: 0, successful: 0, failed: 0 };

    // Get recent webhooks (last 10)
    const recentWebhooks = await executeQuery<WebhookLog>(`
      SELECT 
        id, tool_id, webhook_source, event_type, status, 
        error_message, created_at
      FROM webhook_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get all tools
    const tools = await executeQuery<Tool>(`
      SELECT 
        id, name, description, icon, category, is_active, 
        config, created_at, updated_at
      FROM tools
      ORDER BY created_at DESC
    `);

    const stats: DashboardStats = {
      totalTools: parseInt(toolStats.total.toString()),
      activeTools: parseInt(toolStats.active.toString()),
      totalWebhooks: parseInt(webhookStats.total.toString()),
      successfulWebhooks: parseInt(webhookStats.successful.toString()),
      failedWebhooks: parseInt(webhookStats.failed.toString()),
      recentWebhooks,
      tools,
    };

    return Response.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    
    // Return empty stats on error to prevent dashboard from crashing
    const emptyStats: DashboardStats = {
      totalTools: 0,
      activeTools: 0,
      totalWebhooks: 0,
      successfulWebhooks: 0,
      failedWebhooks: 0,
      recentWebhooks: [],
      tools: [],
    };

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: emptyStats,
    }, { status: 500 });
  }
} 