import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sendMessageToChat, formatPullRequestMessage } from '../../../../lib/teams';
import { executeQuery } from '../../../../lib/db';
import type { PRNotifierConfig } from '../../../../types';

export const dynamic = 'force-dynamic';

// Validation schema for Azure DevOps webhook
const AzureDevOpsWebhookSchema = z.object({
  eventType: z.string(),
  publisherId: z.string(),
  resource: z.object({
    pullRequestId: z.number(),
    status: z.string(),
    title: z.string(),
    description: z.string().optional(),
    sourceRefName: z.string(),
    targetRefName: z.string(),
    repository: z.object({
      id: z.string(),
      name: z.string(),
      webUrl: z.string(),
    }),
    createdBy: z.object({
      displayName: z.string(),
      uniqueName: z.string(),
    }),
    url: z.string(),
    creationDate: z.string(),
  }),
  resourceVersion: z.string(),
  resourceContainers: z.record(z.any()),
  createdDate: z.string(),
});

// Type for webhook data (inferred from schema)
type WebhookData = z.infer<typeof AzureDevOpsWebhookSchema>;

// Validate webhook signature (basic security)
function validateWebhookSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-webhook-signature');
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!signature || !secret) {
    return false;
  }
  
  // In production, implement proper HMAC validation
  // For now, simple token check
  return signature === secret;
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
    let webhookData: WebhookData;
    
    try {
      const parsedBody = JSON.parse(body);
      webhookData = AzureDevOpsWebhookSchema.parse(parsedBody);
    } catch (error) {
      console.error('Invalid webhook payload:', error);
      return Response.json(
        { success: false, error: 'Invalid payload format' },
        { status: 400 }
      );
    }
    
    // Validate webhook signature
    if (!validateWebhookSignature(request, body)) {
      console.error('Invalid webhook signature');
      return Response.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Log initial webhook event
    await logWebhookEvent(webhookData.eventType, webhookData, 'pending');
    
    // Only process pull request created events
    if (webhookData.eventType !== 'git.pullrequest.created') {
      await logWebhookEvent(
        webhookData.eventType, 
        webhookData, 
        'success',
        'Event type not processed'
      );
      
      return Response.json({
        success: true,
        message: 'Event received but not processed (not a PR creation)',
      });
    }
    
    // Get PR Notifier configuration
    const config = await getPRNotifierConfig();
    if (!config) {
      await logWebhookEvent(
        webhookData.eventType,
        webhookData,
        'failed',
        'PR Notifier not configured or not active'
      );
      
      return Response.json(
        { success: false, error: 'PR Notifier not configured' },
        { status: 404 }
      );
    }
    
    // Extract pull request data
    const { resource } = webhookData;
    const prData = {
      title: resource.title,
      author: resource.createdBy.displayName,
      repository: resource.repository.name,
      sourceBranch: resource.sourceRefName.replace('refs/heads/', ''),
      targetBranch: resource.targetRefName.replace('refs/heads/', ''),
      url: resource.url,
      description: resource.description,
      mentions: config.enableMentions ? config.mentionUsers : [],
    };
    
    // Format message for Teams
    const message = formatPullRequestMessage(prData);
    
    // Send message to Teams chat
    try {
      console.log('📤 Webhook: Sending message to Teams...');
      
      // Add timeout for Teams message sending
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Teams message send timeout')), 20000); // 20 second timeout
      });
      
      const sendPromise = sendMessageToChat(
        config.targetChatId,
        message,
        'html'
      );
      
      const messageId = await Promise.race([sendPromise, timeoutPromise]) as string;
      
      console.log('✅ Webhook: Teams message sent successfully');
      
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
        message: 'Pull request notification sent successfully',
        messageId,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ Webhook: Failed to send Teams message:', error);
      
      // Log failure
      await logWebhookEvent(
        webhookData.eventType,
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