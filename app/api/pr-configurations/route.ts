import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/db';
import { PRConfigurationInputSchema, PRConfiguration, PRConfigurationInput } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/pr-configurations - List all PR configurations
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [PR-CONFIGS] Getting all PR configurations...');
    
    const configurations = await executeQuery<PRConfiguration>(`
      SELECT * FROM pr_configurations 
      ORDER BY created_at DESC
    `);

    console.log(`✅ [PR-CONFIGS] Found ${configurations.length} configurations`);

    return Response.json({
      success: true,
      configurations,
      count: configurations.length,
    });
  } catch (error) {
    console.error('❌ [PR-CONFIGS] Failed to get configurations:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to get PR configurations',
    }, { status: 500 });
  }
}

// POST /api/pr-configurations - Create new PR configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 [PR-CONFIGS] Creating new configuration:', { name: body.name, org_url: body.azure_devops_org_url });

    // Validate input
    const validatedInput = PRConfigurationInputSchema.parse(body);
    
    // Check for duplicate org + project combination
    const existingConfig = await executeQuery<{ id: string }>(`
      SELECT id FROM pr_configurations 
      WHERE azure_devops_org_url = $1 AND COALESCE(azure_devops_project, '') = COALESCE($2, '')
    `, [validatedInput.azure_devops_org_url, validatedInput.azure_devops_project || null]);

    if (existingConfig.length > 0) {
      return Response.json({
        success: false,
        error: 'A configuration already exists for this Azure DevOps organization and project',
      }, { status: 409 });
    }

    // Insert new configuration
    const result = await executeQuery<PRConfiguration>(`
      INSERT INTO pr_configurations (
        name,
        azure_devops_org_url,
        azure_devops_project,
        target_chat_id,
        target_chat_name,
        target_chat_type,
        target_team_id,
        enable_mentions,
        mention_users,
        webhook_secret,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      validatedInput.name,
      validatedInput.azure_devops_org_url,
      validatedInput.azure_devops_project || null,
      validatedInput.target_chat_id,
      validatedInput.target_chat_name || null,
      validatedInput.target_chat_type || 'group',
      validatedInput.target_team_id || null,
      validatedInput.enable_mentions || false,
      validatedInput.mention_users || [],
      validatedInput.webhook_secret || null,
      validatedInput.is_active !== false, // Default to true
    ]);

    if (result.length === 0) {
      throw new Error('Failed to create configuration');
    }

    const newConfig = result[0];
    console.log(`✅ [PR-CONFIGS] Created configuration with ID: ${newConfig.id}`);

    return Response.json({
      success: true,
      configuration: newConfig,
      message: 'PR configuration created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [PR-CONFIGS] Failed to create configuration:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return Response.json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }

    return Response.json({
      success: false,
      error: 'Failed to create PR configuration',
    }, { status: 500 });
  }
}