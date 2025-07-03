import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  sendSimpleMessage,
  formatPullRequestMessage,
  formatPullRequestMessageHTML,
  TeamsMessageTarget,
} from '@/lib/teams';
import { executeQuery } from '@/lib/db';
import type { PRNotifierConfig } from '@/types';

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
  }).optional(),
  detailedMessage: z.object({
    text: z.string(),
    html: z.string(),
    markdown: z.string(),
  }).optional(),
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

// Get PR Notifier configuration
async function getPRNotifierConfig(): Promise<PRNotifierConfig | null> {
  try {
    console.log('📋 [WEBHOOK] Querying database for PR Notifier config...');
    const result = await executeQuery<{ config: any }>(
      'SELECT config FROM tools WHERE id = ? AND is_active = true',
      ['pr-notifier']
    );
    
    if (!result || result.length === 0) {
      console.log('❌ [WEBHOOK] No active PR Notifier found in database');
      return null;
    }
    
    let config = result[0]?.config;
    console.log('📊 [WEBHOOK] Raw config from database:', typeof config, JSON.stringify(config));
    
    if (!config) {
      console.log('❌ [WEBHOOK] Config is null/undefined');
      return null;
    }
    
    // Handle double-encoded JSON strings
    if (typeof config === 'string') {
      try {
        console.log('🔄 [WEBHOOK] Parsing config string...');
        config = JSON.parse(config);
        console.log('✅ [WEBHOOK] First parse successful, type:', typeof config);
        
        // Check if it's still a string (double-encoded)
        if (typeof config === 'string') {
          console.log('🔄 [WEBHOOK] Config is still string, parsing again...');
          config = JSON.parse(config);
          console.log('✅ [WEBHOOK] Second parse successful, type:', typeof config);
        }
      } catch (parseError) {
        console.error('❌ [WEBHOOK] Failed to parse config JSON:', parseError);
        return null;
      }
    }
    
    console.log('📊 [WEBHOOK] Final parsed config:', JSON.stringify(config, null, 2));
    console.log('🔍 [WEBHOOK] Config validation:', {
      hasTargetChat: !!config?.targetChat,
      hasTargetChatId: !!config?.targetChatId,
      targetChatId: config?.targetChat?.id || config?.targetChatId,
      targetChatType: config?.targetChat?.type
    });
    
    return config;
  } catch (error) {
    console.error('❌ [WEBHOOK] Failed to get PR notifier config:', error);
    return null;
  }
}

// Log webhook event
async function logWebhookEvent(
  eventType: string,
  payload: any,
  status: 'success' | 'failed',
  error?: string,
  teamsMessageId?: string
) {
  try {
    await executeQuery(`
      INSERT INTO webhook_logs 
      (tool_id, webhook_source, event_type, payload, status, teams_message_id, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      await logWebhookEvent('unknown', { error: 'JSON parsing failed' }, 'failed', 'Invalid JSON format');
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
      await logWebhookEvent(webhookData.eventType || 'unknown', webhookData, 'failed', 'Invalid signature');
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
    
    // Get PR Notifier configuration
    console.log('⚙️ [WEBHOOK] Getting PR Notifier configuration...');
    const config = await getPRNotifierConfig();
    console.log('⚙️ [WEBHOOK] Config result:', {
      hasConfig: !!config,
      hasTargetChat: !!config?.targetChat,
      hasTargetChatId: !!config?.targetChatId,
      configPreview: config ? JSON.stringify(config, null, 2) : 'null'
    });
    
    if (!config || (!config.targetChat && !config.targetChatId)) {
      console.log('❌ [WEBHOOK] No valid PR Notifier configuration found');
      await logWebhookEvent(
        webhookData.eventType || 'unknown',
        webhookData,
        'failed',
        'PR Notifier not configured, not active, or no target chat set'
      );
      webhookLogged = true;
      
      return Response.json(
        { success: false, error: 'PR Notifier not configured or no chat selected' },
        { status: 404 }
      );
    }
    
    // Determine the target for the message
    let teamsTarget: TeamsMessageTarget;
    if (config.targetChat) {
      teamsTarget = config.targetChat;
    } else if (config.targetChatId) {
      // Backward compatibility: Old config only has the ID.
      // We have to assume it's a 'group' chat and has no teamId.
      // This will fail for channels, user must re-save config.
      teamsTarget = { id: config.targetChatId, type: 'group' };
    } else {
      // This case is handled by the check above, but for type safety
      throw new Error('No target chat configured.');
    }

    // Extract resource data with safe fallbacks
    const { resource } = webhookData;
    if (!resource || (!resource.title && !webhookData.message?.text)) {
      await logWebhookEvent(
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
      mentions: config.enableMentions ? config.mentionUsers : [],
    };
    
    // Try to send Adaptive Card first, fallback to HTML if fails
    let messageId: string;
    let messageType = 'Adaptive Card';
    
    try {
      console.log('📤 Webhook: Sending HTML message to Teams...');
      
      // Microsoft Graph API for chat messages does NOT support Adaptive Cards
      // Only HTML and text are supported contentTypes for body
      const htmlMessage = formatPullRequestMessageHTML(prData);
      console.log('📄 [WEBHOOK] HTML message preview:', htmlMessage.substring(0, 200) + '...');
      
      // Add timeout for Teams message sending
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Teams message send timeout')), 15000); // 15 second timeout
      });
      
      const sendPromise = sendSimpleMessage(
        teamsTarget,
        htmlMessage,
        'html'
      );
      
      const result = await Promise.race([sendPromise, timeoutPromise]);
      messageId = result as string;
      messageType = 'HTML Message';
      
    } catch (error: any) {
      console.error('❌ Webhook: HTML message send failed:', error.message);
      
      // Log failure
      await logWebhookEvent(
        webhookData.eventType || 'unknown',
        webhookData,
        'failed',
        error.message
      );
      webhookLogged = true;
      
      // Return more specific error messages
      if (error.message.includes('timeout')) {
        return Response.json({
          success: false,
          error: 'Teams notification timed out. The webhook was processed but message sending failed.',
        }, { status: 202 }); // 202 Accepted - webhook processed but message may be delayed
      }
      
      return Response.json(
        { success: false, error: 'Failed to send Teams notification' },
        { status: 500 }
      );
    }
      
    // Log success
    await logWebhookEvent(
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