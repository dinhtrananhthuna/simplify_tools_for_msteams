import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  sendTeamsMessage,
  formatPullRequestMessage,
  formatPullRequestMessageHTML,
  TeamsMessageTarget,
} from '@/lib/teams';
import { executeQuery } from '@/lib/db';
import type { PRConfiguration } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    configId: string;
  };
}

// Validation schema for Azure DevOps webhook
const AzureDevOpsWebhookSchema = z.object({
  subscriptionId: z.string().optional(),
  notificationId: z.number().optional(),
  id: z.string(),
  eventType: z.string(),
  publisherId: z.string(),
  message: z.object({
    text: z.string(),
    html: z.string(),
    markdown: z.string(),
  }).nullable().optional(),
  detailedMessage: z.object({
    text: z.string(),
    html: z.string(),
    markdown: z.string(),
  }).nullable().optional(),
  resource: z.object({
    pullRequestId: z.number().optional(),
    id: z.number().optional(),
    status: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    sourceRefName: z.string().optional(),
    targetRefName: z.string().optional(),
    repository: z.object({
      id: z.string(),
      name: z.string(),
      webUrl: z.string().optional(),
      url: z.string().optional(),
    }).optional(),
    createdBy: z.object({
      displayName: z.string(),
      uniqueName: z.string().optional(),
      id: z.string().optional(),
    }).optional(),
    url: z.string().optional(),
    creationDate: z.string().optional(),
    // Allow any additional fields that might be present
  }).passthrough(),
  resourceVersion: z.string(),
  resourceContainers: z.record(z.any()),
  createdDate: z.string(),
}).passthrough(); // Allow additional fields

type WebhookData = z.infer<typeof AzureDevOpsWebhookSchema>;

// Validate webhook signature (Azure DevOps specific)
function validateWebhookSignature(request: NextRequest, body: string, config: PRConfiguration): boolean {
  // Option 1: Skip signature validation (recommended for Azure DevOps)
  const skipSignature = process.env.AZURE_DEVOPS_SKIP_SIGNATURE === 'true';
  if (skipSignature) {
    return true;
  }
  
  // Option 2: Use configuration-specific webhook secret
  if (config.webhook_secret) {
    const signature = request.headers.get('x-azure-devops-signature');
    return signature === config.webhook_secret;
  }
  
  // Option 3: Check for Azure DevOps specific headers
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');
  
  // Basic validation - Azure DevOps webhooks should have these characteristics
  if (contentType?.includes('application/json') && 
      (userAgent?.includes('Azure DevOps') || userAgent?.includes('VSTS'))) {
    return true;
  }
  
  // Default: Allow webhook in development
  return process.env.NODE_ENV !== 'production';
}

// Get specific PR configuration by ID
async function getPRConfiguration(configId: string): Promise<PRConfiguration | null> {
  try {
    console.log(`📋 [WEBHOOK-${configId}] Querying database for PR configuration...`);
    const result = await executeQuery<PRConfiguration>(
      'SELECT * FROM pr_configurations WHERE id = $1 AND is_active = true',
      [configId]
    );
    
    if (!result || result.length === 0) {
      console.log(`❌ [WEBHOOK-${configId}] No active PR configuration found`);
      return null;
    }
    
    const config = result[0];
    console.log(`✅ [WEBHOOK-${configId}] Found config: ${config.name}`);
    console.log(`🎯 [WEBHOOK-${configId}] Target: ${config.target_chat_name} (${config.target_chat_id})`);
    
    return config;
  } catch (error) {
    console.error(`❌ [WEBHOOK-${configId}] Failed to get PR configuration:`, error);
    return null;
  }
}

