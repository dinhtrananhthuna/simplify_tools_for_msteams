import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  sendSimpleMessage,
  formatPullRequestMessage,
  formatPullRequestMessageHTML,
  TeamsMessageTarget,
} from '@/lib/teams';
import { executeQuery } from '@/lib/db';
import type { PRConfiguration } from '@/types';

export const dynamic = 'force-dynamic';

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

// Type for webhook data (inferred from schema)
type WebhookData = z.infer<typeof AzureDevOpsWebhookSchema>;

// Validate webhook signature (Azure DevOps specific)
function validateWebhookSignature(request: NextRequest, body: string): boolean {
  // Azure DevOps doesn't send standard signature headers
  // Instead, we can validate by checking required fields and structure
  
  // Option 1: Skip signature validation (recommended for Azure DevOps)
  const skipSignature = process.env.AZURE_DEVOPS_SKIP_SIGNATURE === 'true';
  if (skipSignature) {
    return true;
  }
  
  // Option 2: Check for Azure DevOps specific headers
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');
  
  // Basic validation - Azure DevOps webhooks should have these characteristics
  if (contentType?.includes('application/json') && 
      (userAgent?.includes('Azure DevOps') || userAgent?.includes('VSTS'))) {
    return true;
  }
  
  // Option 3: Custom secret validation (if configured in Azure DevOps)
  const customSecret = request.headers.get('x-vss-activityid') || 
                      request.headers.get('x-azure-devops-signature');
  const expectedSecret = process.env.WEBHOOK_SECRET;
  
  if (customSecret && expectedSecret) {
    return customSecret === expectedSecret;
  }
  
  // Default: Allow webhook in development
  return process.env.NODE_ENV !== 'production';
}

// Get first active PR configuration (for legacy webhook compatibility)
async function getFirstPRConfiguration(): Promise<PRConfiguration | null> {
  try {
    console.log('📋 [WEBHOOK] Querying database for first active PR configuration...');
    const result = await executeQuery<PRConfiguration>(
      'SELECT * FROM pr_configurations WHERE is_active = true ORDER BY created_at ASC LIMIT 1'
    );
    
    if (!result || result.length === 0) {
      console.log('❌ [WEBHOOK] No active PR configuration found');
      return null;
    }
    
    const config = result[0];
    console.log(`✅ [WEBHOOK] Found config: ${config.name}`);
    console.log(`🎯 [WEBHOOK] Target: ${config.target_chat_name} (${config.target_chat_id})`);
    
    return config;
  } catch (error) {
    console.error('❌ [WEBHOOK] Failed to get PR configuration:', error);
    return null;
  }
}

// Log webhook event with configuration reference
async function logWebhookEvent(
  configId: string | null,
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
    console.error('Failed to log webhook event:', error);
  }
}

