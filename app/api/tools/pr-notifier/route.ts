import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/db';
import type { Tool, PRNotifierConfig } from '@/types';

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

    // Ensure config is an object, not a string
    let parsedConfig = config;
    if (typeof config === 'string') {
      try {
        parsedConfig = JSON.parse(config);
      } catch (e) {
        return Response.json({
          success: false,
          error: 'Invalid config format',
        }, { status: 400 });
      }
    }

    // Normalize config: derive targetChatId from targetChat if needed
    if (!parsedConfig.targetChatId && parsedConfig.targetChat?.id) {
      (parsedConfig as any).targetChatId = parsedConfig.targetChat.id;
    }

    // Clean up mentionUsers: remove empty strings
    if (Array.isArray(parsedConfig.mentionUsers)) {
      (parsedConfig as any).mentionUsers = parsedConfig.mentionUsers.filter((u: string) => !!u && u.trim().length > 0);
    }

    // Validate required fields (accept either targetChat or targetChatId)
    const hasTarget = !!parsedConfig.targetChatId || !!parsedConfig.targetChat?.id;
    if (!parsedConfig.azureDevOpsUrl || !hasTarget) {
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
      await executeQuery(`
        INSERT INTO tools (id, name, description, icon, category, is_active, config, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        ['pr-notifier', 'Pull Request Notifier', 'Tự động thông báo team về pull requests mới từ Azure DevOps', '🔔', 'automation', is_active, JSON.stringify(parsedConfig)]
      );
    } else {
      // Update existing tool
      await executeQuery(`
        UPDATE tools 
        SET config = $1, is_active = $2, updated_at = NOW()
        WHERE id = $3`,
        [JSON.stringify(parsedConfig), is_active, 'pr-notifier']
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