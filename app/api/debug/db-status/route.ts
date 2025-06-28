import { NextRequest } from 'next/server';
import { executeQuery, testConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return Response.json({
        success: false,
        error: 'Database connection failed',
        connection: false
      });
    }

    // Get PR notifier tool info
    const prNotifier = await executeQuery(
      'SELECT id, name, is_active, config, created_at, updated_at FROM tools WHERE id = ?',
      ['pr-notifier']
    );

    // Get environment info (safely)
    const envInfo = {
      host: process.env.MYSQL_HOST || 'not-set',
      port: process.env.MYSQL_PORT || 'not-set',
      user: process.env.MYSQL_USER || 'not-set',
      database: process.env.MYSQL_DATABASE || 'not-set',
      hasPassword: !!process.env.MYSQL_PASSWORD
    };

    return Response.json({
      success: true,
      connection: true,
      environment: envInfo,
      prNotifier: prNotifier[0] || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database debug failed:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: false
    }, { status: 500 });
  }
} 