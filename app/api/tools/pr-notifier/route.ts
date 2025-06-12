import { NextRequest } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import type { Tool, PRNotifierConfig } from '../../../../types';

export const dynamic = 'force-dynamic';

// Get PR Notifier configuration
export async function GET() {
  try {
    const result = await executeQuery<Tool>(
      'SELECT * FROM tools WHERE id = $1',
      ['pr-notifier']
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
    console.error('Failed to get PR notifier config:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to get configuration',
    }, { status: 500 });
  }
}

// Save PR Notifier configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, is_active } = body as {
      config: PRNotifierConfig;
      is_active: boolean;
    };

    // Validate required fields
    if (!config.azureDevOpsUrl || !config.targetChatId) {
      return Response.json({
        success: false,
        error: 'Azure DevOps URL and target chat are required',
      }, { status: 400 });
    }

    // Check if tool exists
    const existing = await executeQuery<Tool>(
      'SELECT id FROM tools WHERE id = $1',
      ['pr-notifier']
    );

    if (existing.length === 0) {
      // Create new tool
      await executeQuery(
        `INSERT INTO tools (id, name, description, icon, category, is_active, config, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'pr-notifier',
          'Pull Request Notifier',
          'Tự động thông báo team về pull requests mới từ Azure DevOps',
          '🔔',
          'automation',
          is_active,
          JSON.stringify(config),
          new Date(),
          new Date(),
        ]
      );
    } else {
      // Update existing tool
      await executeQuery(
        `UPDATE tools 
         SET config = $1, is_active = $2, updated_at = $3
         WHERE id = $4`,
        [
          JSON.stringify(config),
          is_active,
          new Date(),
          'pr-notifier',
        ]
      );
    }

    return Response.json({
      success: true,
      message: 'Configuration saved successfully',
    });
  } catch (error) {
    console.error('Failed to save PR notifier config:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to save configuration',
    }, { status: 500 });
  }
} 