import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('tool_id');

    // Build query with optional tool filter
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM webhook_logs
    `;
    
    const params: any[] = [];
    
    if (toolId) {
      query += ' WHERE tool_id = ?';
      params.push(toolId);
    }

    const result = await executeQuery(query, params);
    const stats = result[0];
    const total = parseInt(stats.total);
    const success = parseInt(stats.success);
    const failed = parseInt(stats.failed);
    
    const successRate = total > 0 ? (success / total) * 100 : 100;

    return NextResponse.json({
      total,
      success,
      failed,
      successRate
    });

  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook statistics' },
      { status: 500 }
    );
  }
} 
