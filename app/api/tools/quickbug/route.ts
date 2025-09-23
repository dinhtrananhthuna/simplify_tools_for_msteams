import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
  created_at: Date;
  updated_at: Date;
}

interface QuickbugConfig {
  defaultEnvironment?: string;
  severityLevels?: string[];
}

// Get Quickbug tool configuration
export async function GET() {
  try {
    const result = await executeQuery<QuickbugTool>(
      'SELECT * FROM tools WHERE id = $1',
      ['quickbug']
    );

    if (result.length === 0) {
      return Response.json({
        success: true,
        tool: null,
      });
    }

    return Response.json({
      success: true,
      tool: result[0],
    });
  } catch (error) {
    console.error('Failed to get Quickbug tool config:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to get configuration',
    }, { status: 500 });
  }
}

// Save Quickbug tool configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, is_active } = body as {
      config: QuickbugConfig;
      is_active: boolean;
    };

    // Validate config
    if (config.severityLevels && config.severityLevels.length === 0) {
      return Response.json({
        success: false,
        error: 'At least one severity level is required',
      }, { status: 400 });
    }

    // Check if tool exists
    const existing = await executeQuery<QuickbugTool>(
      'SELECT id FROM tools WHERE id = $1',
      ['quickbug']
    );

    if (existing.length === 0) {
      // Create new tool
      await executeQuery(`
        INSERT INTO tools (id, name, description, icon, category, is_active, config, created_at, updated_at, tool_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        ['quickbug', 'Quick Bug Reporter', 'Teams Message Extension để báo cáo bug nhanh với Adaptive Cards', '🐞', 'productivity', is_active, JSON.stringify(config), new Date(), new Date(), 'bug_reporter']
      );
    } else {
      // Update existing tool
      await executeQuery(`
        UPDATE tools 
        SET config = $1, is_active = $2, updated_at = $3
        WHERE id = $4`,
        [JSON.stringify(config), is_active, new Date(), 'quickbug']
      );
    }

    return Response.json({
      success: true,
      message: 'Configuration saved successfully',
    });
  } catch (error) {
    console.error('Failed to save Quickbug tool config:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to save configuration',
    }, { status: 500 });
  }
} 