export async function POST(request: NextRequest) {
  let webhookLogged = false; // Track if webhook has been logged
  
  try {
    console.log('🔔 [WEBHOOK] Azure DevOps webhook triggered');
    console.log('⏰ [WEBHOOK] Timestamp:', new Date().toISOString());
    console.log('🌐 [WEBHOOK] Request URL:', request.url);
    console.log('📋 [WEBHOOK] Request method:', request.method);
    console.log('🔑 [WEBHOOK] Headers:', Object.fromEntries(request.headers.entries()));
    
    // Parse request body
    console.log('📝 [WEBHOOK] Parsing request body...');
    const body = await request.text();
    console.log('📏 [WEBHOOK] Body length:', body.length, 'characters');
    console.log('📄 [WEBHOOK] Body preview (first 200 chars):', body.substring(0, 200));
    let webhookData: any;
    
    try {
      console.log('🔄 [WEBHOOK] Attempting JSON parsing...');
      const parsedBody = JSON.parse(body);
      webhookData = parsedBody; // Use flexible parsing for now
      console.log('✅ [WEBHOOK] JSON parsing successful');
      console.log('📊 [WEBHOOK] Event type:', webhookData.eventType);
      console.log('📊 [WEBHOOK] Resource type:', webhookData.resource?.resourceType || 'unknown');
    } catch (error) {
      console.error('❌ [WEBHOOK] JSON parsing failed:', error);
      
      // Log parsing failure
      await logWebhookEvent(null, 'unknown', { error: 'JSON parsing failed' }, 'failed', 'Invalid JSON format');
      webhookLogged = true;
      
      return Response.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    // Validate webhook signature (optional for development)
    console.log('🔐 [WEBHOOK] Validating webhook signature...');
    const signatureValid = validateWebhookSignature(request, body);
    console.log('🔐 [WEBHOOK] Signature valid:', signatureValid, '(NODE_ENV:', process.env.NODE_ENV, ')');
    
    if (!signatureValid && process.env.NODE_ENV === 'production') {
      console.error('❌ [WEBHOOK] Invalid webhook signature');
      
      // Log signature validation failure
      await logWebhookEvent(null, webhookData.eventType || 'unknown', webhookData, 'failed', 'Invalid signature');
      webhookLogged = true;
      
      return Response.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Only process pull request events
    console.log('🔍 [WEBHOOK] Checking event type for PR events...');
    console.log('🔍 [WEBHOOK] Event type check:', {
      eventType: webhookData.eventType,
      includesPullrequest: webhookData.eventType?.includes('pullrequest'),
      includesGitPullrequest: webhookData.eventType?.includes('git.pullrequest')
    });
    
    if (!webhookData.eventType?.includes('pullrequest') && !webhookData.eventType?.includes('git.pullrequest')) {
      console.log('⚠️ [WEBHOOK] Event is not a PR event, skipping processing');
      await logWebhookEvent(
        null,
        webhookData.eventType || 'unknown', 
        webhookData, 
        'success',
        'Event type not processed'
      );
      webhookLogged = true;
      
      return Response.json({
        success: true,
        message: 'Event received but not processed (not a PR event)',
      });
    }
    
    // Get first active PR configuration (legacy compatibility)
    console.log('⚙️ [WEBHOOK] Getting first active PR configuration...');
    const config = await getFirstPRConfiguration();
    console.log('⚙️ [WEBHOOK] Config result:', {
      hasConfig: !!config,
      configName: config?.name,
      targetChatId: config?.target_chat_id,
      configPreview: config ? JSON.stringify(config, null, 2) : 'null'
    });
    
    if (!config || !config.target_chat_id) {
      console.log('❌ [WEBHOOK] No valid PR configuration found');
      await logWebhookEvent(
        config?.id || null,
        webhookData.eventType || 'unknown',
        webhookData,
        'failed',
        'No active PR configuration found or no target chat set'
      );
      webhookLogged = true;
      
      return Response.json(
        { success: false, error: 'No active PR configuration found' },
        { status: 404 }
      );
    }
    
    // Verify this webhook is for the correct organization
    // TODO: Fix organization URL matching logic - currently disabled
    /*
    const resourceOrgUrl = webhookData.resource?.repository?.webUrl || webhookData.resource?.repository?.url;
    if (resourceOrgUrl && !resourceOrgUrl.includes(config.azure_devops_org_url.replace('https://', ''))) {
      console.log(`⚠️ [WEBHOOK] Organization mismatch - expected: ${config.azure_devops_org_url}, got: ${resourceOrgUrl}`);
      await logWebhookEvent(config.id, webhookData.eventType || 'unknown', webhookData, 'failed', 'Organization URL mismatch');
      webhookLogged = true;
      
      return Response.json({
        success: false,
        error: 'Organization URL mismatch',
      }, { status: 400 });
    }
    */
    
    // Filter by project if specified
    if (config.azure_devops_project) {
      const resourceOrgUrl = webhookData.resource?.repository?.webUrl || webhookData.resource?.repository?.url;
      const projectFromUrl = resourceOrgUrl?.split('/').pop()?.split('?')[0];
      if (projectFromUrl && projectFromUrl !== config.azure_devops_project) {
        console.log(`ℹ️ [WEBHOOK] Project filter mismatch - expected: ${config.azure_devops_project}, got: ${projectFromUrl}`);
        await logWebhookEvent(config.id, webhookData.eventType || 'unknown', webhookData, 'success', 'Event ignored (project filter mismatch)');
        webhookLogged = true;
        
        return Response.json({
          success: true,
          message: 'Event ignored (project filter mismatch)',
          expectedProject: config.azure_devops_project,
          actualProject: projectFromUrl,
        });
      }
    }
    
    // Construct Teams target from new configuration format
    const teamsTarget: TeamsMessageTarget = {
      id: config.target_chat_id,
      type: (config.target_chat_type as any) || 'group',
      teamId: config.target_team_id || undefined,
    };

    // Extract resource data with safe fallbacks
    const { resource } = webhookData;
    if (!resource || (!resource.title && !webhookData.message?.text)) {
      await logWebhookEvent(
        config.id,
        webhookData.eventType || 'unknown',
        webhookData,
        'failed',
        'Missing required PR fields in webhook payload'
      );
      webhookLogged = true;
      
      return Response.json(
        { success: false, error: 'Invalid PR data in webhook' },
        { status: 400 }
      );
    }
    
    // Extract pull request data with fallbacks
    const prData = {
      title: resource?.title || webhookData.message?.text || 'Unknown PR',
      author: resource?.createdBy?.displayName || resource?.createdBy?.name || 'Unknown Author',
      repository: resource?.repository?.name || 'Unknown Repository',
      sourceBranch: resource?.sourceRefName?.replace('refs/heads/', '') || 'unknown',
      targetBranch: resource?.targetRefName?.replace('refs/heads/', '') || 'unknown',
      url: resource?._links?.web?.href || resource?.url || resource?.repository?.url || '#',
      description: resource?.description?.trim() || webhookData.message?.text,
      mentions: config.enable_mentions ? config.mention_users : [],
    };
    
    // Send Adaptive Card notification first, fallback to HTML if fails
    let messageId: string;
    let messageType = 'Adaptive Card';
    
    try {
      console.log('📤 [WEBHOOK] Sending Adaptive Card notification to Teams...');
      
      // Generate Adaptive Card for PR notification
      const adaptiveCardMessage = formatPullRequestMessage(prData);
      console.log('🎴 [WEBHOOK] Adaptive Card generated successfully');
      console.log('📋 [WEBHOOK] Adaptive Card preview:', JSON.stringify(adaptiveCardMessage, null, 2));
      
      // Add timeout for Teams message sending
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Teams message send timeout')), 15000); // 15 second timeout
      });
      
      const sendPromise = sendSimpleMessage(
        teamsTarget,
        adaptiveCardMessage,
        'adaptiveCard'
      );
      
      const result = await Promise.race([sendPromise, timeoutPromise]);
      messageId = result as string;
      messageType = 'Adaptive Card';
      
    } catch (error: any) {
      console.error('❌ [WEBHOOK] Adaptive Card send failed:', error.message);
      console.log('🔄 [WEBHOOK] Falling back to HTML message...');
      
      // Fallback to HTML message if Adaptive Card fails
      try {
        const htmlMessage = formatPullRequestMessageHTML(prData);
        console.log('📄 [WEBHOOK] HTML fallback message preview:', htmlMessage.substring(0, 200) + '...');
        
        const fallbackTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('HTML fallback timeout')), 15000);
        });
        
        const fallbackSendPromise = sendSimpleMessage(
          teamsTarget,
          htmlMessage,
          'html'
        );
        
        const fallbackResult = await Promise.race([fallbackSendPromise, fallbackTimeoutPromise]);
        messageId = fallbackResult as string;
        messageType = 'HTML Message (Fallback)';
        
        console.log('✅ [WEBHOOK] HTML fallback message sent successfully');
        
        // Log partial success with fallback
        await logWebhookEvent(
          config.id,
          webhookData.eventType || 'unknown',
          webhookData,
          'success',
          `Adaptive Card failed, HTML fallback used: ${error.message}`,
          messageId
        );
        webhookLogged = true;
        
      } catch (fallbackError: any) {
        console.error('❌ [WEBHOOK] Both Adaptive Card and HTML fallback failed');
        
        // Log complete failure
        await logWebhookEvent(
          config.id,
          webhookData.eventType || 'unknown',
          webhookData,
          'failed',
          `Both Adaptive Card and HTML failed. AC: ${error.message}, HTML: ${fallbackError.message}`
        );
        webhookLogged = true;
        
        // Return more specific error messages
        if (error.message.includes('timeout') || fallbackError.message.includes('timeout')) {
          return Response.json({
            success: false,
            error: 'Teams notification timed out. The webhook was processed but message sending failed.',
          }, { status: 202 }); // 202 Accepted - webhook processed but message may be delayed
        }
        
        return Response.json(
          { success: false, error: 'Failed to send Teams notification (both Adaptive Card and HTML failed)' },
          { status: 500 }
        );
      }
    }
      
    // Log success
    await logWebhookEvent(
      config.id,
      webhookData.eventType,
      webhookData,
      'success',
      undefined,
      messageId
    );
    webhookLogged = true;
    
    return Response.json({
      success: true,
      message: `Pull request notification sent successfully (${messageType})`,
      messageId,
    });
    
  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log unexpected error if not already logged
    if (!webhookLogged) {
      await logWebhookEvent(
        null,
        'unknown',
        { error: errorMessage },
        'failed',
        `Unexpected error: ${errorMessage}`
      );
    }
    
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({
    success: true,
    message: 'Azure DevOps webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  });
} 