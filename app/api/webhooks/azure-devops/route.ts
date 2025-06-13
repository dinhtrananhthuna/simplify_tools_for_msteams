import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sendSimpleMessage } from '@/lib/teams-simple';
import { formatPullRequestMessage, formatPullRequestMessageHTML } from '@/lib/teams';
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
    const result = await executeQuery<{ config: any }>(
      'SELECT config FROM tools WHERE id = $1 AND is_active = true',
      ['pr-notifier']
    );
    
    return result[0]?.config || null;
  } catch (error) {
    console.error('Failed to get PR notifier config:', error);
    return null;
  }
}

// Log webhook event
async function logWebhookEvent(
  eventType: string,
  payload: any,
  status: 'pending' | 'success' | 'failed',
  error?: string,
  teamsMessageId?: string
) {
  try {
    await executeQuery(
      `INSERT INTO webhook_logs (tool_id, webhook_source, event_type, payload, status, error_message, teams_message_id, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'pr-notifier',
        'azure-devops',
        eventType,
        JSON.stringify(payload),
        status,
        error || null,
        teamsMessageId || null,
        status !== 'pending' ? new Date() : null,
      ]
    );
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.text();
    let webhookData: any;
    
    try {
      const parsedBody = JSON.parse(body);
      webhookData = parsedBody; // Use flexible parsing for now
    } catch (error) {
      console.error('❌ JSON parsing failed:', error);
      return Response.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    // Validate webhook signature (optional for development)
    const signatureValid = validateWebhookSignature(request, body);
    if (!signatureValid && process.env.NODE_ENV === 'production') {
      console.error('❌ Invalid webhook signature');
      return Response.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Log initial webhook event
    await logWebhookEvent(webhookData.eventType || 'unknown', webhookData, 'pending');
    
    // Only process pull request events
    if (!webhookData.eventType?.includes('pullrequest') && !webhookData.eventType?.includes('git.pullrequest')) {
      await logWebhookEvent(
        webhookData.eventType || 'unknown', 
        webhookData, 
        'success',
        'Event type not processed'
      );
      
      return Response.json({
        success: true,
        message: 'Event received but not processed (not a PR event)',
      });
    }
    
    // Get PR Notifier configuration
    const config = await getPRNotifierConfig();
    if (!config) {
      await logWebhookEvent(
        webhookData.eventType || 'unknown',
        webhookData,
        'failed',
        'PR Notifier not configured or not active'
      );
      
      return Response.json(
        { success: false, error: 'PR Notifier not configured' },
        { status: 404 }
      );
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
      console.log('📤 Webhook: Attempting to send Adaptive Card to Teams...');
      
      const adaptiveCardMessage = formatPullRequestMessage(prData);
      
      // Add timeout for Teams message sending
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Teams message send timeout')), 15000); // 15 second timeout
      });
      
      const sendPromise = sendSimpleMessage(
        config.targetChatId,
        adaptiveCardMessage,
        'adaptiveCard'
      );
      
      messageId = await Promise.race([sendPromise, timeoutPromise]) as string;
      console.log('✅ Webhook: Teams Adaptive Card sent successfully');
      
    } catch (adaptiveCardError) {
      console.log('⚠️ Adaptive Card failed, trying HTML fallback...', adaptiveCardError);
      
      try {
        // Fallback to HTML message
        const htmlMessage = formatPullRequestMessageHTML(prData);
        messageType = 'HTML';
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Teams message send timeout')), 15000); // 15 second timeout
        });
        
        const sendPromise = sendSimpleMessage(
          config.targetChatId,
          htmlMessage,
          'html'
        );
        
        messageId = await Promise.race([sendPromise, timeoutPromise]) as string;
        console.log('✅ Webhook: Teams HTML message sent successfully');
        
      } catch (htmlError) {
        // Both methods failed
        const errorMessage = htmlError instanceof Error ? htmlError.message : 'Unknown error';
        
        console.error('❌ Webhook: Failed to send Teams message:', htmlError);
        
        // Log failure
        await logWebhookEvent(
          webhookData.eventType || 'unknown',
          webhookData,
          'failed',
          errorMessage
        );
        
        // Return more specific error messages
        if (errorMessage.includes('timeout')) {
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
    }
      
    // Log success
    await logWebhookEvent(
      webhookData.eventType,
      webhookData,
      'success',
      undefined,
      messageId
    );
    
    return Response.json({
      success: true,
      message: `Pull request notification sent successfully (${messageType})`,
      messageId,
    });
    
  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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