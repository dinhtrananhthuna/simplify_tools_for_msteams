import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/db';
import { validateBasicAuth, createAuthResponse } from '@/lib/auth';
import { PRConfigurationInputSchema, PRConfiguration } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/pr-configurations/[id] - Get specific PR configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Require basic authentication for admin operations
  if (!validateBasicAuth(request)) {
    return createAuthResponse();
  }

  try {
    const { id } = params;
    console.log(`📋 [PR-CONFIGS] Getting configuration ${id}...`);
    
    const configurations = await executeQuery<PRConfiguration>(`
      SELECT * FROM pr_configurations WHERE id = $1
    `, [id]);

    if (configurations.length === 0) {
      return Response.json({
        success: false,
        error: 'Configuration not found',
      }, { status: 404 });
    }

    console.log(`✅ [PR-CONFIGS] Found configuration: ${configurations[0].name}`);

    return Response.json({
      success: true,
      configuration: configurations[0],
    });
  } catch (error) {
    console.error(`❌ [PR-CONFIGS] Failed to get configuration ${params.id}:`, error);
    
    return Response.json({
      success: false,
      error: 'Failed to get PR configuration',
    }, { status: 500 });
  }
}

// PUT /api/pr-configurations/[id] - Update PR configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Require basic authentication for admin operations
  if (!validateBasicAuth(request)) {
    return createAuthResponse();
  }

  try {
    const { id } = params;
    const body = await request.json();
    console.log(`📝 [PR-CONFIGS] Updating configuration ${id}:`, { name: body.name });

    // Validate input
    const validatedInput = PRConfigurationInputSchema.partial().parse(body);
    
    // Check if configuration exists
    const existing = await executeQuery<PRConfiguration>(`
      SELECT * FROM pr_configurations WHERE id = $1
    `, [id]);

    if (existing.length === 0) {
      return Response.json({
        success: false,
        error: 'Configuration not found',
      }, { status: 404 });
    }

    // Check for duplicate org + project combination (excluding current config)
    if (validatedInput.azure_devops_org_url || validatedInput.azure_devops_project !== undefined) {
      const orgUrl = validatedInput.azure_devops_org_url || existing[0].azure_devops_org_url;
      const project = validatedInput.azure_devops_project !== undefined ? 
        validatedInput.azure_devops_project : existing[0].azure_devops_project;

      const duplicateConfig = await executeQuery<{ id: string }>(`
        SELECT id FROM pr_configurations 
        WHERE id != $1 AND azure_devops_org_url = $2 AND COALESCE(azure_devops_project, '') = COALESCE($3, '')
      `, [id, orgUrl, project || null]);

      if (duplicateConfig.length > 0) {
        return Response.json({
          success: false,
          error: 'A configuration already exists for this Azure DevOps organization and project',
        }, { status: 409 });
      }
    }

    // Build dynamic UPDATE query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 2; // $1 is reserved for id

    Object.entries(validatedInput).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return Response.json({
        success: false,
        error: 'No fields to update',
      }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE pr_configurations 
      SET ${updateFields.join(', ')} 
      WHERE id = $1 
      RETURNING *
    `;

    const result = await executeQuery<PRConfiguration>(updateQuery, [id, ...updateValues]);

    if (result.length === 0) {
      throw new Error('Failed to update configuration');
    }

    const updatedConfig = result[0];
    console.log(`✅ [PR-CONFIGS] Updated configuration: ${updatedConfig.name}`);

    return Response.json({
      success: true,
      configuration: updatedConfig,
      message: 'PR configuration updated successfully',
    });

  } catch (error: any) {
    console.error(`❌ [PR-CONFIGS] Failed to update configuration ${params.id}:`, error);
    
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
      error: 'Failed to update PR configuration',
    }, { status: 500 });
  }
}

// DELETE /api/pr-configurations/[id] - Delete PR configuration
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Require basic authentication for admin operations
  if (!validateBasicAuth(request)) {
    return createAuthResponse();
  }

  try {
    const { id } = params;
    console.log(`🗑️ [PR-CONFIGS] Deleting configuration ${id}...`);
    
    // Check if configuration exists
    const existing = await executeQuery<PRConfiguration>(`
      SELECT name FROM pr_configurations WHERE id = $1
    `, [id]);

    if (existing.length === 0) {
      return Response.json({
        success: false,
        error: 'Configuration not found',
      }, { status: 404 });
    }

    // Delete the configuration
    const result = await executeQuery(`
      DELETE FROM pr_configurations WHERE id = $1 RETURNING id
    `, [id]);

    if (result.length === 0) {
      throw new Error('Failed to delete configuration');
    }

    console.log(`✅ [PR-CONFIGS] Deleted configuration: ${existing[0].name}`);

    return Response.json({
      success: true,
      message: 'PR configuration deleted successfully',
    });

  } catch (error) {
    console.error(`❌ [PR-CONFIGS] Failed to delete configuration ${params.id}:`, error);
    
    return Response.json({
      success: false,
      error: 'Failed to delete PR configuration',
    }, { status: 500 });
  }
}