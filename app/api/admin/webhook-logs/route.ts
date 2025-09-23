import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get webhook logs for debugging
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const tool_id = searchParams.get('tool_id') || 'pr-notifier';
    
    const logs = await executeQuery(
      `SELECT id, tool_id, webhook_source, event_type, status, error_message, 
              teams_message_id, processed_at, created_at,
              CASE 
                WHEN length(payload::text) > 500 
                THEN substring(payload::text from 1 for 500) || '...[truncated]'
                ELSE payload::text
              END as payload_preview
       FROM webhook_logs 
       WHERE tool_id = $1
       ORDER BY created_at DESC 
       LIMIT $2`,
      [tool_id, limit]
    );

    return Response.json({
      success: true,
      logs,
      total: logs.length,
      tool_id,
    });

  } catch (error) {
    console.error('Failed to get webhook logs:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to retrieve webhook logs',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Get detailed webhook log by ID
export async function POST(request: NextRequest) {
  try {
    const { logId } = await request.json();
    
    if (!logId) {
      return Response.json({
        success: false,
        error: 'Log ID is required',
      }, { status: 400 });
    }

    const logs = await executeQuery(
      `SELECT * FROM webhook_logs WHERE id = $1`,
      [logId]
    );

    if (logs.length === 0) {
      return Response.json({
        success: false,
        error: 'Log not found',
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      log: logs[0],
    });

  } catch (error) {
    console.error('Failed to get webhook log details:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to retrieve webhook log details',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 