// Log webhook event with configuration reference
async function logWebhookEvent(
  configId: string,
  eventType: string,
  payload: any,
  status: 'success' | 'failed',
  error?: string,
  teamsMessageId?: string
) {
  try {
    await executeQuery(`
      INSERT INTO webhook_logs 
      (config_id, tool_id, webhook_source, event_type, payload, status, teams_message_id, error_message, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        configId,
        'pr-notifier',
        'azure-devops',
        eventType,
        JSON.stringify(payload),
        status,
        teamsMessageId || null,
        error || null,
        new Date(),
      ]
    );
  } catch (error) {
    console.error(`Failed to log webhook event for config ${configId}:`, error);
  }
}

// Main webhook handler
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { configId } = params;
  const startTime = Date.now();
  
  console.log(`🚀 [WEBHOOK-${configId}] Azure DevOps webhook started`);
  console.log(`⏰ [WEBHOOK-${configId}] Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Get configuration
    const config = await getPRConfiguration(configId);
    if (!config) {
      await logWebhookEvent(configId, 'unknown', {}, 'failed', 'Configuration not found or inactive');
      return Response.json({
        success: false,
        error: 'Configuration not found or inactive',
        configId,
      }, { status: 404 });
    }
    
    // Parse webhook body
    const body = await request.text();
    console.log(`📦 [WEBHOOK-${configId}] Received payload (${body.length} bytes)`);
    
    // Validate webhook signature
    if (!validateWebhookSignature(request, body, config)) {
      console.log(`❌ [WEBHOOK-${configId}] Webhook signature validation failed`);
      await logWebhookEvent(configId, 'unknown', {}, 'failed', 'Invalid webhook signature');
      return Response.json({
        success: false,
        error: 'Invalid webhook signature',
      }, { status: 401 });
    }
    
    // Parse and validate webhook data
    let webhookData: WebhookData;
    try {
      webhookData = AzureDevOpsWebhookSchema.parse(JSON.parse(body));
    } catch (parseError: any) {
      console.error(`❌ [WEBHOOK-${configId}] Invalid webhook payload:`, parseError);
      await logWebhookEvent(configId, 'invalid', JSON.parse(body || '{}'), 'failed', 'Invalid webhook payload format');
      return Response.json({
        success: false,
        error: 'Invalid webhook payload',
      }, { status: 400 });
    }
    
    console.log(`📋 [WEBHOOK-${configId}] Event: ${webhookData.eventType}`);
    console.log(`📊 [WEBHOOK-${configId}] Publisher: ${webhookData.publisherId}`);
    
    // Check if this is a pull request event
    if (!webhookData.eventType.includes('pullrequest') && !webhookData.eventType.includes('git.pullrequest')) {
      console.log(`ℹ️ [WEBHOOK-${configId}] Ignoring non-PR event: ${webhookData.eventType}`);
      await logWebhookEvent(configId, webhookData.eventType, webhookData, 'success', 'Event ignored (not a PR event)');
      return Response.json({
        success: true,
        message: 'Event ignored (not a pull request event)',
        eventType: webhookData.eventType,
      });
    }
    
    // Extract PR information
    const { resource } = webhookData;
    if (!resource) {
      console.log(`❌ [WEBHOOK-${configId}] No resource data in webhook`);
      await logWebhookEvent(configId, webhookData.eventType, webhookData, 'failed', 'No resource data in webhook');
      return Response.json({
        success: false,
        error: 'No resource data in webhook',
      }, { status: 400 });
    }
    
    // Verify this webhook is for the correct organization
    // TODO: Fix organization URL matching logic - currently disabled
    /*
    const resourceOrgUrl = resource.repository?.webUrl || resource.repository?.url;
    if (resourceOrgUrl && !resourceOrgUrl.includes(config.azure_devops_org_url.replace('https://', ''))) {
      console.log(`⚠️ [WEBHOOK-${configId}] Organization mismatch - expected: ${config.azure_devops_org_url}, got: ${resourceOrgUrl}`);
      await logWebhookEvent(configId, webhookData.eventType, webhookData, 'failed', 'Organization URL mismatch');
      return Response.json({
        success: false,
        error: 'Organization URL mismatch',
      }, { status: 400 });
    }
    */
    
    // Filter by project if specified
    if (config.azure_devops_project) {
      const resourceOrgUrl = resource.repository?.webUrl || resource.repository?.url;
      const projectFromUrl = resourceOrgUrl?.split('/').pop()?.split('?')[0];
      if (projectFromUrl && projectFromUrl !== config.azure_devops_project) {
        console.log(`ℹ️ [WEBHOOK-${configId}] Project filter mismatch - expected: ${config.azure_devops_project}, got: ${projectFromUrl}`);
        await logWebhookEvent(configId, webhookData.eventType, webhookData, 'success', 'Event ignored (project filter mismatch)');
        return Response.json({
          success: true,
          message: 'Event ignored (project filter mismatch)',
          expectedProject: config.azure_devops_project,
          actualProject: projectFromUrl,
        });
      }
    }
    
    // Prepare PR data for Teams message
    const prData = {
      title: resource.title || 'Pull Request',
      author: resource.createdBy?.displayName || 'Unknown',
      repository: resource.repository?.name || 'Unknown Repository',
      sourceBranch: resource.sourceRefName?.replace('refs/heads/', '') || 'unknown',
      targetBranch: resource.targetRefName?.replace('refs/heads/', '') || 'main',
      url: resource.url || '#',
      description: resource.description?.trim() || '',
      mentions: config.enable_mentions ? config.mention_users : [],
    };
    
    console.log(`📝 [WEBHOOK-${configId}] PR Data:`, {
      title: prData.title,
      author: prData.author,
      repository: prData.repository,
      branches: `${prData.sourceBranch} → ${prData.targetBranch}`,
      mentionsEnabled: config.enable_mentions,
      mentionCount: prData.mentions.length,
    });
    
    // Construct Teams target
    const teamsTarget: TeamsMessageTarget = {
      id: config.target_chat_id,
      type: (config.target_chat_type as any) || 'group',
      teamId: config.target_team_id || undefined,
    };
    
    // Send Teams message
    console.log(`📤 [WEBHOOK-${configId}] Sending Teams message...`);
    let messageId: string;
    let messageType: string;
    
    try {
      // Try Adaptive Card first
      const adaptiveCardMessage = formatPullRequestMessage(prData);
      messageId = await sendTeamsMessage(teamsTarget, adaptiveCardMessage, 'adaptiveCard');
      messageType = 'Adaptive Card';
      console.log(`✅ [WEBHOOK-${configId}] Adaptive Card sent successfully: ${messageId}`);
      
    } catch (cardError: any) {
      console.log(`⚠️ [WEBHOOK-${configId}] Adaptive Card failed, trying HTML fallback:`, cardError.message);
      
      try {
        // Fallback to HTML
        const htmlMessage = formatPullRequestMessageHTML(prData);
        messageId = await sendTeamsMessage(teamsTarget, htmlMessage, 'html');
        messageType = 'HTML';
        console.log(`✅ [WEBHOOK-${configId}] HTML message sent successfully: ${messageId}`);
        
      } catch (htmlError: any) {
        console.error(`❌ [WEBHOOK-${configId}] Both message formats failed:`, htmlError.message);
        throw htmlError;
      }
    }
    
    // Log successful webhook processing
    await logWebhookEvent(configId, webhookData.eventType, webhookData, 'success', undefined, messageId);
    
    const processingTime = Date.now() - startTime;
    console.log(`🎉 [WEBHOOK-${configId}] Webhook processed successfully in ${processingTime}ms`);
    
    return Response.json({
      success: true,
      message: 'Pull request notification sent successfully',
      configId,
      configName: config.name,
      messageId,
      messageType,
      processingTime,
      eventType: webhookData.eventType,
      prData: {
        title: prData.title,
        author: prData.author,
        repository: prData.repository,
      },
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`💥 [WEBHOOK-${configId}] Webhook processing failed:`, error);
    
    await logWebhookEvent(configId, 'unknown', {}, 'failed', error.message);
    
    return Response.json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
      configId,
      processingTime,
    }, { status: 500 });
  }
}

// GET endpoint for webhook info
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { configId } = params;
  
  try {
    const config = await getPRConfiguration(configId);
    
    if (!config) {
      return Response.json({
        success: false,
        error: 'Configuration not found or inactive',
      }, { status: 404 });
    }
    
    return Response.json({
      success: true,
      message: 'Azure DevOps webhook endpoint for specific configuration',
      configId,
      configName: config.name,
      organization: config.azure_devops_org_url,
      project: config.azure_devops_project || 'All projects',
      targetChat: config.target_chat_name || config.target_chat_id,
      webhookUrl: `${request.nextUrl.origin}/api/webhooks/azure-devops/${configId}`,
      isActive: config.is_active,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Failed to get webhook information',
    }, { status: 500 });
  }
}